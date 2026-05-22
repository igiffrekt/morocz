import { and, eq, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingHistory as bookingHistoryTable } from "@/lib/db/schema";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

export type HistoricalAppointment = {
  id: string;
  date: string;
  time: string;
  service: string;
  duration: number;
  staff: string;
  payment: number;
  createdAt: string;
  source: string;
};

export type AppointmentHistoryDoc = {
  _id: string;
  patientEmail: string;
  appointments: HistoricalAppointment[];
  matchedAt: string;
  matchConfidence: "email_match" | "manual";
};

/**
 * GET /api/admin/history
 * Query params:
 *   - email: filter by patient email
 *   - dateFrom: filter from date (YYYY-MM-DD)
 *   - dateTo: filter to date (YYYY-MM-DD)
 *   - search: search by email/service name
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase().trim();
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const search = url.searchParams.get("search")?.toLowerCase();

    const today = new Date().toISOString().split("T")[0];
    const client = getWriteClient();

    // ── 1. Legacy appointmentHistory docs ────────────────────────────────────
    let importQuery = `*[_type == "appointmentHistory"`;
    if (email) importQuery += ` && patientEmail == "${email}"`;
    importQuery += `] | order(matchedAt desc)`;
    const importedDocs = await client.fetch<AppointmentHistoryDoc[]>(importQuery);

    // ── 2. Past Sanity booking docs (confirmed/completed/cancelled/no-show) ──
    type SanityBookingRow = {
      _id: string;
      _createdAt: string;
      patientEmail: string;
      slotDate: string;
      slotTime: string;
      serviceName: string | null;
      serviceDuration: number | null;
    };
    const sanityParams: Record<string, string> = { today };
    let sanityFilter = `_type == "booking" && !(_id in path("drafts.**")) && slotDate <= $today && status in ["confirmed", "completed", "cancelled", "no-show"]`;
    if (email) {
      sanityFilter += ` && patientEmail == $emailParam`;
      sanityParams.emailParam = email;
    }
    const sanityBookings = await client.fetch<SanityBookingRow[]>(
      `*[${sanityFilter}] | order(slotDate desc) { _id, _createdAt, patientEmail, slotDate, slotTime, "serviceName": service->name, "serviceDuration": service->appointmentDuration }`,
      sanityParams,
    );

    // ── 3. Postgres bookingHistory ────────────────────────────────────────────
    const pgConditions = [lte(bookingHistoryTable.date, today)];
    if (email) pgConditions.push(eq(bookingHistoryTable.patientEmail, email));
    const pgRows = await db
      .select()
      .from(bookingHistoryTable)
      .where(and(...pgConditions));

    // ── 4. Merge into AppointmentHistoryDoc[] keyed by patientEmail ───────────
    const byEmail = new Map<string, HistoricalAppointment[]>();

    const addApt = (patientEmail: string, apt: HistoricalAppointment) => {
      if (!byEmail.has(patientEmail)) byEmail.set(patientEmail, []);
      byEmail.get(patientEmail)!.push(apt);
    };

    for (const doc of importedDocs) {
      for (const apt of doc.appointments) {
        addApt(doc.patientEmail, apt);
      }
    }

    for (const b of sanityBookings) {
      if (!b.patientEmail) continue;
      addApt(b.patientEmail, {
        id: b._id,
        date: b.slotDate,
        time: b.slotTime,
        service: b.serviceName ?? "",
        duration: b.serviceDuration ?? 0,
        staff: "",
        payment: 0,
        createdAt: b._createdAt,
        source: "booking",
      });
    }

    for (const h of pgRows) {
      if (!h.patientEmail) continue;
      addApt(h.patientEmail, {
        id: h.id,
        date: h.date,
        time: h.time,
        service: h.serviceName ?? "",
        duration: 0,
        staff: "",
        payment: 0,
        createdAt: h.createdAt.toISOString(),
        source: "history",
      });
    }

    // Deduplicate by id within each patient
    let results: AppointmentHistoryDoc[] = Array.from(byEmail.entries()).map(([patientEmail, apts]) => {
      const seen = new Set<string>();
      const deduped = apts.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
      return {
        _id: `merged-${patientEmail}`,
        patientEmail,
        appointments: deduped,
        matchedAt: new Date().toISOString(),
        matchConfidence: "email_match" as const,
      };
    });

    // Apply date range filter
    if (dateFrom || dateTo) {
      results = results.map((doc) => ({
        ...doc,
        appointments: doc.appointments.filter((apt) => {
          if (dateFrom && apt.date < dateFrom) return false;
          if (dateTo && apt.date > dateTo) return false;
          return true;
        }),
      }));
    }

    // Apply search filter
    if (search) {
      results = results.filter(
        (doc) =>
          doc.patientEmail.includes(search) ||
          doc.appointments.some((apt) => apt.service?.toLowerCase().includes(search))
      );
    }

    return Response.json({ appointments: results, count: results.length });
  } catch (err) {
    console.error("[api/admin/history]", err);
    return Response.json({ error: "Hiba történt." }, { status: 500 });
  }
}

/**
 * POST /api/admin/history/import
 * Body: { appointments: HistoricalAppointment[] }
 * Matches by email to existing patients, creates appointmentHistory docs
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const body = await request.json() as { appointments?: unknown[] };
    const appointments = body.appointments as Array<Record<string, string | number>>;

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return Response.json({ error: "Nincs importálandó adat." }, { status: 400 });
    }

    // Group by email
    const byEmail = new Map<string, HistoricalAppointment[]>();

    for (const apt of appointments) {
      const email = String(apt.email ?? "").toLowerCase().trim();
      if (!email) continue;

      const normalized: HistoricalAppointment = {
        id: String(apt.id || `hist-${Date.now()}-${Math.random()}`),
        date: String(apt.date || ""),
        time: String(apt.time || ""),
        service: String(apt.service || ""),
        duration: Number(apt.duration) || 0,
        staff: String(apt.staff || ""),
        payment: Number(apt.payment) || 0,
        createdAt: String(apt.createdAt || ""),
        source: "import",
      };

      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(normalized);
    }

    // Create/update appointmentHistory docs
    const client = getWriteClient();
    const results: { success: number; skipped: number; errors: string[] } = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    for (const [patientEmail, appts] of byEmail) {
      try {
        // Check if doc exists
        const existing = await client.fetch<AppointmentHistoryDoc | null>(
          `*[_type == "appointmentHistory" && patientEmail == $email][0]`,
          { email: patientEmail }
        );

        if (existing) {
          // Update: merge appointments
          const merged = [
            ...existing.appointments,
            ...appts.filter((a) => !existing.appointments.find((e) => e.id === a.id)),
          ];
          merged.sort((a, b) => a.date.localeCompare(b.date));

          await client.patch(existing._id).set({ appointments: merged }).commit();
        } else {
          // Create new
          await client.create({
            _type: "appointmentHistory",
            patientEmail,
            appointments: appts,
            matchedAt: new Date().toISOString(),
            matchConfidence: "email_match",
          });
        }
        results.success++;
      } catch (err) {
        results.errors.push(`${patientEmail}: ${String(err)}`);
      }
    }

    return Response.json(results);
  } catch (err) {
    console.error("[api/admin/history/POST]", err);
    return Response.json({ error: "Import hiba." }, { status: 500 });
  }
}
