# Backend API Design -- Next.js Server Actions + Route Handlers

**Author**: backend-architect
**Status**: Draft for review
**Date**: 2026-02-21
**Depends on**: `01-database-schema.md` (all table/enum/relation definitions referenced here)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [NextAuth.js Setup](#2-nextauthjs-setup)
3. [Slot Generation Engine](#3-slot-generation-engine)
4. [Booking Flow](#4-booking-flow)
5. [Cancellation System](#5-cancellation-system)
6. [Gmail API Integration](#6-gmail-api-integration)
7. [Google Calendar Integration](#7-google-calendar-integration)
8. [Vercel Cron -- Reminders](#8-vercel-cron----reminders)
9. [Waitlist Processing](#9-waitlist-processing)
10. [CSV Import Script](#10-csv-import-script)
11. [Admin CRUD Server Actions](#11-admin-crud-server-actions)
12. [Environment Variables](#12-environment-variables)
13. [Package Dependencies](#13-package-dependencies)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [File Structure](#15-file-structure)

---

## 1. Architecture Overview

### Communication Patterns

All client-to-server communication uses **Next.js Server Actions** (`"use server"` functions). There are no REST API routes except:

- `POST /api/auth/[...nextauth]` -- NextAuth.js authentication endpoints
- `POST /api/cron/send-reminders` -- Vercel Cron job (authenticated by `CRON_SECRET`)
- `GET /api/slots` -- public slot availability endpoint (for the booking calendar widget)

Server Actions are preferred because they integrate with Next.js form handling, support progressive enhancement, and colocate validation logic with the mutation. Route handlers are used only where external systems need a stable HTTP endpoint.

### Shared Types

```ts
// src/lib/booking/types.ts

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SLOT_UNAVAILABLE"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "ALREADY_CANCELLED"
  | "INTERNAL_ERROR";

export interface TimeSlot {
  startTime: string; // ISO 8601, e.g. "2026-03-15T09:00:00+01:00"
  endTime: string;   // ISO 8601
  available: boolean;
}

export interface BookingConfirmation {
  appointmentId: string;       // UUID
  patientName: string;
  appointmentType: string;
  date: string;                // formatted: "2026. marcius 15."
  time: string;                // formatted: "09:00"
  cancellationUrl: string;     // full URL with token
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 2. NextAuth.js Setup

### 2.1 Auth Configuration

```ts
// src/lib/auth/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.query.adminUsers.findFirst({
          where: eq(adminUsers.email, parsed.data.email),
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8 hours
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "admin" | "receptionist";
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
```

### 2.2 Auth Exports

```ts
// src/lib/auth/index.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 2.3 Type Augmentation

```ts
// src/lib/auth/types.d.ts
import "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "receptionist";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "admin" | "receptionist";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "receptionist";
    userId: string;
  }
}
```

### 2.4 Middleware

```ts
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except the login page
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 2.5 Auth Helper for Server Actions

```ts
// src/lib/auth/require-auth.ts
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/booking/types";

export async function requireAuth(): Promise<
  | { authenticated: true; session: NonNullable<Awaited<ReturnType<typeof auth>>> }
  | { authenticated: false; error: ActionResult<never> }
> {
  const session = await auth();
  if (!session?.user) {
    return {
      authenticated: false,
      error: { success: false, error: "Not authenticated", code: "UNAUTHORIZED" },
    };
  }
  return { authenticated: true, session };
}

export async function requireAdmin(): Promise<
  | { authenticated: true; session: NonNullable<Awaited<ReturnType<typeof auth>>> }
  | { authenticated: false; error: ActionResult<never> }
> {
  const result = await requireAuth();
  if (!result.authenticated) return result;

  if (result.session.user.role !== "admin") {
    return {
      authenticated: false,
      error: { success: false, error: "Admin access required", code: "FORBIDDEN" },
    };
  }
  return result;
}
```

---

## 3. Slot Generation Engine

### 3.1 Core Function

```ts
// src/lib/booking/slots.ts
import { db } from "@/db";
import {
  weeklySchedule,
  scheduleOverrides,
  appointments,
  appointmentTypes,
  doctorSettings,
} from "@/db/schema";
import { and, eq, ne, gte, lte, between } from "drizzle-orm";
import type { TimeSlot } from "./types";

/**
 * Returns available booking slots for a given date and appointment type.
 *
 * Algorithm:
 * 1. Fetch the appointment type to get durationMinutes.
 * 2. Fetch doctor_settings for default duration and cancellation window.
 * 3. Check schedule_overrides for the date -- if isClosed, return [].
 * 4. If override exists with modified hours, use those hours.
 * 5. Otherwise, look up weekly_schedule for the day of week.
 *    - Prefer type-specific schedule; fall back to global (appointmentTypeId IS NULL).
 * 6. Generate time slots from start to end by durationMinutes increments.
 * 7. Fetch all non-cancelled appointments for that date range.
 * 8. Subtract occupied slots from generated slots.
 * 9. Remove slots in the past (if date is today).
 * 10. Return remaining slots with available=true.
 *
 * All times are processed in Europe/Budapest timezone.
 */
export async function getAvailableSlots(
  date: Date,
  appointmentTypeId: number
): Promise<TimeSlot[]> {
  const TZ = "Europe/Budapest";

  // 1. Fetch appointment type
  const appointmentType = await db.query.appointmentTypes.findFirst({
    where: and(
      eq(appointmentTypes.id, appointmentTypeId),
      eq(appointmentTypes.isActive, true)
    ),
  });
  if (!appointmentType) return [];

  const duration = appointmentType.durationMinutes;

  // 2. Fetch doctor settings
  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  // 3. Format the target date in Budapest timezone
  const dateStr = formatDateInTZ(date, TZ); // "YYYY-MM-DD"
  const dayOfWeek = getDayOfWeekISO(date, TZ); // 1=Mon..7=Sun

  // 4. Check schedule overrides
  const override = await db.query.scheduleOverrides.findFirst({
    where: and(
      lte(scheduleOverrides.startDate, dateStr),
      gte(scheduleOverrides.endDate, dateStr)
    ),
  });

  if (override?.isClosed) return [];

  // 5. Determine working hours
  let startHour: string;
  let endHour: string;

  if (override && override.startTime && override.endTime) {
    startHour = override.startTime;
    endHour = override.endTime;
  } else {
    // Type-specific schedule first, then global
    const typeSchedule = await db.query.weeklySchedule.findFirst({
      where: and(
        eq(weeklySchedule.dayOfWeek, dayOfWeek),
        eq(weeklySchedule.appointmentTypeId, appointmentTypeId),
        eq(weeklySchedule.isActive, true)
      ),
    });

    const globalSchedule = typeSchedule
      ? null
      : await db.query.weeklySchedule.findFirst({
          where: and(
            eq(weeklySchedule.dayOfWeek, dayOfWeek),
            // appointmentTypeId IS NULL for global schedule
            eq(weeklySchedule.isActive, true)
          ),
          // Filter for null appointmentTypeId done in application
        });

    const schedule = typeSchedule ?? globalSchedule;
    if (!schedule) return [];

    startHour = schedule.startTime;
    endHour = schedule.endTime;
  }

  // 6. Generate candidate slots
  const slotDuration = override?.slotDurationMinutes ?? duration;
  const candidates = generateTimeSlots(dateStr, startHour, endHour, slotDuration, TZ);

  // 7. Fetch existing non-cancelled appointments for the date
  const dayStart = toUTCFromTZ(`${dateStr}T00:00:00`, TZ);
  const dayEnd = toUTCFromTZ(`${dateStr}T23:59:59`, TZ);

  const existingAppointments = await db.query.appointments.findMany({
    where: and(
      gte(appointments.startTime, dayStart),
      lte(appointments.startTime, dayEnd),
      ne(appointments.status, "cancelled")
    ),
  });

  // 8. Build a set of occupied time ranges
  const occupied = new Set(
    existingAppointments.map((a) => a.startTime.toISOString())
  );

  // 9. Filter out past slots if date is today
  const now = new Date();

  // 10. Return available slots
  return candidates.map((slot) => ({
    ...slot,
    available: !occupied.has(new Date(slot.startTime).toISOString()) &&
               new Date(slot.startTime) > now,
  }));
}
```

### 3.2 Timezone Helpers

```ts
// src/lib/booking/timezone.ts

/**
 * Format a Date to "YYYY-MM-DD" in the given IANA timezone.
 */
export function formatDateInTZ(date: Date, tz: string): string {
  return date.toLocaleDateString("sv-SE", { timeZone: tz }); // sv-SE gives YYYY-MM-DD
}

/**
 * Get ISO day of week (1=Monday..7=Sunday) for a Date in the given timezone.
 */
export function getDayOfWeekISO(date: Date, tz: string): number {
  const dayJS = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: tz,
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return map[dayJS] ?? 1;
}

/**
 * Convert a local datetime string (e.g. "2026-03-15T09:00:00") in a
 * timezone to a UTC Date.
 * Uses Intl to handle DST transitions correctly.
 */
export function toUTCFromTZ(localDatetime: string, tz: string): Date {
  // Append the timezone offset by formatting via Intl
  const fakeDate = new Date(localDatetime + "Z");
  const utcStr = fakeDate.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = fakeDate.toLocaleString("en-US", { timeZone: tz });
  const diff = new Date(utcStr).getTime() - new Date(tzStr).getTime();
  return new Date(fakeDate.getTime() + diff);
}

/**
 * Generate time slot candidates between startTime and endTime
 * for a given date, stepping by durationMinutes.
 */
export function generateTimeSlots(
  dateStr: string,         // "YYYY-MM-DD"
  startTime: string,       // "HH:MM" or "HH:MM:SS"
  endTime: string,         // "HH:MM" or "HH:MM:SS"
  durationMinutes: number,
  tz: string
): { startTime: string; endTime: string; available: boolean }[] {
  const slots: { startTime: string; endTime: string; available: boolean }[] = [];

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += durationMinutes) {
    const slotStart = toUTCFromTZ(
      `${dateStr}T${minutesToHHMM(m)}:00`,
      tz
    );
    const slotEnd = toUTCFromTZ(
      `${dateStr}T${minutesToHHMM(m + durationMinutes)}:00`,
      tz
    );
    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: true, // caller will filter
    });
  }

  return slots;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
```

### 3.3 Public Route Handler

```ts
// src/app/api/slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking/slots";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTypeId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const slots = await getAvailableSlots(
    new Date(parsed.data.date + "T00:00:00"),
    parsed.data.appointmentTypeId
  );

  return NextResponse.json({ slots });
}
```

---

## 4. Booking Flow

### 4.1 Validation Schema

```ts
// src/lib/booking/schemas.ts
import { z } from "zod";

export const bookingSchema = z.object({
  appointmentTypeId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  firstName: z.string().trim().min(2, "Minimum 2 characters").max(100),
  lastName: z.string().trim().min(2, "Minimum 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
});

export type BookingInput = z.infer<typeof bookingSchema>;
```

### 4.2 Server Action

```ts
// src/lib/booking/actions/create-booking.ts
"use server";

import { db } from "@/db";
import { patients, appointments, appointmentTypes, doctorSettings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { bookingSchema, type BookingInput } from "../schemas";
import { toUTCFromTZ, formatDateInTZ } from "../timezone";
import { createCalendarEvent } from "../google-calendar";
import { sendBookingEmail } from "../email/send-email";
import type { ActionResult, BookingConfirmation } from "../types";

const TZ = "Europe/Budapest";

export async function createBooking(
  data: BookingInput
): Promise<ActionResult<BookingConfirmation>> {
  // 1. Validate input
  const parsed = bookingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Validation error",
      code: "VALIDATION_ERROR",
    };
  }

  const { appointmentTypeId, date, time, firstName, lastName, email, phone } =
    parsed.data;

  try {
    // 2. Fetch appointment type
    const apptType = await db.query.appointmentTypes.findFirst({
      where: and(
        eq(appointmentTypes.id, appointmentTypeId),
        eq(appointmentTypes.isActive, true)
      ),
    });
    if (!apptType) {
      return { success: false, error: "Invalid appointment type", code: "NOT_FOUND" };
    }

    // 3. Compute start/end times in UTC
    const startTime = toUTCFromTZ(`${date}T${time}:00`, TZ);
    const endTime = new Date(startTime.getTime() + apptType.durationMinutes * 60 * 1000);

    // 4. Fetch settings for cancellation window
    const settings = await db.query.doctorSettings.findFirst({
      where: eq(doctorSettings.id, 1),
    });
    const cancellationHours = settings?.cancellationWindowHours ?? 24;
    const cancellationExpiresAt = new Date(
      startTime.getTime() - cancellationHours * 60 * 60 * 1000
    );

    // 5. Generate cancellation token (256-bit hex)
    const cancellationToken = randomBytes(32).toString("hex");

    // 6. Transactional insert: upsert patient + create appointment
    // Using raw SQL transaction for SELECT FOR UPDATE support
    const result = await db.transaction(async (tx) => {
      // 6a. Check slot is still available (SELECT FOR UPDATE on the time range)
      const conflicts = await tx.execute(sql`
        SELECT id FROM appointments
        WHERE status != 'cancelled'
          AND start_time < ${endTime}
          AND end_time > ${startTime}
        FOR UPDATE
      `);

      if (conflicts.rows.length > 0) {
        throw new SlotUnavailableError();
      }

      // 6b. Upsert patient by email
      const [patient] = await tx
        .insert(patients)
        .values({
          firstName,
          lastName,
          email,
          phone: phone || null,
        })
        .onConflictDoUpdate({
          target: patients.email,
          set: {
            firstName,
            lastName,
            phone: phone ? sql`COALESCE(${phone}, ${patients.phone})` : patients.phone,
          },
        })
        .returning();

      // 6c. Insert appointment
      const [appointment] = await tx
        .insert(appointments)
        .values({
          patientId: patient.id,
          appointmentTypeId,
          startTime,
          endTime,
          status: "confirmed",
          cancellationToken,
          cancellationTokenExpiresAt: cancellationExpiresAt,
        })
        .returning();

      return { patient, appointment };
    });

    // 7. Create Google Calendar event (non-blocking on failure)
    let googleEventId: string | null = null;
    try {
      googleEventId = await createCalendarEvent({
        appointmentId: result.appointment.id,
        patientFirstName: firstName,
        patientLastName: lastName,
        appointmentTypeName: apptType.name,
        startTime,
        endTime,
        patientEmail: email,
        patientPhone: phone || undefined,
      });

      // Update appointment with Google event ID
      await db
        .update(appointments)
        .set({ googleEventId })
        .where(eq(appointments.id, result.appointment.id));
    } catch (calendarError) {
      console.error("Google Calendar event creation failed:", calendarError);
      // Non-fatal: booking proceeds without calendar event
    }

    // 8. Build cancellation URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morocz.hu";
    const cancellationUrl = `${siteUrl}/cancel/${cancellationToken}`;

    // 9. Format date/time for Hungarian locale
    const formattedDate = formatHungarianDate(startTime, TZ);
    const formattedTime = formatHungarianTime(startTime, TZ);

    // 10. Send confirmation email (non-blocking on failure)
    try {
      await sendBookingEmail({
        templateEvent: "booking_confirmed",
        recipientType: "patient",
        recipientEmail: email,
        appointmentId: result.appointment.id,
        patientId: result.patient.id,
        variables: {
          $patient_name: `${lastName} ${firstName}`,
          $patient_first_name: firstName,
          $doctor_name: settings?.doctorName ?? "Dr. Morocz Angela",
          $appointment_type: apptType.name,
          $appointment_date: formattedDate,
          $appointment_time: formattedTime,
          $cancel_url: cancellationUrl,
          $clinic_name: settings?.clinicName ?? "Dr. Morocz Angela Nogyogyaszat",
          $clinic_phone: settings?.phone ?? "",
          $clinic_address: settings?.address ?? "",
          $status: "confirmed",
        },
      });
    } catch (emailError) {
      console.error("Confirmation email failed:", emailError);
      // Non-fatal: booking is confirmed even if email fails
    }

    // 11. Return confirmation
    return {
      success: true,
      data: {
        appointmentId: result.appointment.id,
        patientName: `${lastName} ${firstName}`,
        appointmentType: apptType.name,
        date: formattedDate,
        time: formattedTime,
        cancellationUrl,
      },
    };
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return {
        success: false,
        error: "This time slot is no longer available",
        code: "SLOT_UNAVAILABLE",
      };
    }

    // PostgreSQL exclusion constraint violation (23P01)
    if ((error as any)?.code === "23P01") {
      return {
        success: false,
        error: "This time slot is no longer available",
        code: "SLOT_UNAVAILABLE",
      };
    }

    console.error("Booking creation failed:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    };
  }
}

class SlotUnavailableError extends Error {
  constructor() {
    super("Slot unavailable");
    this.name = "SlotUnavailableError";
  }
}

// -- Hungarian formatting helpers --

function formatHungarianDate(date: Date, tz: string): string {
  return date.toLocaleDateString("hu-HU", {
    timeZone: tz,
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  // Output: "2026. marcius 15."
}

function formatHungarianTime(date: Date, tz: string): string {
  return date.toLocaleTimeString("hu-HU", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // Output: "09:00"
}
```

### 4.3 Double-Booking Prevention (Defense in Depth)

Three layers prevent double-booking:

1. **Application layer**: `getAvailableSlots` filters out occupied slots before the user can select them.
2. **Transaction layer**: `SELECT FOR UPDATE` in the booking transaction locks the time range and checks for conflicts.
3. **Database layer**: The `EXCLUDE USING gist` constraint on `appointments` rejects overlapping inserts even if both previous layers have a race condition.

---

## 5. Cancellation System

### 5.1 Cancellation Page (Server Component)

```ts
// src/app/cancel/[token]/page.tsx
// This is a React Server Component that fetches the appointment by token.
// It renders a confirmation UI or an error state.
// The actual cancellation is performed by a server action on form submit.

import { db } from "@/db";
import { appointments, patients, appointmentTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CancelForm } from "./cancel-form"; // client component

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CancelPage({ params }: Props) {
  const { token } = await params;

  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.cancellationToken, token),
    with: {
      patient: true,
      appointmentType: true,
    },
  });

  if (!appointment) {
    return <CancelResult state="invalid_token" />;
  }

  if (appointment.status === "cancelled") {
    return <CancelResult state="already_cancelled" />;
  }

  const now = new Date();
  if (
    appointment.cancellationTokenExpiresAt &&
    now >= appointment.cancellationTokenExpiresAt
  ) {
    return <CancelResult state="expired_24h" appointment={appointment} />;
  }

  // Show cancellation confirmation form
  return <CancelForm appointment={appointment} token={token} />;
}
```

### 5.2 Cancellation Server Action

```ts
// src/lib/booking/actions/cancel-appointment.ts
"use server";

import { db } from "@/db";
import { appointments, patients, appointmentTypes, doctorSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteCalendarEvent } from "../google-calendar";
import { sendBookingEmail } from "../email/send-email";
import { processWaitlistForSlot } from "../waitlist";
import type { ActionResult } from "../types";

export type CancelResult =
  | "success"
  | "expired_24h"
  | "invalid_token"
  | "already_cancelled";

export async function cancelAppointment(
  token: string
): Promise<ActionResult<{ state: CancelResult }>> {
  // 1. Find appointment by cancellation token
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.cancellationToken, token),
    with: {
      patient: true,
      appointmentType: true,
    },
  });

  if (!appointment) {
    return {
      success: false,
      error: "Invalid cancellation link",
      code: "TOKEN_INVALID",
    };
  }

  if (appointment.status === "cancelled") {
    return {
      success: false,
      error: "This appointment has already been cancelled",
      code: "ALREADY_CANCELLED",
    };
  }

  // 2. Check cancellation window
  const now = new Date();
  if (
    appointment.cancellationTokenExpiresAt &&
    now >= appointment.cancellationTokenExpiresAt
  ) {
    return {
      success: false,
      error: "Cancellation is no longer available (less than 24 hours before appointment)",
      code: "TOKEN_EXPIRED",
    };
  }

  // 3. Update appointment status
  await db
    .update(appointments)
    .set({
      status: "cancelled",
      cancelledAt: now,
    })
    .where(eq(appointments.id, appointment.id));

  // 4. Delete Google Calendar event
  if (appointment.googleEventId) {
    try {
      await deleteCalendarEvent(appointment.googleEventId);
    } catch (error) {
      console.error("Failed to delete calendar event:", error);
    }
  }

  // 5. Send cancellation emails
  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  const TZ = "Europe/Budapest";
  const formattedDate = appointment.startTime.toLocaleDateString("hu-HU", {
    timeZone: TZ, year: "numeric", month: "long", day: "numeric",
  });
  const formattedTime = appointment.startTime.toLocaleTimeString("hu-HU", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const emailVars = {
    $patient_name: `${appointment.patient.lastName} ${appointment.patient.firstName}`,
    $patient_first_name: appointment.patient.firstName,
    $doctor_name: settings?.doctorName ?? "Dr. Morocz Angela",
    $appointment_type: appointment.appointmentType.name,
    $appointment_date: formattedDate,
    $appointment_time: formattedTime,
    $cancel_url: "",
    $clinic_name: settings?.clinicName ?? "",
    $clinic_phone: settings?.phone ?? "",
    $clinic_address: settings?.address ?? "",
    $status: "cancelled",
  };

  // Email to patient
  try {
    await sendBookingEmail({
      templateEvent: "booking_cancelled",
      recipientType: "patient",
      recipientEmail: appointment.patient.email,
      appointmentId: appointment.id,
      patientId: appointment.patient.id,
      variables: emailVars,
    });
  } catch (error) {
    console.error("Cancellation email to patient failed:", error);
  }

  // Email to doctor
  try {
    if (settings?.doctorEmail) {
      await sendBookingEmail({
        templateEvent: "booking_cancelled",
        recipientType: "doctor",
        recipientEmail: settings.doctorEmail,
        appointmentId: appointment.id,
        patientId: appointment.patient.id,
        variables: emailVars,
      });
    }
  } catch (error) {
    console.error("Cancellation email to doctor failed:", error);
  }

  // 6. Trigger waitlist processing
  try {
    await processWaitlistForSlot(
      appointment.startTime,
      appointment.endTime,
      appointment.appointmentTypeId
    );
  } catch (error) {
    console.error("Waitlist processing failed:", error);
  }

  return {
    success: true,
    data: { state: "success" },
  };
}
```

---

## 6. Gmail API Integration

### 6.1 OAuth2 Transport Setup

```ts
// src/lib/email/gmail-client.ts
import { google } from "googleapis";

function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export { getGmailClient };
```

### 6.2 Email Sending Function

```ts
// src/lib/email/send-email.ts
import { db } from "@/db";
import { messageTemplates, notificationLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getGmailClient } from "./gmail-client";
import MailComposer from "nodemailer/lib/mail-composer";
import type {
  TemplateEvent,
  RecipientType,
} from "@/db/schema/enums"; // inferred types from pgEnum

interface SendEmailParams {
  templateEvent: TemplateEvent;
  recipientType: RecipientType;
  recipientEmail: string;
  appointmentId: string | null;
  patientId: string | null;
  variables: Record<string, string>;
}

/**
 * Send an email using a stored message template via Gmail API.
 *
 * Steps:
 * 1. Look up message_template by event + recipientType.
 * 2. Replace $variables in subject and body.
 * 3. Build MIME message via nodemailer MailComposer (handles UTF-8 Hungarian).
 * 4. Send via gmail.users.messages.send() using OAuth2 refresh token.
 * 5. Log result to notification_log.
 */
export async function sendBookingEmail(params: SendEmailParams): Promise<void> {
  const {
    templateEvent,
    recipientType,
    recipientEmail,
    appointmentId,
    patientId,
    variables,
  } = params;

  // 1. Look up template
  const template = await db.query.messageTemplates.findFirst({
    where: and(
      eq(messageTemplates.event, templateEvent),
      eq(messageTemplates.recipientType, recipientType),
      eq(messageTemplates.isActive, true)
    ),
  });

  if (!template) {
    console.warn(
      `No active template found for event=${templateEvent}, recipientType=${recipientType}`
    );
    // Log the miss but do not throw
    await logNotification({
      appointmentId,
      patientId,
      templateEvent,
      recipientEmail,
      subject: `[MISSING TEMPLATE] ${templateEvent}`,
      status: "failed",
      errorMessage: "No active message template found",
    });
    return;
  }

  // 2. Replace $variables
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = key.startsWith("$") ? key : `$${key}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }

  // 3. Build MIME message
  const fromEmail = process.env.GMAIL_USER_EMAIL!;
  const mail = new MailComposer({
    from: `"${variables.$clinic_name || "Dr. Morocz Angela"}" <${fromEmail}>`,
    to: recipientEmail,
    subject,
    html: wrapInHtmlLayout(body),
    textEncoding: "quoted-printable",
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
    },
  });

  try {
    const message = await mail.compile().build();
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 4. Send via Gmail API
    const gmail = getGmailClient();
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // 5. Log success
    await logNotification({
      appointmentId,
      patientId,
      templateEvent,
      recipientEmail,
      subject,
      status: "sent",
      errorMessage: null,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // 5. Log failure
    await logNotification({
      appointmentId,
      patientId,
      templateEvent,
      recipientEmail,
      subject,
      status: "failed",
      errorMessage: errorMsg,
    });

    throw error; // Re-throw so caller can handle
  }
}

// -- Helpers --

async function logNotification(params: {
  appointmentId: string | null;
  patientId: string | null;
  templateEvent: string;
  recipientEmail: string;
  subject: string;
  status: "sent" | "failed";
  errorMessage: string | null;
}) {
  await db.insert(notificationLog).values({
    appointmentId: params.appointmentId,
    patientId: params.patientId,
    templateEvent: params.templateEvent as any,
    recipientEmail: params.recipientEmail,
    subject: params.subject,
    status: params.status as any,
    errorMessage: params.errorMessage,
  });
}

/**
 * Wrap template body HTML in a minimal responsive email layout.
 * Template body may contain raw HTML from the database.
 */
function wrapInHtmlLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;padding:32px;">
    ${body}
  </div>
</body>
</html>`;
}
```

### 6.3 Template Variables Reference

| Variable | Source | Example Value |
|----------|--------|---------------|
| `$patient_name` | `patient.lastName + " " + patient.firstName` | `"Kovacs Anna"` |
| `$patient_first_name` | `patient.firstName` | `"Anna"` |
| `$doctor_name` | `doctorSettings.doctorName` | `"Dr. Morocz Angela"` |
| `$appointment_type` | `appointmentType.name` | `"Varandosgondozas"` |
| `$appointment_date` | formatted in `hu-HU` locale | `"2026. marcius 15."` |
| `$appointment_time` | formatted `HH:MM` | `"09:00"` |
| `$cancel_url` | `NEXT_PUBLIC_SITE_URL + "/cancel/" + token` | `"https://morocz.hu/cancel/abc..."` |
| `$clinic_name` | `doctorSettings.clinicName` | `"Dr. Morocz Angela Nogyogyaszat"` |
| `$clinic_phone` | `doctorSettings.phone` | `"+3633123456"` |
| `$clinic_address` | `doctorSettings.address` | `"2500 Esztergom, Fo ter 1."` |
| `$status` | appointment status | `"confirmed"` |

---

## 7. Google Calendar Integration

### 7.1 Service Account Client

```ts
// src/lib/calendar/google-calendar.ts
import { google } from "googleapis";

function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

const CALENDAR_ID =
  process.env.GOOGLE_CALENDAR_ID ?? "primary";

const TZ = "Europe/Budapest";
```

### 7.2 CRUD Operations

```ts
// src/lib/booking/google-calendar.ts
import { getCalendarClient, CALENDAR_ID, TZ } from "@/lib/calendar/google-calendar";

interface CalendarEventInput {
  appointmentId: string;
  patientFirstName: string;
  patientLastName: string;
  appointmentTypeName: string;
  startTime: Date;
  endTime: Date;
  patientEmail?: string;
  patientPhone?: string;
}

/**
 * Create a Google Calendar event for an appointment.
 * Returns the Google event ID.
 *
 * Event summary format: "Vizit: LastName FirstName -- AppointmentType"
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string> {
  const calendar = getCalendarClient();

  const summary = `Vizit: ${input.patientLastName} ${input.patientFirstName} \u2014 ${input.appointmentTypeName}`;

  const description = [
    `Paciens: ${input.patientLastName} ${input.patientFirstName}`,
    input.patientEmail ? `Email: ${input.patientEmail}` : null,
    input.patientPhone ? `Telefon: ${input.patientPhone}` : null,
    `Tipus: ${input.appointmentTypeName}`,
    `Appointment ID: ${input.appointmentId}`,
  ]
    .filter(Boolean)
    .join("\n");

  const event = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary,
      description,
      start: {
        dateTime: input.startTime.toISOString(),
        timeZone: TZ,
      },
      end: {
        dateTime: input.endTime.toISOString(),
        timeZone: TZ,
      },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 30 }],
      },
    },
  });

  return event.data.id!;
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  updates: {
    summary?: string;
    startTime?: Date;
    endTime?: Date;
    description?: string;
  }
): Promise<void> {
  const calendar = getCalendarClient();

  const requestBody: Record<string, any> = {};
  if (updates.summary) requestBody.summary = updates.summary;
  if (updates.description) requestBody.description = updates.description;
  if (updates.startTime) {
    requestBody.start = {
      dateTime: updates.startTime.toISOString(),
      timeZone: TZ,
    };
  }
  if (updates.endTime) {
    requestBody.end = {
      dateTime: updates.endTime.toISOString(),
      timeZone: TZ,
    };
  }

  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody,
  });
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();

  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId,
  });
}
```

---

## 8. Vercel Cron -- Reminders

### 8.1 Cron Configuration

```jsonc
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This runs daily at 08:00 UTC which is 09:00 CET / 10:00 CEST in Europe/Budapest.

### 8.2 Route Handler

```ts
// src/app/api/cron/send-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  appointments,
  patients,
  appointmentTypes,
  doctorSettings,
  waitlistEntries,
} from "@/db/schema";
import { and, eq, gte, lte, isNull, lt } from "drizzle-orm";
import { sendBookingEmail } from "@/lib/email/send-email";

export async function POST(req: NextRequest) {
  // 1. Verify CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { reminders: 0, errors: 0, waitlistExpired: 0 };

  // 2. Find confirmed appointments 24-28h from now with no reminder sent
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  const upcomingAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.status, "confirmed"),
      gte(appointments.startTime, windowStart),
      lte(appointments.startTime, windowEnd),
      isNull(appointments.reminderSentAt)
    ),
    with: {
      patient: true,
      appointmentType: true,
    },
  });

  // 3. Fetch settings
  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  const TZ = "Europe/Budapest";

  // 4. Send reminders
  for (const appt of upcomingAppointments) {
    try {
      const formattedDate = appt.startTime.toLocaleDateString("hu-HU", {
        timeZone: TZ, year: "numeric", month: "long", day: "numeric",
      });
      const formattedTime = appt.startTime.toLocaleTimeString("hu-HU", {
        timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://morocz.hu";
      const cancelUrl = appt.cancellationToken
        ? `${siteUrl}/cancel/${appt.cancellationToken}`
        : "";

      await sendBookingEmail({
        templateEvent: "reminder_24h",
        recipientType: "patient",
        recipientEmail: appt.patient.email,
        appointmentId: appt.id,
        patientId: appt.patient.id,
        variables: {
          $patient_name: `${appt.patient.lastName} ${appt.patient.firstName}`,
          $patient_first_name: appt.patient.firstName,
          $doctor_name: settings?.doctorName ?? "Dr. Morocz Angela",
          $appointment_type: appt.appointmentType.name,
          $appointment_date: formattedDate,
          $appointment_time: formattedTime,
          $cancel_url: cancelUrl,
          $clinic_name: settings?.clinicName ?? "",
          $clinic_phone: settings?.phone ?? "",
          $clinic_address: settings?.address ?? "",
          $status: "confirmed",
        },
      });

      // Mark reminder as sent
      await db
        .update(appointments)
        .set({ reminderSentAt: now })
        .where(eq(appointments.id, appt.id));

      results.reminders++;
    } catch (error) {
      console.error(`Reminder failed for appointment ${appt.id}:`, error);
      results.errors++;
    }
  }

  // 5. Expire waitlist entries past preferredDateTo
  const todayStr = now.toLocaleDateString("sv-SE", { timeZone: TZ });

  const expiredEntries = await db.query.waitlistEntries.findMany({
    where: and(
      eq(waitlistEntries.status, "waiting"),
      lt(waitlistEntries.preferredDateTo, todayStr)
    ),
  });

  for (const entry of expiredEntries) {
    await db
      .update(waitlistEntries)
      .set({ status: "expired" })
      .where(eq(waitlistEntries.id, entry.id));
    results.waitlistExpired++;
  }

  return NextResponse.json({
    ok: true,
    ...results,
    timestamp: now.toISOString(),
  });
}
```

---

## 9. Waitlist Processing

```ts
// src/lib/booking/waitlist.ts
import { db } from "@/db";
import { waitlistEntries, doctorSettings } from "@/db/schema";
import { and, eq, lte, gte, isNull, asc } from "drizzle-orm";
import { sendBookingEmail } from "../email/send-email";
import { getDayOfWeekISO, formatDateInTZ } from "./timezone";

const TZ = "Europe/Budapest";

/**
 * Find matching waitlist entries for a newly-available slot
 * and notify up to 3 people (FIFO).
 *
 * Called after every cancellation.
 *
 * Matching criteria:
 * - status = 'waiting'
 * - appointmentTypeId matches (or is NULL = any type)
 * - preferredDayOfWeek matches the slot's day (or is NULL = any day)
 * - preferredTimeStart <= slot start AND preferredTimeEnd >= slot end
 *   (or both are NULL = any time)
 * - preferredDateFrom <= slot date AND preferredDateTo >= slot date
 *   (or both are NULL = any date range)
 */
export async function processWaitlistForSlot(
  startTime: Date,
  endTime: Date,
  appointmentTypeId: number
): Promise<void> {
  const dateStr = formatDateInTZ(startTime, TZ);
  const dayOfWeek = getDayOfWeekISO(startTime, TZ);

  const timeStr = startTime.toLocaleTimeString("hu-HU", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Fetch all waiting entries, ordered by creation time (FIFO)
  const candidates = await db.query.waitlistEntries.findMany({
    where: eq(waitlistEntries.status, "waiting"),
    orderBy: [asc(waitlistEntries.createdAt)],
    limit: 50, // fetch a batch; we filter in application
  });

  // Filter matching candidates
  const matched = candidates.filter((entry) => {
    // Type match
    if (entry.appointmentTypeId !== null && entry.appointmentTypeId !== appointmentTypeId) {
      return false;
    }
    // Day match
    if (entry.preferredDayOfWeek !== null && entry.preferredDayOfWeek !== dayOfWeek) {
      return false;
    }
    // Time match
    if (entry.preferredTimeStart && timeStr < entry.preferredTimeStart) return false;
    if (entry.preferredTimeEnd && timeStr > entry.preferredTimeEnd) return false;
    // Date range match
    if (entry.preferredDateFrom && dateStr < entry.preferredDateFrom) return false;
    if (entry.preferredDateTo && dateStr > entry.preferredDateTo) return false;

    return true;
  });

  // Take top 3
  const toNotify = matched.slice(0, 3);

  // Fetch settings for email variables
  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  const formattedDate = startTime.toLocaleDateString("hu-HU", {
    timeZone: TZ, year: "numeric", month: "long", day: "numeric",
  });

  for (const entry of toNotify) {
    try {
      await sendBookingEmail({
        templateEvent: "waitlist_slot_available",
        recipientType: "patient",
        recipientEmail: entry.patientEmail,
        appointmentId: null,
        patientId: null,
        variables: {
          $patient_name: entry.patientName,
          $patient_first_name: entry.patientName.split(" ")[0] ?? entry.patientName,
          $doctor_name: settings?.doctorName ?? "Dr. Morocz Angela",
          $appointment_type: "", // Could be resolved from appointmentTypeId
          $appointment_date: formattedDate,
          $appointment_time: timeStr,
          $cancel_url: "",
          $clinic_name: settings?.clinicName ?? "",
          $clinic_phone: settings?.phone ?? "",
          $clinic_address: settings?.address ?? "",
          $status: "available",
        },
      });

      await db
        .update(waitlistEntries)
        .set({ status: "notified", notifiedAt: new Date() })
        .where(eq(waitlistEntries.id, entry.id));
    } catch (error) {
      console.error(`Waitlist notification failed for entry ${entry.id}:`, error);
    }
  }
}
```

---

## 10. CSV Import Script

```ts
// scripts/import-patients.ts
// Run with: npx tsx scripts/import-patients.ts ./patients.csv

import { db } from "@/db";
import { patients } from "@/db/schema";
import { sql } from "drizzle-orm";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { resolve } from "path";

interface CsvRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastAppointment: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importPatientsFromCSV(
  filePath: string
): Promise<ImportResult> {
  const absolutePath = resolve(filePath);
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  const rows: CsvRow[] = await new Promise((resolve, reject) => {
    const records: CsvRow[] = [];
    createReadStream(absolutePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true, // handle UTF-8 BOM
        })
      )
      .on("data", (row: CsvRow) => records.push(row))
      .on("end", () => resolve(records))
      .on("error", reject);
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2 for 1-indexed + header row

    try {
      // Skip test entries
      const fullName = `${row.firstName} ${row.lastName}`.toLowerCase();
      if (fullName.includes("test")) {
        result.skipped++;
        continue;
      }

      // Validate email
      if (!row.email || !row.email.includes("@")) {
        result.errors.push(`Line ${lineNum}: Invalid email "${row.email}"`);
        result.skipped++;
        continue;
      }

      // Normalize phone: "36xxx" -> "+36xxx"
      let phone: string | null = row.phone?.trim() || null;
      if (phone && /^\d/.test(phone)) {
        phone = `+${phone}`;
      }

      // Parse lastAppointment (M/D/YYYY format)
      let importedLastAppointment: string | null = null;
      if (row.lastAppointment) {
        const parsed = parseUSDate(row.lastAppointment);
        if (parsed) {
          importedLastAppointment = parsed; // "YYYY-MM-DD"
        }
      }

      // Build notes from lastAppointment
      const notes = importedLastAppointment
        ? `[Imported] Utolso vizit: ${importedLastAppointment}`
        : null;

      // Upsert by email
      await db
        .insert(patients)
        .values({
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          email: row.email.trim().toLowerCase(),
          phone,
          notes,
          importedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: patients.email,
          set: {
            phone: sql`COALESCE(EXCLUDED.phone, ${patients.phone})`,
            notes: sql`COALESCE(EXCLUDED.notes, ${patients.notes})`,
            importedAt: new Date(),
          },
        });

      result.imported++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Line ${lineNum}: ${msg}`);
    }
  }

  return result;
}

/**
 * Parse M/D/YYYY or MM/DD/YYYY to "YYYY-MM-DD"
 */
function parseUSDate(input: string): string | null {
  const parts = input.trim().split("/");
  if (parts.length !== 3) return null;

  const month = parseInt(parts[0], 10);
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// -- CLI entrypoint --
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-patients.ts <csv-file>");
    process.exit(1);
  }

  console.log(`Importing patients from ${filePath}...`);
  const result = await importPatientsFromCSV(filePath);

  console.log(`\nImport complete:`);
  console.log(`  Imported: ${result.imported}`);
  console.log(`  Skipped:  ${result.skipped}`);
  console.log(`  Errors:   ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
  }
}

main().catch(console.error);
```

---

## 11. Admin CRUD Server Actions

All admin actions live under `src/lib/admin/actions/`. Every action:

1. Calls `requireAuth()` or `requireAdmin()` first.
2. Validates input with Zod.
3. Returns `ActionResult<T>`.
4. Catches errors and returns typed error codes.

### 11.1 Zod Schemas (Admin)

```ts
// src/lib/admin/schemas.ts
import { z } from "zod";

// -- Pagination & Filtering --

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const patientListSchema = paginationSchema.extend({
  search: z.string().optional(),
  sort: z.enum(["name_asc", "name_desc", "created_asc", "created_desc"]).default("name_asc"),
});

export const appointmentListSchema = paginationSchema.extend({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]).optional(),
  appointmentTypeId: z.coerce.number().int().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patientId: z.string().uuid().optional(),
});

export const waitlistListSchema = paginationSchema.extend({
  status: z.enum(["waiting", "notified", "booked", "expired"]).optional(),
});

// -- Patient --

export const updatePatientSchema = z.object({
  firstName: z.string().trim().min(2).max(100).optional(),
  lastName: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

// -- Appointment --

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
  notes: z.string().max(5000).optional(),
});

export const addAppointmentNotesSchema = z.object({
  notes: z.string().max(5000),
});

// -- Schedule --

export const scheduleSlotSchema = z.object({
  appointmentTypeId: z.number().int().nullable().optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
}).refine((data) => data.startTime < data.endTime, {
  message: "startTime must be before endTime",
});

export const scheduleOverrideSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isClosed: z.boolean().default(false),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  slotDurationMinutes: z.number().int().min(5).max(240).nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
}).refine((data) => data.startDate <= data.endDate, {
  message: "startDate must be <= endDate",
});

// -- Appointment Types --

export const appointmentTypeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/),
  durationMinutes: z.number().int().min(5).max(480),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// -- Message Templates --

export const updateTemplateSchema = z.object({
  subject: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(50000),
  isActive: z.boolean().optional(),
});

// -- Doctor Settings --

export const updateSettingsSchema = z.object({
  clinicName: z.string().trim().min(1).max(200).optional(),
  doctorName: z.string().trim().min(1).max(200).optional(),
  doctorEmail: z.string().trim().email().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  googleCalendarId: z.string().trim().max(500).nullable().optional(),
  defaultSlotDurationMinutes: z.number().int().min(5).max(480).optional(),
  cancellationWindowHours: z.number().int().min(0).max(168).optional(),
});

// -- Admin Users --

export const createAdminUserSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  name: z.string().trim().min(2).max(200),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "receptionist"]).default("receptionist"),
});

export const updateAdminUserSchema = z.object({
  email: z.string().trim().email().toLowerCase().optional(),
  name: z.string().trim().min(2).max(200).optional(),
  password: z.string().min(8).max(128).optional(), // only set if changing
  role: z.enum(["admin", "receptionist"]).optional(),
});
```

### 11.2 Patient Actions

```ts
// src/lib/admin/actions/patients.ts
"use server";

import { db } from "@/db";
import { patients, appointments } from "@/db/schema";
import { eq, ilike, or, sql, asc, desc, count } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  patientListSchema,
  updatePatientSchema,
} from "../schemas";
import type { ActionResult, PaginatedResult } from "@/lib/booking/types";

type PatientRow = typeof patients.$inferSelect;

export async function listPatients(
  input: unknown
): Promise<ActionResult<PaginatedResult<PatientRow>>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = patientListSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
  }

  const { page, pageSize, search, sort } = parsed.data;
  const offset = (page - 1) * pageSize;

  const where = search
    ? or(
        ilike(patients.firstName, `%${search}%`),
        ilike(patients.lastName, `%${search}%`),
        ilike(patients.email, `%${search}%`),
        ilike(patients.phone, `%${search}%`)
      )
    : undefined;

  const orderMap = {
    name_asc: [asc(patients.lastName), asc(patients.firstName)],
    name_desc: [desc(patients.lastName), desc(patients.firstName)],
    created_asc: [asc(patients.createdAt)],
    created_desc: [desc(patients.createdAt)],
  } as const;

  const [items, totalResult] = await Promise.all([
    db.query.patients.findMany({
      where,
      orderBy: orderMap[sort],
      limit: pageSize,
      offset,
    }),
    db.select({ total: count() }).from(patients).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getPatient(
  id: string
): Promise<ActionResult<PatientRow & { appointments: any[] }>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, id),
    with: {
      appointments: {
        orderBy: [desc(appointments.startTime)],
        with: { appointmentType: true },
      },
    },
  });

  if (!patient) {
    return { success: false, error: "Patient not found", code: "NOT_FOUND" };
  }

  return { success: true, data: patient };
}

export async function updatePatient(
  id: string,
  data: unknown
): Promise<ActionResult<PatientRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = updatePatientSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const existing = await db.query.patients.findFirst({ where: eq(patients.id, id) });
  if (!existing) {
    return { success: false, error: "Patient not found", code: "NOT_FOUND" };
  }

  const [updated] = await db
    .update(patients)
    .set(parsed.data)
    .where(eq(patients.id, id))
    .returning();

  return { success: true, data: updated };
}

export async function deletePatient(id: string): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const existing = await db.query.patients.findFirst({ where: eq(patients.id, id) });
  if (!existing) {
    return { success: false, error: "Patient not found", code: "NOT_FOUND" };
  }

  // GDPR anonymization instead of hard delete
  await db
    .update(patients)
    .set({
      firstName: "[DELETED]",
      lastName: "[DELETED]",
      email: `deleted-${id}@anonymized.local`,
      phone: null,
      dateOfBirth: null,
      notes: "[GDPR - Data anonymized]",
    })
    .where(eq(patients.id, id));

  return { success: true, data: undefined };
}
```

### 11.3 Appointment Actions

```ts
// src/lib/admin/actions/appointments.ts
"use server";

import { db } from "@/db";
import { appointments, patients, appointmentTypes, doctorSettings } from "@/db/schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import {
  appointmentListSchema,
  updateAppointmentStatusSchema,
  addAppointmentNotesSchema,
} from "../schemas";
import { deleteCalendarEvent } from "@/lib/booking/google-calendar";
import { sendBookingEmail } from "@/lib/email/send-email";
import { processWaitlistForSlot } from "@/lib/booking/waitlist";
import type { ActionResult, PaginatedResult } from "@/lib/booking/types";

type AppointmentRow = typeof appointments.$inferSelect;

export async function listAppointments(
  input: unknown
): Promise<ActionResult<PaginatedResult<AppointmentRow>>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = appointmentListSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
  }

  const { page, pageSize, status, appointmentTypeId, dateFrom, dateTo, patientId } = parsed.data;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (status) conditions.push(eq(appointments.status, status));
  if (appointmentTypeId) conditions.push(eq(appointments.appointmentTypeId, appointmentTypeId));
  if (dateFrom) conditions.push(gte(appointments.startTime, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(appointments.startTime, new Date(dateTo + "T23:59:59Z")));
  if (patientId) conditions.push(eq(appointments.patientId, patientId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db.query.appointments.findMany({
      where,
      orderBy: [desc(appointments.startTime)],
      limit: pageSize,
      offset,
      with: {
        patient: true,
        appointmentType: true,
      },
    }),
    db.select({ total: count() }).from(appointments).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    success: true,
    data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAppointment(
  id: string
): Promise<ActionResult<AppointmentRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    with: { patient: true, appointmentType: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found", code: "NOT_FOUND" };
  }

  return { success: true, data: appointment };
}

export async function updateAppointmentStatus(
  id: string,
  data: unknown
): Promise<ActionResult<AppointmentRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = updateAppointmentStatusSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
  }

  const existing = await db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    with: { patient: true, appointmentType: true },
  });
  if (!existing) {
    return { success: false, error: "Appointment not found", code: "NOT_FOUND" };
  }

  const updates: Record<string, any> = { status: parsed.data.status };
  if (parsed.data.notes) updates.notes = parsed.data.notes;
  if (parsed.data.status === "cancelled") updates.cancelledAt = new Date();

  const [updated] = await db
    .update(appointments)
    .set(updates)
    .where(eq(appointments.id, id))
    .returning();

  // Side effects for cancellation
  if (parsed.data.status === "cancelled") {
    if (existing.googleEventId) {
      try { await deleteCalendarEvent(existing.googleEventId); } catch {}
    }
    try {
      await processWaitlistForSlot(
        existing.startTime,
        existing.endTime,
        existing.appointmentTypeId
      );
    } catch {}
  }

  return { success: true, data: updated };
}

export async function addAppointmentNotes(
  id: string,
  data: unknown
): Promise<ActionResult<AppointmentRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = addAppointmentNotesSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(appointments)
    .set({ notes: parsed.data.notes })
    .where(eq(appointments.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Appointment not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}
```

### 11.4 Schedule Actions

```ts
// src/lib/admin/actions/schedule.ts
"use server";

import { db } from "@/db";
import { weeklySchedule, scheduleOverrides } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { scheduleSlotSchema, scheduleOverrideSchema } from "../schemas";
import type { ActionResult } from "@/lib/booking/types";

type ScheduleRow = typeof weeklySchedule.$inferSelect;
type OverrideRow = typeof scheduleOverrides.$inferSelect;

// -- Weekly Schedule --

export async function getWeeklySchedule(): Promise<ActionResult<ScheduleRow[]>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const items = await db.query.weeklySchedule.findMany({
    orderBy: [asc(weeklySchedule.dayOfWeek), asc(weeklySchedule.startTime)],
    with: { appointmentType: true },
  });

  return { success: true, data: items };
}

export async function createScheduleSlot(
  data: unknown
): Promise<ActionResult<ScheduleRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = scheduleSlotSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [created] = await db.insert(weeklySchedule).values(parsed.data).returning();
  return { success: true, data: created };
}

export async function updateScheduleSlot(
  id: number,
  data: unknown
): Promise<ActionResult<ScheduleRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = scheduleSlotSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(weeklySchedule)
    .set(parsed.data)
    .where(eq(weeklySchedule.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Schedule slot not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}

export async function deleteScheduleSlot(id: number): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const existing = await db.query.weeklySchedule.findFirst({
    where: eq(weeklySchedule.id, id),
  });
  if (!existing) {
    return { success: false, error: "Schedule slot not found", code: "NOT_FOUND" };
  }

  await db.delete(weeklySchedule).where(eq(weeklySchedule.id, id));
  return { success: true, data: undefined };
}

// -- Schedule Overrides --

export async function listOverrides(): Promise<ActionResult<OverrideRow[]>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const items = await db.query.scheduleOverrides.findMany({
    orderBy: [asc(scheduleOverrides.startDate)],
  });

  return { success: true, data: items };
}

export async function createOverride(
  data: unknown
): Promise<ActionResult<OverrideRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = scheduleOverrideSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [created] = await db.insert(scheduleOverrides).values(parsed.data).returning();
  return { success: true, data: created };
}

export async function updateOverride(
  id: number,
  data: unknown
): Promise<ActionResult<OverrideRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = scheduleOverrideSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(scheduleOverrides)
    .set(parsed.data)
    .where(eq(scheduleOverrides.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Override not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}

export async function deleteOverride(id: number): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const existing = await db.query.scheduleOverrides.findFirst({
    where: eq(scheduleOverrides.id, id),
  });
  if (!existing) {
    return { success: false, error: "Override not found", code: "NOT_FOUND" };
  }

  await db.delete(scheduleOverrides).where(eq(scheduleOverrides.id, id));
  return { success: true, data: undefined };
}
```

### 11.5 Appointment Types Actions

```ts
// src/lib/admin/actions/appointment-types.ts
"use server";

import { db } from "@/db";
import { appointmentTypes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { appointmentTypeSchema } from "../schemas";
import type { ActionResult } from "@/lib/booking/types";

type AppointmentTypeRow = typeof appointmentTypes.$inferSelect;

export async function listTypes(): Promise<ActionResult<AppointmentTypeRow[]>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const items = await db.query.appointmentTypes.findMany({
    orderBy: [asc(appointmentTypes.sortOrder)],
  });

  return { success: true, data: items };
}

export async function createType(
  data: unknown
): Promise<ActionResult<AppointmentTypeRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = appointmentTypeSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [created] = await db.insert(appointmentTypes).values(parsed.data).returning();
  return { success: true, data: created };
}

export async function updateType(
  id: number,
  data: unknown
): Promise<ActionResult<AppointmentTypeRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = appointmentTypeSchema.partial().safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(appointmentTypes)
    .set(parsed.data)
    .where(eq(appointmentTypes.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Appointment type not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}

export async function toggleTypeActive(
  id: number
): Promise<ActionResult<AppointmentTypeRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const existing = await db.query.appointmentTypes.findFirst({
    where: eq(appointmentTypes.id, id),
  });
  if (!existing) {
    return { success: false, error: "Appointment type not found", code: "NOT_FOUND" };
  }

  const [updated] = await db
    .update(appointmentTypes)
    .set({ isActive: !existing.isActive })
    .where(eq(appointmentTypes.id, id))
    .returning();

  return { success: true, data: updated };
}
```

### 11.6 Message Template Actions

```ts
// src/lib/admin/actions/message-templates.ts
"use server";

import { db } from "@/db";
import { messageTemplates } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { updateTemplateSchema } from "../schemas";
import type { ActionResult } from "@/lib/booking/types";

type TemplateRow = typeof messageTemplates.$inferSelect;

export async function listTemplates(): Promise<ActionResult<TemplateRow[]>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const items = await db.query.messageTemplates.findMany({
    orderBy: [asc(messageTemplates.event)],
  });

  return { success: true, data: items };
}

export async function getTemplate(
  id: number
): Promise<ActionResult<TemplateRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const template = await db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.id, id),
  });

  if (!template) {
    return { success: false, error: "Template not found", code: "NOT_FOUND" };
  }

  return { success: true, data: template };
}

export async function updateTemplate(
  id: number,
  data: unknown
): Promise<ActionResult<TemplateRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = updateTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(messageTemplates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(messageTemplates.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Template not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}

export async function previewTemplate(
  id: number,
  sampleVars: Record<string, string>
): Promise<ActionResult<{ subject: string; body: string }>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const template = await db.query.messageTemplates.findFirst({
    where: eq(messageTemplates.id, id),
  });

  if (!template) {
    return { success: false, error: "Template not found", code: "NOT_FOUND" };
  }

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(sampleVars)) {
    const placeholder = key.startsWith("$") ? key : `$${key}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }

  return { success: true, data: { subject, body } };
}
```

### 11.7 Waitlist Actions

```ts
// src/lib/admin/actions/waitlist.ts
"use server";

import { db } from "@/db";
import { waitlistEntries, doctorSettings } from "@/db/schema";
import { eq, desc, count, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { waitlistListSchema } from "../schemas";
import { sendBookingEmail } from "@/lib/email/send-email";
import type { ActionResult, PaginatedResult } from "@/lib/booking/types";

type WaitlistRow = typeof waitlistEntries.$inferSelect;

export async function listWaitlist(
  input: unknown
): Promise<ActionResult<PaginatedResult<WaitlistRow>>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = waitlistListSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters", code: "VALIDATION_ERROR" };
  }

  const { page, pageSize, status } = parsed.data;
  const offset = (page - 1) * pageSize;

  const where = status ? eq(waitlistEntries.status, status) : undefined;

  const [items, totalResult] = await Promise.all([
    db.query.waitlistEntries.findMany({
      where,
      orderBy: [desc(waitlistEntries.createdAt)],
      limit: pageSize,
      offset,
      with: { appointmentType: true },
    }),
    db.select({ total: count() }).from(waitlistEntries).where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    success: true,
    data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function deleteWaitlistEntry(id: string): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const existing = await db.query.waitlistEntries.findFirst({
    where: eq(waitlistEntries.id, id),
  });
  if (!existing) {
    return { success: false, error: "Waitlist entry not found", code: "NOT_FOUND" };
  }

  await db.delete(waitlistEntries).where(eq(waitlistEntries.id, id));
  return { success: true, data: undefined };
}

export async function manualNotifyEntry(
  id: string
): Promise<ActionResult> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const entry = await db.query.waitlistEntries.findFirst({
    where: eq(waitlistEntries.id, id),
  });
  if (!entry) {
    return { success: false, error: "Waitlist entry not found", code: "NOT_FOUND" };
  }

  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  await sendBookingEmail({
    templateEvent: "waitlist_slot_available",
    recipientType: "patient",
    recipientEmail: entry.patientEmail,
    appointmentId: null,
    patientId: null,
    variables: {
      $patient_name: entry.patientName,
      $patient_first_name: entry.patientName.split(" ")[0] ?? entry.patientName,
      $doctor_name: settings?.doctorName ?? "Dr. Morocz Angela",
      $appointment_type: "",
      $appointment_date: "",
      $appointment_time: "",
      $cancel_url: "",
      $clinic_name: settings?.clinicName ?? "",
      $clinic_phone: settings?.phone ?? "",
      $clinic_address: settings?.address ?? "",
      $status: "available",
    },
  });

  await db
    .update(waitlistEntries)
    .set({ status: "notified", notifiedAt: new Date() })
    .where(eq(waitlistEntries.id, id));

  return { success: true, data: undefined };
}
```

### 11.8 Settings Actions

```ts
// src/lib/admin/actions/settings.ts
"use server";

import { db } from "@/db";
import { doctorSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/require-auth";
import { updateSettingsSchema } from "../schemas";
import type { ActionResult } from "@/lib/booking/types";

type SettingsRow = typeof doctorSettings.$inferSelect;

export async function getSettings(): Promise<ActionResult<SettingsRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const settings = await db.query.doctorSettings.findFirst({
    where: eq(doctorSettings.id, 1),
  });

  if (!settings) {
    return { success: false, error: "Settings not found", code: "NOT_FOUND" };
  }

  return { success: true, data: settings };
}

export async function updateSettings(
  data: unknown
): Promise<ActionResult<SettingsRow>> {
  const authResult = await requireAuth();
  if (!authResult.authenticated) return authResult.error;

  const parsed = updateSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const [updated] = await db
    .update(doctorSettings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(doctorSettings.id, 1))
    .returning();

  if (!updated) {
    return { success: false, error: "Settings not found", code: "NOT_FOUND" };
  }

  return { success: true, data: updated };
}
```

### 11.9 Admin User Actions

```ts
// src/lib/admin/actions/admin-users.ts
"use server";

import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/auth/require-auth";
import { createAdminUserSchema, updateAdminUserSchema } from "../schemas";
import type { ActionResult } from "@/lib/booking/types";

// Omit passwordHash from returned data
type AdminUserSafe = Omit<typeof adminUsers.$inferSelect, "passwordHash">;

function sanitize(user: typeof adminUsers.$inferSelect): AdminUserSafe {
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function listUsers(): Promise<ActionResult<AdminUserSafe[]>> {
  const authResult = await requireAdmin();
  if (!authResult.authenticated) return authResult.error;

  const items = await db.query.adminUsers.findMany({
    orderBy: [asc(adminUsers.name)],
  });

  return { success: true, data: items.map(sanitize) };
}

export async function createUser(
  data: unknown
): Promise<ActionResult<AdminUserSafe>> {
  const authResult = await requireAdmin();
  if (!authResult.authenticated) return authResult.error;

  const parsed = createAdminUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  // Check for duplicate email
  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, parsed.data.email),
  });
  if (existing) {
    return { success: false, error: "Email already in use", code: "CONFLICT" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const [created] = await db
    .insert(adminUsers)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
    })
    .returning();

  return { success: true, data: sanitize(created) };
}

export async function updateUser(
  id: number,
  data: unknown
): Promise<ActionResult<AdminUserSafe>> {
  const authResult = await requireAdmin();
  if (!authResult.authenticated) return authResult.error;

  const parsed = updateAdminUserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Validation error", code: "VALIDATION_ERROR" };
  }

  const updates: Record<string, any> = {};
  if (parsed.data.email) updates.email = parsed.data.email;
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.password) {
    updates.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  const [updated] = await db
    .update(adminUsers)
    .set(updates)
    .where(eq(adminUsers.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Admin user not found", code: "NOT_FOUND" };
  }

  return { success: true, data: sanitize(updated) };
}

export async function deactivateUser(
  id: number
): Promise<ActionResult<AdminUserSafe>> {
  const authResult = await requireAdmin();
  if (!authResult.authenticated) return authResult.error;

  // Prevent self-deactivation
  if (String(id) === authResult.session.user.id) {
    return { success: false, error: "Cannot deactivate your own account", code: "CONFLICT" };
  }

  const [updated] = await db
    .update(adminUsers)
    .set({ isActive: false })
    .where(eq(adminUsers.id, id))
    .returning();

  if (!updated) {
    return { success: false, error: "Admin user not found", code: "NOT_FOUND" };
  }

  return { success: true, data: sanitize(updated) };
}
```

---

## 12. Environment Variables

All environment variables required for the booking system. Add these to `.env.local` for development and to Vercel environment settings for production.

```bash
# --- Database (Neon PostgreSQL) ---
DATABASE_URL=postgresql://user:password@ep-xxx-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require

# --- NextAuth.js ---
NEXTAUTH_SECRET=<random-256-bit-hex-string>      # openssl rand -hex 32
NEXTAUTH_URL=http://localhost:3000                # production: https://morocz.hu

# --- Gmail API (OAuth2 refresh token for sending emails) ---
GMAIL_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GMAIL_REFRESH_TOKEN=1//0xxxxxxxxxxxxxxxxxxxxxxxxxx
GMAIL_USER_EMAIL=rendelo@morocz.hu                # the "from" address

# --- Google Calendar API (service account) ---
GOOGLE_CLIENT_EMAIL=booking@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=doctor@morocz.hu               # or a dedicated calendar ID

# --- Vercel Cron ---
CRON_SECRET=<random-256-bit-hex-string>           # openssl rand -hex 32

# --- Public ---
NEXT_PUBLIC_SITE_URL=https://morocz.hu             # used for cancellation URLs
```

| Variable | Server/Public | Required | Description |
|----------|---------------|----------|-------------|
| `DATABASE_URL` | Server | Yes | Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Server | Yes | JWT signing secret for NextAuth.js |
| `NEXTAUTH_URL` | Server | Yes | Canonical URL for auth callbacks |
| `GMAIL_CLIENT_ID` | Server | Yes | Google OAuth2 client ID for Gmail API |
| `GMAIL_CLIENT_SECRET` | Server | Yes | Google OAuth2 client secret |
| `GMAIL_REFRESH_TOKEN` | Server | Yes | Long-lived refresh token for Gmail API |
| `GMAIL_USER_EMAIL` | Server | Yes | Email address to send from |
| `GOOGLE_CLIENT_EMAIL` | Server | Yes | Service account email for Calendar API |
| `GOOGLE_PRIVATE_KEY` | Server | Yes | Service account private key (PEM) |
| `GOOGLE_CALENDAR_ID` | Server | Yes | Google Calendar ID to create events in |
| `CRON_SECRET` | Server | Yes | Bearer token for cron endpoint auth |
| `NEXT_PUBLIC_SITE_URL` | Public | Yes | Base URL for cancellation links |

---

## 13. Package Dependencies

New packages to add to the existing `package.json`:

```bash
# Runtime dependencies
npm install next-auth@5           # v5 (Auth.js) for Next.js App Router
npm install bcryptjs              # password hashing (pure JS, no native deps)
npm install zod                   # schema validation
npm install googleapis            # Google Calendar API + Gmail API
npm install nodemailer            # MailComposer for MIME construction
npm install csv-parse             # CSV parsing for patient import
npm install drizzle-orm           # already in 01-database-schema.md
npm install @neondatabase/serverless  # already in 01-database-schema.md

# Dev dependencies
npm install -D drizzle-kit        # already in 01-database-schema.md
npm install -D @types/bcryptjs    # TypeScript types
npm install -D @types/nodemailer  # TypeScript types
```

### Version Pinning

| Package | Version | Purpose |
|---------|---------|---------|
| `next-auth` | `^5.0.0` | Auth.js v5 with App Router support, JWT sessions |
| `bcryptjs` | `^2.4.3` | Pure-JS bcrypt (no native compilation needed on Vercel) |
| `zod` | `^3.23.0` | Runtime schema validation |
| `googleapis` | `^144.0.0` | Official Google APIs client (Calendar + Gmail) |
| `nodemailer` | `^6.9.0` | Used only for `MailComposer` (MIME construction) |
| `csv-parse` | `^5.6.0` | Streaming CSV parser |
| `drizzle-orm` | `^0.38.0` | ORM (from database schema doc) |
| `@neondatabase/serverless` | `^0.10.0` | Neon PostgreSQL driver (from database schema doc) |
| `drizzle-kit` | `^0.30.0` | Migration tooling (dev) |
| `@types/bcryptjs` | `^2.4.6` | TypeScript types (dev) |
| `@types/nodemailer` | `^6.4.17` | TypeScript types (dev) |

---

## 14. Error Handling Strategy

### Principles

1. **Never expose internal errors to clients.** All server actions return `ActionResult<T>` with a human-readable `error` string and a machine-readable `code`.
2. **Log internal details server-side.** Use `console.error` with structured context. In production, these go to Vercel's log drain.
3. **Non-fatal side effects do not fail the primary operation.** Calendar event creation failure does not fail the booking. Email failure does not fail the booking. Both are logged.
4. **Database constraint violations are caught.** PostgreSQL error code `23P01` (exclusion violation) is caught and returned as `SLOT_UNAVAILABLE`.
5. **All Zod validation runs server-side.** Client-side validation is for UX only; the server is the source of truth.

### Error Code Reference

| Code | HTTP Equivalent | When Used |
|------|----------------|-----------|
| `VALIDATION_ERROR` | 400 | Zod schema validation failed |
| `NOT_FOUND` | 404 | Entity does not exist |
| `CONFLICT` | 409 | Duplicate email, self-deactivation |
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Session exists but role insufficient |
| `SLOT_UNAVAILABLE` | 409 | Time slot taken during booking |
| `TOKEN_EXPIRED` | 410 | Cancellation window has passed |
| `TOKEN_INVALID` | 404 | Cancellation token not found |
| `ALREADY_CANCELLED` | 409 | Appointment already cancelled |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 15. File Structure

```
src/
  app/
    api/
      auth/[...nextauth]/route.ts       # NextAuth.js handlers
      slots/route.ts                     # GET public slot availability
      cron/send-reminders/route.ts       # POST cron job
    admin/
      login/page.tsx                     # Login page
      (dashboard)/                       # Protected layout group
        layout.tsx                       # Admin shell (sidebar, nav)
        page.tsx                         # Dashboard overview
        patients/page.tsx               # Patient list
        patients/[id]/page.tsx          # Patient detail
        appointments/page.tsx           # Appointment list
        appointments/[id]/page.tsx      # Appointment detail
        schedule/page.tsx               # Weekly schedule + overrides
        appointment-types/page.tsx      # Type management
        templates/page.tsx              # Email template editor
        templates/[id]/page.tsx         # Single template edit
        waitlist/page.tsx               # Waitlist management
        settings/page.tsx               # Doctor/clinic settings
        users/page.tsx                  # Admin user management (admin only)
    cancel/[token]/
      page.tsx                           # Cancellation page (public)
      cancel-form.tsx                    # Client component for cancel action
  lib/
    auth/
      index.ts                           # NextAuth exports (handlers, auth, signIn, signOut)
      auth.config.ts                     # NextAuth configuration
      require-auth.ts                    # requireAuth() and requireAdmin() helpers
      types.d.ts                         # NextAuth type augmentation
    booking/
      types.ts                           # ActionResult, TimeSlot, BookingConfirmation, etc.
      schemas.ts                         # Zod schemas for booking input
      slots.ts                           # getAvailableSlots()
      timezone.ts                        # TZ helpers (formatDateInTZ, toUTCFromTZ, etc.)
      google-calendar.ts                 # createCalendarEvent, updateCalendarEvent, deleteCalendarEvent
      waitlist.ts                        # processWaitlistForSlot()
      actions/
        create-booking.ts               # "use server" -- createBooking()
        cancel-appointment.ts           # "use server" -- cancelAppointment()
    email/
      gmail-client.ts                    # Gmail OAuth2 client factory
      send-email.ts                      # sendBookingEmail() + notification logging
    calendar/
      google-calendar.ts                 # Google Calendar service account client factory
    admin/
      schemas.ts                         # All Zod schemas for admin CRUD
      actions/
        patients.ts                      # listPatients, getPatient, updatePatient, deletePatient
        appointments.ts                  # listAppointments, getAppointment, updateAppointmentStatus, addAppointmentNotes
        schedule.ts                      # getWeeklySchedule, createScheduleSlot, updateScheduleSlot, deleteScheduleSlot, listOverrides, createOverride, updateOverride, deleteOverride
        appointment-types.ts             # listTypes, createType, updateType, toggleTypeActive
        message-templates.ts             # listTemplates, getTemplate, updateTemplate, previewTemplate
        waitlist.ts                      # listWaitlist, deleteWaitlistEntry, manualNotifyEntry
        settings.ts                      # getSettings, updateSettings
        admin-users.ts                   # listUsers, createUser, updateUser, deactivateUser
  db/
    index.ts                             # Database connection (from 01-database-schema.md)
    schema/                              # All Drizzle schema files (from 01-database-schema.md)
  middleware.ts                          # Route protection for /admin/*
scripts/
  import-patients.ts                     # CSV import CLI script
vercel.json                              # Cron schedule configuration
```

---

## Appendix A: Sequence Diagrams

### Booking Flow

```
Patient              Browser             Server Action           Database         Google Calendar      Gmail API
  |                    |                      |                     |                   |                 |
  |  Fill form         |                      |                     |                   |                 |
  |  Submit ---------> |                      |                     |                   |                 |
  |                    |  createBooking() --> |                     |                   |                 |
  |                    |                      |  Validate (Zod)     |                   |                 |
  |                    |                      |  Fetch appt type -> |                   |                 |
  |                    |                      |  BEGIN TX            |                   |                 |
  |                    |                      |  SELECT FOR UPDATE ->|                   |                 |
  |                    |                      |  (check conflicts)  |                   |                 |
  |                    |                      |  Upsert patient --> |                   |                 |
  |                    |                      |  INSERT appointment->|                   |                 |
  |                    |                      |  COMMIT TX           |                   |                 |
  |                    |                      |  createCalendarEvent |----create-------->|                 |
  |                    |                      |  <-- eventId -----  |                   |                 |
  |                    |                      |  UPDATE eventId --> |                   |                 |
  |                    |                      |  sendBookingEmail   |                   |-------send----->|
  |                    |                      |  Log notification ->|                   |                 |
  |                    |  <-- confirmation -- |                     |                   |                 |
  |  <-- show result - |                      |                     |                   |                 |
```

### Cancellation Flow

```
Patient              Browser             Server Action           Database         Google Calendar      Gmail API       Waitlist
  |                    |                      |                     |                   |                 |              |
  |  Click cancel link |                      |                     |                   |                 |              |
  |  GET /cancel/[t] ->|                      |                     |                   |                 |              |
  |                    |  Fetch by token ---> |  SELECT ---------->|                   |                 |              |
  |                    |  <-- render form --- |                     |                   |                 |              |
  |  Confirm cancel -->|                      |                     |                   |                 |              |
  |                    |  cancelAppt(token) ->|                     |                   |                 |              |
  |                    |                      |  Validate token --> |                   |                 |              |
  |                    |                      |  Check window       |                   |                 |              |
  |                    |                      |  UPDATE cancelled ->|                   |                 |              |
  |                    |                      |  deleteCalendarEvt  |----delete-------->|                 |              |
  |                    |                      |  sendCancelEmail    |                   |---send patient->|              |
  |                    |                      |  sendCancelEmail    |                   |---send doctor-->|              |
  |                    |                      |  processWaitlist    |                   |                 |---notify---->|
  |                    |  <-- success ------- |                     |                   |                 |              |
  |  <-- confirmation -|                      |                     |                   |                 |              |
```

---

## Appendix B: Open Questions

1. **Transaction driver**: The `neon-http` driver supports `sql.transaction()` but does not support `SELECT FOR UPDATE` (which requires a persistent connection). The booking flow uses `db.transaction()` which may require switching to the `@neondatabase/serverless` WebSocket driver for that specific operation. Decision needed during implementation -- the code above uses `db.transaction()` and assumes the WebSocket driver is available for transactional flows.

2. **React Email vs raw HTML templates**: The current design uses `message_templates.body` as raw HTML stored in the database with `$variable` placeholders. React Email could be used for the initial seed templates, but once templates are admin-editable, the source of truth is the database HTML. The `wrapInHtmlLayout()` function provides a minimal responsive wrapper. React Email is not listed as a dependency because the admin-editable template approach does not use it at runtime.

3. **Rate limiting on public endpoints**: The `GET /api/slots` and `POST createBooking` paths are public. Consider adding rate limiting via Vercel's built-in WAF rules or an application-level rate limiter (e.g., `@upstash/ratelimit` with Vercel KV) to prevent abuse.

4. **Idempotency on booking**: If a patient double-clicks the submit button, two concurrent `createBooking` calls could race. The `SELECT FOR UPDATE` and exclusion constraint prevent duplicate bookings, but the patient may see a confusing `SLOT_UNAVAILABLE` error on the second click. Consider a client-side debounce and/or a server-side idempotency key (e.g., hash of email + date + time, checked before insert).

5. **Gmail API token refresh**: The OAuth2 refresh token is long-lived but can be revoked. Monitor for `invalid_grant` errors in the notification log and alert the admin to re-authorize.
