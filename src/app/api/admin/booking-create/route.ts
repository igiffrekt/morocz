import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";

export const dynamic = "force-dynamic";

const AdminBookingSchema = z.object({
  patientName: z.string().min(2),
  patientEmail: z.string().email(),
  patientPhone: z.string().min(7),
  serviceId: z.string().min(1),
  slotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Jogosulatlan hozzáférés." }, { status: 403 });
    }

    const body = await request.json();
    const parsed = AdminBookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Érvénytelen kérés.";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { serviceId, slotDate, slotTime, patientName, patientEmail, patientPhone } = parsed.data;

    const slotId = `${slotDate}T${slotTime}:00`;
    const slotLockDocId = `slotLock-${slotDate}-${slotTime.replace(":", "-")}`;

    const client = getWriteClient();

    await client.createIfNotExists({
      _id: slotLockDocId,
      _type: "slotLock",
      slotId,
      slotDate,
      slotTime,
      status: "available",
    });

    await client.patch(slotLockDocId).set({ status: "booked" }).commit();

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const reservationNumber = `M-${code}`;
    const managementToken = crypto.randomUUID();

    const booking = await client.create({
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
      createdAt: new Date().toISOString(),
      createdByAdmin: true,
    });

    await client
      .patch(slotLockDocId)
      .set({ bookingRef: { _type: "reference", _ref: booking._id } })
      .commit();

    void (async () => {
      try {
        const svc = await client.fetch<{
          name: string;
          appointmentDuration: number;
        } | null>(`*[_type == "service" && _id == $id][0]{name, appointmentDuration}`, {
          id: serviceId,
        });
        const eventId = await createCalendarEvent({
          summary: `${svc?.name ?? "Foglalás"} — ${patientName}`,
          description: `Páciens: ${patientName}\nE-mail: ${patientEmail}\nTelefon: ${patientPhone}\nFoglalási szám: ${reservationNumber}\n(Admin által létrehozva)`,
          date: slotDate,
          startTime: slotTime,
          durationMinutes: svc?.appointmentDuration ?? 20,
        });
        if (eventId) {
          await client.patch(booking._id).set({ googleCalendarEventId: eventId }).commit();
        }
      } catch (err) {
        console.error("[admin/booking-create] Google Calendar sync failed:", err);
      }
    })();

    return Response.json(
      { bookingId: booking._id, reservationNumber },
      { status: 201 },
    );
  } catch (err) {
    console.error("[admin/booking-create] Error:", err);
    return Response.json({ error: "Hiba történt a foglalás létrehozásakor." }, { status: 500 });
  }
}
