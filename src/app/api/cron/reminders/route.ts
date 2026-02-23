import type { NextRequest } from "next/server";
import { getWriteClient } from "@/lib/sanity-write-client";
import { buildReminderEmail } from "@/lib/booking-email";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { db } from "@/lib/db";
import { cronRunLog } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// TypeScript type for bookings returned by GROQ query
interface BookingForReminder {
  _id: string;
  patientName: string;
  patientEmail: string;
  slotDate: string; // "YYYY-MM-DD"
  slotTime: string; // "HH:MM"
  service: { name: string } | null;
}

/**
 * Converts a Budapest local date+time string to UTC milliseconds.
 * Uses Intl API to dynamically resolve the Budapest offset (CET +01:00 or CEST +02:00),
 * handling DST automatically without any hardcoded offset values.
 */
function appointmentToUtcMs(slotDate: string, slotTime: string): number {
  const [year, month, day] = slotDate.split("-").map(Number);
  const [hour, minute] = slotTime.split(":").map(Number);

  // Use a UTC reference date at this local time to probe the Budapest offset via Intl
  const probeUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Budapest",
    timeZoneName: "longOffset",
  }).formatToParts(probeUtc);

  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+01:00";
  // offsetPart is e.g. "GMT+02:00" or "GMT+01:00"
  const match = offsetPart.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) {
    // Fallback to CET (+1h) if parsing fails
    return Date.UTC(year, month - 1, day, hour - 1, minute);
  }

  const sign = match[1] === "+" ? 1 : -1;
  const offsetHours = Number(match[2]) * sign;
  const offsetMinutes = Number(match[3]) * sign;

  // Budapest local time minus offset = UTC
  return Date.UTC(year, month - 1, day, hour - offsetHours, minute - offsetMinutes);
}

/**
 * Converts a YYYY-MM-DD date string to a formatted Hungarian date string.
 * Example: "2026-02-24" -> "2026. február 24."
 */
function formatHungarianDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Construct a UTC noon date to avoid timezone day-boundary issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0));
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Budapest",
  }).format(date);
}

/**
 * Maps service names per Phase 12 decision:
 * Services starting with "Nőgyógyász" are displayed as "Nőgyógyászati vizsgálat".
 */
function mapServiceName(name: string): string {
  if (name.startsWith("Nőgyógyász")) {
    return "Nőgyógyászati vizsgálat";
  }
  return name;
}

/**
 * GET /api/cron/reminders
 *
 * Secured Vercel Cron endpoint. Runs hourly (0 * * * *).
 * Queries Sanity for bookings in the 20-28 hour window, groups by patient email,
 * sends combined Hungarian reminder emails via Gmail API, marks bookings as
 * reminderSent=true for idempotency, and logs each run to the cron_run_log table.
 *
 * Auth: Bearer ${CRON_SECRET} required in Authorization header.
 * Vercel automatically sends this header for registered cron jobs.
 */
export async function GET(request: NextRequest) {
  // --- CRON_SECRET auth guard ---
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startTime = Date.now();
  let attempted = 0;
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  try {
    // --- Check email configuration ---
    if (!isEmailConfigured()) {
      // Log the run but skip all email sending
      await db.insert(cronRunLog).values({
        id: crypto.randomUUID(),
        runAt: new Date(),
        remindersAttempted: 0,
        remindersSucceeded: 0,
        remindersFailed: 0,
        errorDetails: JSON.stringify([{ note: "Email not configured — skipping send" }]),
        durationMs: Date.now() - startTime,
      });
      return Response.json({
        ok: true,
        attempted: 0,
        succeeded: 0,
        failed: 0,
        note: "Email not configured",
      });
    }

    // --- Compute 20-28 hour window in UTC ---
    const now = Date.now();
    const windowStart = new Date(now + 20 * 60 * 60 * 1000);
    const windowEnd = new Date(now + 28 * 60 * 60 * 1000);

    // Derive the Budapest date strings that could contain bookings in this window.
    // The window spans at most 8 hours so it covers at most 2 calendar dates in Budapest.
    const budaFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dateFrom = budaFormatter.format(windowStart); // "YYYY-MM-DD"
    const dateTo = budaFormatter.format(windowEnd);     // "YYYY-MM-DD"

    // --- Query Sanity (write client for real-time, no CDN) ---
    const bookings = await getWriteClient().fetch<BookingForReminder[]>(
      `*[
        _type == "booking"
        && !(_id in path("drafts.**"))
        && status == "confirmed"
        && reminderSent != true
        && slotDate >= $dateFrom
        && slotDate <= $dateTo
      ]{
        _id, patientName, patientEmail, slotDate, slotTime,
        service->{name}
      }`,
      { dateFrom, dateTo },
    );

    // --- Filter in app code: only bookings in the precise 20-28h UTC window ---
    const filteredBookings = bookings.filter((booking) => {
      const apptUtcMs = appointmentToUtcMs(booking.slotDate, booking.slotTime);
      return apptUtcMs >= windowStart.getTime() && apptUtcMs < windowEnd.getTime();
    });

    // --- Group by patient email ---
    const grouped = new Map<string, BookingForReminder[]>();
    for (const booking of filteredBookings) {
      const list = grouped.get(booking.patientEmail) ?? [];
      list.push(booking);
      grouped.set(booking.patientEmail, list);
    }

    // --- Process each patient group ---
    for (const [patientEmail, group] of grouped) {
      attempted++;

      const appointments = group.map((b) => ({
        serviceName: mapServiceName(b.service?.name ?? "Vizsgálat"),
        date: formatHungarianDate(b.slotDate),
        time: b.slotTime,
      }));

      const isPlural = group.length > 1;
      const subject = isPlural
        ? "Emlékeztető: holnapi időpontjai — Mórocz Medical"
        : "Emlékeztető: holnapi időpontja — Mórocz Medical";

      const html = buildReminderEmail({
        patientName: group[0].patientName,
        appointments,
        clinicPhone: "+36 33 888 8888",
        clinicAddress: "2500 Esztergom, Simor János u. 36.",
      });

      try {
        await sendEmail({ to: patientEmail, subject, html });

        // On success: mark each booking in this group as reminderSent=true
        for (const booking of group) {
          await getWriteClient().patch(booking._id).set({ reminderSent: true }).commit();
        }
        succeeded++;
      } catch (emailError) {
        // On failure: do NOT set reminderSent=true — allows retry on next hourly run
        failed++;
        errors.push({
          email: patientEmail,
          error: emailError instanceof Error ? emailError.message : String(emailError),
        });
      }
    }

    // --- Audit log ---
    await db.insert(cronRunLog).values({
      id: crypto.randomUUID(),
      runAt: new Date(),
      remindersAttempted: attempted,
      remindersSucceeded: succeeded,
      remindersFailed: failed,
      errorDetails: errors.length > 0 ? JSON.stringify(errors) : null,
      durationMs: Date.now() - startTime,
    });

    return Response.json({ ok: true, attempted, succeeded, failed });
  } catch (unexpectedError) {
    // Unexpected top-level error: try to log then return 500
    const errorMessage =
      unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
    try {
      await db.insert(cronRunLog).values({
        id: crypto.randomUUID(),
        runAt: new Date(),
        remindersAttempted: attempted,
        remindersSucceeded: succeeded,
        remindersFailed: failed,
        errorDetails: JSON.stringify([{ fatalError: errorMessage }]),
        durationMs: Date.now() - startTime,
      });
    } catch {
      // If DB logging also fails, proceed to return 500 anyway
    }
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
