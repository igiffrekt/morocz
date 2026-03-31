import { auth } from "@/lib/auth";
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
    if (!session) return Response.json({ error: "Bejelentkez├⌐s sz├╝ks├⌐ges." }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase().trim();
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const search = url.searchParams.get("search")?.toLowerCase();

    let query = `*[_type == "appointmentHistory"`;

    if (email) {
      query += ` && patientEmail == "${email}"`;
    }

    query += `] | order(matchedAt desc)`;

    const docs = await getWriteClient().fetch<AppointmentHistoryDoc[]>(query);

    // Filter by date range and search if needed
    let results = docs;

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
    return Response.json({ error: "Hiba t├╢rt├⌐nt." }, { status: 500 });
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
    if (!session) return Response.json({ error: "Bejelentkez├⌐s sz├╝ks├⌐ges." }, { status: 401 });
    if (session.user.role !== "admin") return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const body = await request.json() as { appointments?: unknown[] };
    const appointments = body.appointments as Array<Record<string, string | number>>;

    if (!Array.isArray(appointments) || appointments.length === 0) {
      return Response.json({ error: "Nincs import├íland├│ adat." }, { status: 400 });
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
