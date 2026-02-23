import { auth } from "@/lib/auth";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

// ── GET /api/admin/bookings ────────────────────────────────────────────────────
// Returns bookings for a date range, sorted by slotDate + slotTime, with patient details.
// Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
// Requires admin session.
export async function GET(request: Request): Promise<Response> {
  try {
    // ── 1. Admin session check ─────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    // ── 2. Parse and validate query params ─────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return Response.json(
        { error: "A startDate és endDate paraméterek megadása kötelező." },
        { status: 400 },
      );
    }

    // Validate YYYY-MM-DD format
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
      return Response.json(
        { error: "Érvénytelen dátumformátum. Elvárás: ÉÉÉÉ-HH-NN." },
        { status: 400 },
      );
    }

    if (startDate > endDate) {
      return Response.json(
        { error: "A startDate nem lehet nagyobb, mint endDate." },
        { status: 400 },
      );
    }

    // ── 3. Fetch bookings via GROQ (real-time write client — no CDN) ───────────
    type AdminBooking = {
      _id: string;
      patientName: string;
      patientEmail: string;
      patientPhone: string;
      reservationNumber: string;
      service: { name: string; appointmentDuration: number } | null;
      slotDate: string;
      slotTime: string;
      status: string;
      managementToken: string;
    };

    const bookings = await getWriteClient().fetch<AdminBooking[]>(
      `*[_type == "booking" && slotDate >= $startDate && slotDate <= $endDate] | order(slotDate asc, slotTime asc) {
        _id,
        patientName,
        patientEmail,
        patientPhone,
        reservationNumber,
        service->{name, appointmentDuration},
        slotDate,
        slotTime,
        status,
        managementToken
      }`,
      { startDate, endDate },
    );

    return Response.json({ bookings });
  } catch (err) {
    console.error("[api/admin/bookings] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}
