import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

export type PatientRow = {
  email: string;
  name: string;
  phone: string;
  totalBookings: number;
  confirmedCount: number;
  cancelledCount: number;
  lastVisit: string | null;
  source: "booking" | "imported" | "both";
};

type BookingRaw = {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  status: string;
  slotDate: string;
};

type PatientDoc = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  lastVisitDate?: string;
  source?: string;
};

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    if (session.user.role !== "admin")
      return Response.json({ error: "Jogosulatlan." }, { status: 403 });

    const client = getWriteClient();

    // ── Fetch both data sources in parallel ────────────────────────────────
    const [bookings, importedPatients] = await Promise.all([
      client.fetch<BookingRaw[]>(
        `*[_type == "booking" && !(_id in path("drafts.**"))] {
          patientName,
          patientEmail,
          patientPhone,
          status,
          slotDate
        }`,
      ),
      client.fetch<PatientDoc[]>(
        `*[_type == "patient" && !(_id in path("drafts.**"))] | order(lastVisitDate desc) {
          _id,
          name,
          email,
          phone,
          lastVisitDate,
          source
        }`,
      ),
    ]);

    // ── Build map from bookings ────────────────────────────────────────────
    const patientMap = new Map<string, PatientRow>();

    for (const b of bookings) {
      const email = b.patientEmail?.toLowerCase().trim() ?? "";
      if (!email) continue;

      if (!patientMap.has(email)) {
        patientMap.set(email, {
          email,
          name: b.patientName ?? "",
          phone: b.patientPhone ?? "",
          totalBookings: 0,
          confirmedCount: 0,
          cancelledCount: 0,
          lastVisit: null,
          source: "booking",
        });
      }

      const p = patientMap.get(email)!;
      p.totalBookings++;
      if (b.status === "confirmed") p.confirmedCount++;
      if (b.status === "cancelled") p.cancelledCount++;

      if (!p.lastVisit || b.slotDate > p.lastVisit) {
        p.lastVisit = b.slotDate;
        if (b.patientName) p.name = b.patientName;
        if (b.patientPhone) p.phone = b.patientPhone;
      }
    }

    // ── Merge imported patients ────────────────────────────────────────────
    for (const ip of importedPatients) {
      const email = ip.email?.toLowerCase().trim() ?? "";
      const key = email || `__noemail__${ip._id}`;

      if (patientMap.has(key)) {
        // Already exists from bookings — enrich with import data if needed
        const p = patientMap.get(key)!;
        p.source = "both";
        if (!p.phone && ip.phone) p.phone = ip.phone;
        // Merge lastVisit: take whichever is more recent
        if (ip.lastVisitDate) {
          if (!p.lastVisit || ip.lastVisitDate > p.lastVisit) {
            p.lastVisit = ip.lastVisitDate;
          }
        }
      } else {
        // New patient (imported only, no bookings yet)
        patientMap.set(key, {
          email,
          name: ip.name,
          phone: ip.phone ?? "",
          totalBookings: 0,
          confirmedCount: 0,
          cancelledCount: 0,
          lastVisit: ip.lastVisitDate ?? null,
          source: "imported",
        });
      }
    }

    const patients = Array.from(patientMap.values()).sort((a, b) => {
      // Sort: patients with visits first, then by lastVisit desc
      if (!a.lastVisit && b.lastVisit) return 1;
      if (a.lastVisit && !b.lastVisit) return -1;
      if (!a.lastVisit && !b.lastVisit) return a.name.localeCompare(b.name, "hu");
      return b.lastVisit!.localeCompare(a.lastVisit!);
    });

    return Response.json({ patients, total: patients.length });
  } catch (err) {
    console.error("[api/admin/patients]", err);
    return Response.json({ error: "Hiba történt." }, { status: 500 });
  }
}
