import { and, desc, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { reconcileAllStalePending } from "@/lib/booking-reconciler";
import { db } from "@/lib/db";
import { bookingHistory } from "@/lib/db/schema";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

// Lazy reconciliation: throttle to once per 2 minutes across all admin requests.
let lastReconcileAt = 0;
const RECONCILE_THROTTLE_MS = 2 * 60 * 1000;
function triggerLazyReconcile(): void {
  const now = Date.now();
  if (now - lastReconcileAt < RECONCILE_THROTTLE_MS) return;
  lastReconcileAt = now;
  void reconcileAllStalePending().catch((err) => {
    console.error("[api/admin/bookings] Lazy reconcile failed:", err);
  });
}

// ── GET /api/admin/bookings ────────────────────────────────────────────────────
// Returns bookings for a date range or by patient email.
// Query params:
//   - startDate + endDate (YYYY-MM-DD) — date range query
//   - email — all bookings for a patient by email (sorted desc)
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

    triggerLazyReconcile();

    // ── 2. Parse query params ──────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    type AdminBookingRow = {
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
      paymentStatus: string | null;
      completedServices: { serviceId: string; serviceName: string; price: number }[] | null;
    };

    // ── 3a. Email-based query (patient history) ────────────────────────────────
    if (email) {
      // Fetch from Sanity (recent bookings)
      const sanityBookings = await getWriteClient().fetch<AdminBookingRow[]>(
        `*[_type == "booking" && !(_id in path("drafts.**")) && patientEmail == $email] | order(slotDate desc, slotTime desc) {
          _id,
          patientName,
          patientEmail,
          patientPhone,
          reservationNumber,
          service->{name, appointmentDuration},
          slotDate,
          slotTime,
          status,
          managementToken,
          paymentStatus,
          completedServices[]{serviceId, serviceName, price}
        }`,
        { email },
      );

      // Fetch from Postgres (historical bookings)
      const historicalBookings = await db
        .select()
        .from(bookingHistory)
        .where(eq(bookingHistory.patientEmail, email))
        .orderBy(desc(bookingHistory.date));

      // Transform historical bookings to match AdminBookingRow shape
      const transformedHistorical: AdminBookingRow[] = historicalBookings.map((h) => ({
        _id: h.id,
        patientName: h.patientName || "",
        patientEmail: h.patientEmail || "",
        patientPhone: "",
        reservationNumber: "",
        service: h.serviceName ? { name: h.serviceName, appointmentDuration: 0 } : null,
        slotDate: h.date,
        slotTime: h.time,
        status: h.status,
        managementToken: "",
        paymentStatus: null,
        completedServices: null,
      }));

      // Combine and sort by date desc
      const allBookings = [...sanityBookings, ...transformedHistorical].sort((a, b) => {
        const dateA = `${a.slotDate} ${a.slotTime}`;
        const dateB = `${b.slotDate} ${b.slotTime}`;
        return dateB.localeCompare(dateA);
      });

      return Response.json({ bookings: allBookings });
    }

    // ── 3b. Date-range query ───────────────────────────────────────────────────
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

    // ── 4. Fetch bookings via GROQ (real-time write client — no CDN) ───────────
    const sanityBookings = await getWriteClient().fetch<AdminBookingRow[]>(
      `*[_type == "booking" && !(_id in path("drafts.**")) && slotDate >= $startDate && slotDate <= $endDate] | order(slotDate asc, slotTime asc) {
        _id,
        patientName,
        patientEmail,
        patientPhone,
        reservationNumber,
        service->{name, appointmentDuration},
        slotDate,
        slotTime,
        status,
        managementToken,
        paymentStatus,
        completedServices[]{serviceId, serviceName, price}
      }`,
      { startDate, endDate },
    );

    // Fetch from Postgres (historical bookings in date range)
    const historicalBookings = await db
      .select()
      .from(bookingHistory)
      .where(and(gte(bookingHistory.date, startDate), lte(bookingHistory.date, endDate)));

    // Transform historical bookings to match AdminBookingRow shape
    const transformedHistorical: AdminBookingRow[] = historicalBookings.map((h) => ({
      _id: h.id,
      patientName: h.patientName || "",
      patientEmail: h.patientEmail || "",
      patientPhone: "",
      reservationNumber: "",
      service: h.serviceName ? { name: h.serviceName, appointmentDuration: 0 } : null,
      slotDate: h.date,
      slotTime: h.time,
      status: h.status,
      managementToken: "",
      paymentStatus: null,
      completedServices: null,
    }));

    // Combine and sort by date asc
    const allBookings = [...sanityBookings, ...transformedHistorical].sort((a, b) => {
      const dateA = `${a.slotDate} ${a.slotTime}`;
      const dateB = `${b.slotDate} ${b.slotTime}`;
      return dateA.localeCompare(dateB);
    });

    return Response.json({ bookings: allBookings });
  } catch (err) {
    console.error("[api/admin/bookings] Unexpected error:", err);
    return Response.json({ error: "Hiba történt. Kérjük, próbálja újra." }, { status: 500 });
  }
}
