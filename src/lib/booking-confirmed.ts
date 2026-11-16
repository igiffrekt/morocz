import { defineQuery } from "next-sanity";
import { buildConfirmationEmail } from "@/lib/booking-email";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getWriteClient } from "@/lib/sanity-write-client";
import { sanityFetch } from "@/sanity/lib/fetch";

const serviceForEmailQuery = defineQuery(
  `*[_type == "service" && _id == $serviceId][0]{name, appointmentDuration}`,
);

export interface ConfirmedBookingDetails {
  bookingId: string;
  reservationNumber: string;
  managementToken: string;
  serviceId: string;
  /** YYYY-MM-DD */
  slotDate: string;
  /** HH:MM */
  slotTime: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  /** Booked without the booking fee (allowlisted account) — noted on the calendar event. */
  feeWaived?: boolean;
}

/**
 * Side effects of a booking becoming final: the Google Calendar event and the
 * patient's confirmation e-mail. Shared by the Stripe webhook (paid booking) and
 * the fee-waived checkout path, so both finalize a booking the same way.
 * Never throws — each step logs its own failure, the booking itself is already
 * committed by the caller.
 */
export async function runBookingConfirmedSideEffects(
  details: ConfirmedBookingDetails,
  logPrefix = "[booking-confirmed]",
): Promise<void> {
  await Promise.all([createEvent(details, logPrefix), sendConfirmation(details, logPrefix)]);
}

async function createEvent(details: ConfirmedBookingDetails, logPrefix: string): Promise<void> {
  const {
    bookingId,
    reservationNumber,
    serviceId,
    slotDate,
    slotTime,
    patientName,
    patientEmail,
    patientPhone,
    feeWaived,
  } = details;
  try {
    const svc = await getWriteClient().fetch<{
      name: string;
      appointmentDuration: number;
    } | null>(`*[_type == "service" && _id == $id][0]{name, appointmentDuration}`, {
      id: serviceId,
    });
    const eventId = await createCalendarEvent({
      summary: `${svc?.name ?? "Foglalás"} — ${patientName}`,
      description: `Páciens: ${patientName}\nE-mail: ${patientEmail}\nTelefon: ${patientPhone}\nFoglalási szám: ${reservationNumber}${feeWaived ? "\nFoglalási díj: díjmentes" : ""}`,
      date: slotDate,
      startTime: slotTime,
      durationMinutes: svc?.appointmentDuration ?? 20,
    });
    if (eventId) {
      await getWriteClient().patch(bookingId).set({ googleCalendarEventId: eventId }).commit();
      console.log(`${logPrefix} Google Calendar event created: ${eventId}`);
    }
  } catch (err) {
    console.error(`${logPrefix} Google Calendar sync failed:`, err);
  }
}

async function sendConfirmation(
  details: ConfirmedBookingDetails,
  logPrefix: string,
): Promise<void> {
  const {
    reservationNumber,
    managementToken,
    serviceId,
    slotDate,
    slotTime,
    patientName,
    patientEmail,
  } = details;
  if (!isEmailConfigured() || !patientEmail) return;
  try {
    const service = await sanityFetch<{ name: string } | null>({
      query: serviceForEmailQuery,
      params: { serviceId },
      tags: ["service"],
    });

    const formattedDate = new Date(slotDate).toLocaleDateString("hu-HU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://drmoroczangela.hu";
    const manageUrl = `${appUrl}/foglalas/${managementToken}`;

    const html = buildConfirmationEmail({
      patientName: patientName,
      serviceName: service?.name?.startsWith("Nőgyógyász")
        ? "Nőgyógyászati vizsgálat"
        : (service?.name ?? "Foglalt szolgáltatás"),
      reservationNumber: reservationNumber,
      date: formattedDate,
      time: slotTime,
      manageUrl,
      clinicPhone: "+36 70 639 5239",
      clinicAddress: "2500 Esztergom, Martsa Alajos utca 6/c.",
    });

    await sendEmail({
      to: patientEmail,
      subject: "Időpontfoglalás visszaigazolása — Mórocz Medical",
      html,
    });
    console.log(`${logPrefix} Confirmation email sent to ${patientEmail}`);
  } catch (err) {
    console.error(`${logPrefix} Failed to send confirmation email:`, err);
  }
}
