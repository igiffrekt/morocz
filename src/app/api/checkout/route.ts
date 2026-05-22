import { headers } from "next/headers";
import { defineQuery } from "next-sanity";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { assertDayStillOpen } from "@/lib/booking-guards";
import { getWriteClient } from "@/lib/sanity-write-client";
import { generateAvailableSlots } from "@/lib/slots";
import { stripe, BOOKING_FEE_HUF } from "@/lib/stripe";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  blockedDatesQuery,
  bookingsForDateQuery,
  slotLockByIdQuery,
  slotLocksForDateQuery,
  weeklyScheduleQuery,
} from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

const serviceForCheckoutQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration, price}`,
);

const BookingSchema = z.object({
  serviceId: z.string().min(1, "Kérjük, válasszon szolgáltatást."),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Érvénytelen dátum."),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/, "Érvénytelen időpont."),
  patientName: z.string().min(2, "A név megadása kötelező."),
  patientEmail: z.string().email("Érvénytelen e-mail cím."),
  patientPhone: z.string().min(7, "Kérjük, adja meg telefonszámát."),
  slotLockId: z.string().optional(),
});

type SlotLock = {
  _id: string;
  _rev: string;
  status: string;
  heldUntil: string | null;
  userId: string | null;
};

function generateReservationNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `M-${code}`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return Response.json({ error: "Kérjük, jelentkezzen be." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Érvénytelen kérés törzs." }, { status: 400 });
    }

    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone, slotLockId: providedSlotLockId } = parsed.data;

    const dayLockError = await assertDayStillOpen(slotDate);
    if (dayLockError) return dayLockError;

    // ── Slot lock acquisition ───────────────────────────────────────────────
    const slotId = `${slotDate}T${slotTime}:00`;
    const slotLockDocId = providedSlotLockId ?? `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;

    let slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotLockId: slotLockDocId });

    if (!slotLock) {
      await getWriteClient().createIfNotExists({
        _id: slotLockDocId,
        _type: "slotLock",
        slotId,
        slotDate,
        slotTime,
        status: "available",
      });
      slotLock = await getWriteClient().fetch<SlotLock | null>(slotLockByIdQuery, { slotLockId: slotLockDocId });
      if (!slotLock) {
        return Response.json(
          { error: "Hiba történt az időpont lefoglalásakor. Kérjük, próbálja újra." },
          { status: 500 },
        );
      }
    }

    if (slotLock.status === "booked") {
      const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
      return Response.json(
        { error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.", alternatives },
        { status: 409 },
      );
    }

    if (slotLock.status === "held" && slotLock.heldUntil) {
      if (new Date(slotLock.heldUntil) < new Date()) {
        const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
        return Response.json(
          { error: "Az időpontfoglalásra fordított idő lejárt. Kérjük, válasszon új időpontot.", alternatives },
          { status: 410 },
        );
      }
      // Ownership check: the hold must belong to the current user.
      if (slotLock.userId && slotLock.userId !== session.user.id) {
        const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
        return Response.json(
          { error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.", alternatives },
          { status: 409 },
        );
      }
    }

    // Optimistic lock
    try {
      await getWriteClient()
        .patch(slotLock._id)
        .ifRevisionId(slotLock._rev)
        .set({ status: "booked" })
        .commit();
    } catch {
      const alternatives = await getAlternativeSlots(slotDate, slotTime, serviceId);
      return Response.json(
        { error: "Ez az időpont sajnos már foglalt. Kérjük, válasszon másik időpontot.", alternatives },
        { status: 409 },
      );
    }

    // ── Create pending booking ──────────────────────────────────────────────
    const reservationNumber = generateReservationNumber();
    const managementToken = crypto.randomUUID();
    const booking = await getWriteClient().create({
      _type: "booking",
      reservationNumber,
      managementToken,
      service: { _type: "reference", _ref: serviceId },
      slotDate,
      slotTime,
      patientName,
      patientEmail,
      patientPhone,
      userId: session.user.id,
      status: "confirmed",
      paymentStatus: "pending",
      paymentAmount: BOOKING_FEE_HUF,
      createdAt: new Date().toISOString(),
    });

    await getWriteClient()
      .patch(slotLock._id)
      .set({ bookingRef: { _type: "reference", _ref: booking._id } })
      .commit();

    // ── Create Stripe Checkout session ──────────────────────────────────────
    const service = await sanityFetch<{ name: string; appointmentDuration: number; price: number | null } | null>({
      query: serviceForCheckoutQuery,
      params: { serviceId },
      tags: ["service"],
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: patientEmail,
        billing_address_collection: "required",
        line_items: [
          {
            price_data: {
              currency: "huf",
              product_data: {
                name: "Foglalási díj",
                description: `${service?.name ?? "Időpontfoglalás"} — ${slotDate} ${slotTime}`,
              },
              unit_amount: BOOKING_FEE_HUF * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking._id,
          reservationNumber,
          managementToken,
          serviceId,
          serviceName: service?.name ?? "",
          slotDate,
          slotTime,
          patientName,
          patientEmail,
          patientPhone,
        },
        success_url: `${appUrl}/foglalas/sikeres?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/foglalas/megszakitva?booking_id=${booking._id}`,
        expires_at: Math.floor(Date.now() / 1000) + 2100,
      });
    } catch (stripeErr) {
      // Stripe failed — clean up the booking and slot lock
      console.error("[api/checkout] Stripe session creation failed, cleaning up:", stripeErr);
      await getWriteClient().delete(booking._id).catch(() => {});
      await getWriteClient()
        .patch(slotLockDocId)
        .set({ status: "available" })
        .unset(["bookingRef"])
        .commit()
        .catch(() => {});
      const msg = stripeErr instanceof Error ? stripeErr.message : "Stripe hiba";
      return Response.json({ error: `Fizetési hiba: ${msg}` }, { status: 500 });
    }

    await getWriteClient()
      .patch(booking._id)
      .set({ stripeSessionId: checkoutSession.id })
      .commit();

    return Response.json(
      { checkoutUrl: checkoutSession.url, bookingId: booking._id, reservationNumber },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/checkout] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Ismeretlen hiba történt.";
    return Response.json({ error: `Hiba a fizetés indításakor: ${message}` }, { status: 500 });
  }
}

async function getAlternativeSlots(
  slotDate: string,
  slotTime: string,
  serviceId: string,
): Promise<string[]> {
  try {
    const [schedule, blockedDatesDoc, bookings, slotLocks, service] = await Promise.all([
      sanityFetch<{
        defaultSlotDuration: number;
        bufferMinutes: number;
        days: Array<{ _key: string; dayOfWeek: number; isDayOff: boolean; startTime: string; endTime: string }>;
      } | null>({ query: weeklyScheduleQuery, tags: ["weeklySchedule"] }),
      sanityFetch<{ dates: Array<{ _key: string; date: string; isHoliday: boolean }> | null } | null>({
        query: blockedDatesQuery,
        tags: ["blockedDate"],
      }),
      sanityFetch<Array<{ _id: string; slotTime: string }>>({
        query: bookingsForDateQuery,
        params: { date: slotDate },
        tags: ["booking"],
      }),
      sanityFetch<Array<{ _id: string; slotTime: string; status: string; heldUntil: string | null }>>({
        query: slotLocksForDateQuery,
        params: { date: slotDate },
        tags: ["slotLock"],
      }),
      sanityFetch<{ name: string; appointmentDuration: number } | null>({
        query: serviceForCheckoutQuery,
        params: { serviceId },
        tags: ["service"],
      }),
    ]);

    const bookedSlots = bookings.map((b) => b.slotTime);
    const now = new Date().toISOString();
    const heldSlots = slotLocks
      .filter((lock) =>
        lock.status === "booked" ||
        (lock.status === "held" && lock.heldUntil != null && lock.heldUntil > now),
      )
      .map((lock) => lock.slotTime)
      .filter(Boolean);

    const available = generateAvailableSlots({
      schedule: schedule ?? { defaultSlotDuration: 20, bufferMinutes: 0, days: [] },
      blockedDates: (blockedDatesDoc?.dates ?? []).map((d) => d.date).filter(Boolean),
      bookedSlots,
      heldSlots,
      date: slotDate,
      serviceDurationMinutes: service?.appointmentDuration ?? 20,
      maxDaysAhead: 30,
    });

    const [reqH, reqM] = slotTime.split(":").map(Number);
    const reqMinutes = (reqH ?? 0) * 60 + (reqM ?? 0);

    return available
      .filter((t) => t !== slotTime)
      .sort((a, b) => {
        const [aH, aM] = a.split(":").map(Number);
        const [bH, bM] = b.split(":").map(Number);
        return Math.abs((aH ?? 0) * 60 + (aM ?? 0) - reqMinutes) - Math.abs((bH ?? 0) * 60 + (bM ?? 0) - reqMinutes);
      })
      .slice(0, 5);
  } catch (err) {
    console.error("[checkout] getAlternativeSlots error:", err);
    return [];
  }
}
