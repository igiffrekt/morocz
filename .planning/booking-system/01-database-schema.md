# Database Schema Design -- Drizzle ORM + Neon PostgreSQL

**Author**: database-architect
**Status**: Final
**Date**: 2026-02-21
**Database**: Neon PostgreSQL (Frankfurt `eu-central-1`)
**ORM**: Drizzle ORM with `@neondatabase/serverless`

---

## 1. Architecture Decisions

### Boundary: Sanity CMS vs PostgreSQL

| Sanity CMS (content, stays as-is)          | PostgreSQL / Neon (booking and operations)      |
| ------------------------------------------ | ----------------------------------------------- |
| Services, service categories, pricing      | Appointment types (booking-specific metadata)    |
| Lab tests, blog posts, testimonials         | Patients (PII -- name, email, phone)             |
| Homepage content, site settings             | Appointments, scheduling, waitlist               |
| Privacy policy, blog categories             | Admin users, notification log, message templates |

No data is duplicated across the two stores. The `appointment_types` table holds only booking-relevant fields (slug, duration, color, sort order). Service descriptions and pricing stay in Sanity.

### Key Technical Choices

- **UUIDs** for all patient-facing IDs (appointments, patients, waitlist) -- unpredictable, safe in URLs and cancellation tokens.
- **Serial integers** for internal-only tables (admin_users, weekly_schedule, schedule_overrides, message_templates, notification_log, doctor_settings) -- simpler, smaller indexes.
- **`pgEnum`** for all status/role fields -- enforced at DB level, type-safe in Drizzle.
- **`timestamptz`** for all timestamps -- the server runs UTC; the frontend formats to `Europe/Budapest`.
- **PostgreSQL `time` type** for schedule start/end times -- no date component needed.
- **Exclusion constraint** on `appointments` using `tstzrange` to prevent overlapping bookings at the DB level.
- **Soft-delete via `isActive`** for admin_users and appointment_types; hard-delete never happens on PII tables (GDPR retention policy applies).

---

## 2. Environment Variables

```env
# .env.local
DATABASE_URL=postgresql://user:password@ep-xxx-xxx-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

The single `DATABASE_URL` connection string is used for all Drizzle operations. Neon provides it in the dashboard under Connection Details. Always use `sslmode=require`.

---

## 3. Required npm Packages

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

---

## 4. Drizzle Configuration

```ts
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 5. Database Connection

```ts
// src/db/index.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
```

### Why `neon-http` (not WebSocket)?

For Next.js App Router on Vercel/serverless, `neon-http` uses one-shot HTTP queries per request, which is simpler and avoids WebSocket connection management overhead. The `neon` driver's HTTP mode supports implicit transactions for multi-statement operations.

If explicit multi-statement transactions are needed later (e.g., complex booking flows with the exclusion constraint), switch to the WebSocket driver:

```ts
// src/db/transactional.ts (optional, for WebSocket-based transactions)
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const dbPool = drizzle(pool, { schema });
```

---

## 6. Complete Schema Definition

```ts
// src/db/schema.ts
import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const adminRoleEnum = pgEnum("admin_role", ["admin", "receptionist"]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "notified",
  "booked",
  "expired",
]);

export const templateEventEnum = pgEnum("template_event", [
  "appointment_created",
  "reminder_24h",
  "cancelled_by_patient",
  "cancelled_by_doctor",
  "status_changed",
  "waitlist_slot_available",
]);

export const recipientTypeEnum = pgEnum("recipient_type", [
  "patient",
  "doctor",
  "both",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "sent",
  "failed",
]);

// ============================================================================
// TABLE 1: admin_users
// ============================================================================
// Internal-only. Serial PK. Stores hashed passwords (bcrypt/argon2).

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TABLE 2: appointment_types
// ============================================================================
// Booking-specific metadata only. Content descriptions live in Sanity.

export const appointmentTypes = pgTable("appointment_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Varandosgondozas", "Nogyogyaszat"
  slug: text("slug").notNull().unique(), // URL-safe identifier
  durationMinutes: integer("duration_minutes").notNull(),
  color: text("color").notNull().default("#3B82F6"), // hex for calendar UI
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TABLE 3: patients
// ============================================================================
// UUID PK. Contains PII -- subject to GDPR data retention and deletion rules.

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(), // E.164 format: +36201234567
    dateOfBirth: date("date_of_birth"), // nullable, ISO 8601 date string
    notes: text("notes"), // internal notes, never shown to patient
    importedLastAppointment: date("imported_last_appointment"), // set during CSV import
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_patients_email").on(table.email),
    index("idx_patients_last_name").on(table.lastName),
  ],
);

// ============================================================================
// TABLE 4: appointments
// ============================================================================
// The core booking table. UUID PK. Includes a PostgreSQL exclusion constraint
// (applied via raw SQL migration) to prevent overlapping time ranges.

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    appointmentTypeId: integer("appointment_type_id")
      .notNull()
      .references(() => appointmentTypes.id, { onDelete: "restrict" }),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("confirmed"),
    googleEventId: text("google_event_id"),
    cancellationToken: text("cancellation_token").unique(),
    cancellationTokenExpiresAt: timestamp("cancellation_token_expires_at", {
      withTimezone: true,
    }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    notes: text("notes"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_appointments_start_time").on(table.startTime),
    index("idx_appointments_status").on(table.status),
    index("idx_appointments_cancellation_token").on(table.cancellationToken),
    index("idx_appointments_patient_id").on(table.patientId),
  ],
);

// ============================================================================
// TABLE 5: weekly_schedule
// ============================================================================
// Defines recurring weekly availability windows.
// NULL appointmentTypeId means the schedule applies globally (all types).

export const weeklySchedule = pgTable("weekly_schedule", {
  id: serial("id").primaryKey(),
  appointmentTypeId: integer("appointment_type_id").references(
    () => appointmentTypes.id,
    { onDelete: "cascade" },
  ), // nullable -- null means global
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday .. 7=Sunday (ISO 8601)
  startTime: time("start_time").notNull(), // e.g. "09:00"
  endTime: time("end_time").notNull(), // e.g. "17:00"
  isActive: boolean("is_active").notNull().default(true),
});

// ============================================================================
// TABLE 6: schedule_overrides
// ============================================================================
// One-off overrides: holidays, vacation days, or modified hours for a date range.

export const scheduleOverrides = pgTable("schedule_overrides", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").notNull().default(false), // true = entire day(s) blocked
  startTime: time("start_time"), // modified hours (when isClosed=false)
  endTime: time("end_time"),
  slotDurationMinutes: integer("slot_duration_minutes"), // override per-type defaults
  reason: text("reason"), // e.g. "Karacsony", "Szabadsag"
});

// ============================================================================
// TABLE 7: waitlist_entries
// ============================================================================
// Anonymous submissions from the public booking page. UUID PK.

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientEmail: text("patient_email").notNull(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"), // nullable
  appointmentTypeId: integer("appointment_type_id").references(
    () => appointmentTypes.id,
    { onDelete: "set null" },
  ), // nullable
  preferredDayOfWeek: integer("preferred_day_of_week"), // 1-7, nullable = any day
  preferredTimeStart: time("preferred_time_start"),
  preferredTimeEnd: time("preferred_time_end"),
  preferredDateFrom: date("preferred_date_from"),
  preferredDateTo: date("preferred_date_to"),
  status: waitlistStatusEnum("status").notNull().default("waiting"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TABLE 8: message_templates
// ============================================================================
// Stores email templates with $variable placeholders. Admin-editable.

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  event: templateEventEnum("event").notNull(),
  recipientType: recipientTypeEnum("recipient_type")
    .notNull()
    .default("patient"),
  subject: text("subject").notNull(),
  body: text("body").notNull(), // contains $patientName, $appointmentDate, etc.
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TABLE 9: notification_log
// ============================================================================
// Audit trail for all emails sent. Never deleted (compliance).

export const notificationLog = pgTable("notification_log", {
  id: serial("id").primaryKey(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }), // nullable
  patientId: uuid("patient_id").references(() => patients.id, {
    onDelete: "set null",
  }), // nullable
  templateEvent: text("template_event").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  status: notificationStatusEnum("status").notNull().default("sent"),
  errorMessage: text("error_message"), // nullable, populated on failure
});

// ============================================================================
// TABLE 10: doctor_settings
// ============================================================================
// Singleton row (id=1) -- clinic/doctor configuration for the booking system.

export const doctorSettings = pgTable("doctor_settings", {
  id: serial("id").primaryKey(), // always row id=1
  clinicName: text("clinic_name").notNull(),
  doctorName: text("doctor_name").notNull(),
  doctorEmail: text("doctor_email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  googleCalendarId: text("google_calendar_id"), // nullable
  defaultSlotDurationMinutes: integer("default_slot_duration_minutes")
    .notNull()
    .default(30),
  cancellationWindowHours: integer("cancellation_window_hours")
    .notNull()
    .default(24),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// RELATIONS (Drizzle type-safe query helpers)
// ============================================================================

export const appointmentTypesRelations = relations(
  appointmentTypes,
  ({ many }) => ({
    appointments: many(appointments),
    weeklySchedules: many(weeklySchedule),
    waitlistEntries: many(waitlistEntries),
  }),
);

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  notifications: many(notificationLog),
}));

export const appointmentsRelations = relations(
  appointments,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [appointments.patientId],
      references: [patients.id],
    }),
    appointmentType: one(appointmentTypes, {
      fields: [appointments.appointmentTypeId],
      references: [appointmentTypes.id],
    }),
    notifications: many(notificationLog),
  }),
);

export const weeklyScheduleRelations = relations(
  weeklySchedule,
  ({ one }) => ({
    appointmentType: one(appointmentTypes, {
      fields: [weeklySchedule.appointmentTypeId],
      references: [appointmentTypes.id],
    }),
  }),
);

export const waitlistEntriesRelations = relations(
  waitlistEntries,
  ({ one }) => ({
    appointmentType: one(appointmentTypes, {
      fields: [waitlistEntries.appointmentTypeId],
      references: [appointmentTypes.id],
    }),
  }),
);

export const notificationLogRelations = relations(
  notificationLog,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [notificationLog.appointmentId],
      references: [appointments.id],
    }),
    patient: one(patients, {
      fields: [notificationLog.patientId],
      references: [patients.id],
    }),
  }),
);
```

---

## 7. Exclusion Constraint (Raw SQL Migration)

Drizzle does not natively support `EXCLUDE USING gist`. This must be applied via a custom SQL migration after the initial `drizzle-kit push` or `drizzle-kit generate` + `drizzle-kit migrate`.

```sql
-- drizzle/migrations/custom/0001_appointment_exclusion_constraint.sql

-- Step 1: Enable the btree_gist extension (required for combining
-- equality checks with range exclusion in a GiST index).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Add the exclusion constraint to prevent overlapping appointments.
-- Only non-cancelled appointments participate in the constraint.
-- This is the last line of defense: even if the application code has a race
-- condition (two concurrent bookings for the same slot), PostgreSQL rejects
-- the second INSERT.
ALTER TABLE appointments
  ADD CONSTRAINT no_overlapping_appointments
  EXCLUDE USING gist (
    tstzrange(start_time, end_time) WITH &&
  )
  WHERE (status != 'cancelled');
```

**Why this constraint matters**: It is the last line of defense against double-bookings. Even if application-level availability checks pass due to a race condition (two concurrent booking requests for the same slot), PostgreSQL will reject the second `INSERT`/`UPDATE` with a constraint violation error. The `WHERE (status != 'cancelled')` clause allows cancelled appointments to coexist with new bookings for the same time slot.

---

## 8. Additional CHECK Constraints (Raw SQL Migration)

```sql
-- drizzle/migrations/custom/0002_check_constraints.sql

-- Weekly schedule: day_of_week must be ISO 8601 (1=Monday .. 7=Sunday)
ALTER TABLE weekly_schedule
  ADD CONSTRAINT chk_day_of_week CHECK (day_of_week BETWEEN 1 AND 7);

-- Weekly schedule: start_time must be before end_time
ALTER TABLE weekly_schedule
  ADD CONSTRAINT chk_schedule_times CHECK (start_time < end_time);

-- Schedule overrides: start_date must be on or before end_date
ALTER TABLE schedule_overrides
  ADD CONSTRAINT chk_override_dates CHECK (start_date <= end_date);

-- Doctor settings: enforce singleton (only id=1 ever exists)
ALTER TABLE doctor_settings
  ADD CONSTRAINT chk_singleton CHECK (id = 1);

-- Waitlist: preferred_day_of_week must be ISO 8601 if provided
ALTER TABLE waitlist_entries
  ADD CONSTRAINT chk_waitlist_day_of_week
  CHECK (preferred_day_of_week IS NULL OR preferred_day_of_week BETWEEN 1 AND 7);
```

---

## 9. Custom SQL Migrations Summary

These must be applied after the initial Drizzle migration:

| Migration file                              | Purpose                                          |
| ------------------------------------------- | ------------------------------------------------ |
| `0001_appointment_exclusion_constraint.sql`  | `btree_gist` extension + `EXCLUDE USING gist`    |
| `0002_check_constraints.sql`                | All `CHECK` constraints across tables             |

Apply with:

```bash
# Option A: Push schema first, then apply custom SQL
npx drizzle-kit push
psql $DATABASE_URL -f drizzle/migrations/custom/0001_appointment_exclusion_constraint.sql
psql $DATABASE_URL -f drizzle/migrations/custom/0002_check_constraints.sql

# Option B: Generate migrations, edit the SQL, then migrate
npx drizzle-kit generate
# Append custom SQL to the generated migration file
npx drizzle-kit migrate
```

---

## 10. Index Summary

| Table              | Column(s)             | Type          | Rationale                                    |
| ------------------ | --------------------- | ------------- | -------------------------------------------- |
| `admin_users`      | `email`               | UNIQUE        | Login lookup (implicit from `.unique()`)      |
| `appointment_types`| `slug`                | UNIQUE        | URL routing (implicit from `.unique()`)       |
| `patients`         | `email`               | UNIQUE        | Dedup + lookup during booking                 |
| `patients`         | `last_name`           | B-tree        | Patient search by surname                     |
| `appointments`     | `start_time`          | B-tree        | Date range queries for calendar view          |
| `appointments`     | `status`              | B-tree        | Filter by status                              |
| `appointments`     | `cancellation_token`  | B-tree        | Token lookup for cancel-via-URL               |
| `appointments`     | `patient_id`          | B-tree        | Patient appointment history                   |
| `appointments`     | `tstzrange(start,end)`| GiST          | Overlap exclusion constraint (auto-created)   |

---

## 11. Entity-Relationship Diagram

```mermaid
erDiagram
    admin_users {
        serial id PK
        text email UK
        text name
        text password_hash
        admin_role role
        boolean is_active
        timestamptz created_at
    }

    appointment_types {
        serial id PK
        text name
        text slug UK
        integer duration_minutes
        text color
        integer sort_order
        boolean is_active
        timestamptz created_at
    }

    patients {
        uuid id PK
        text first_name
        text last_name
        text email UK
        text phone
        date date_of_birth
        text notes
        date imported_last_appointment
        timestamptz created_at
    }

    appointments {
        uuid id PK
        uuid patient_id FK
        integer appointment_type_id FK
        timestamptz start_time
        timestamptz end_time
        appointment_status status
        text google_event_id
        text cancellation_token UK
        timestamptz cancellation_token_expires_at
        timestamptz cancelled_at
        text notes
        timestamptz reminder_sent_at
        timestamptz created_at
    }

    weekly_schedule {
        serial id PK
        integer appointment_type_id FK
        integer day_of_week
        time start_time
        time end_time
        boolean is_active
    }

    schedule_overrides {
        serial id PK
        date start_date
        date end_date
        boolean is_closed
        time start_time
        time end_time
        integer slot_duration_minutes
        text reason
    }

    waitlist_entries {
        uuid id PK
        text patient_email
        text patient_name
        text patient_phone
        integer appointment_type_id FK
        integer preferred_day_of_week
        time preferred_time_start
        time preferred_time_end
        date preferred_date_from
        date preferred_date_to
        waitlist_status status
        timestamptz notified_at
        timestamptz created_at
    }

    message_templates {
        serial id PK
        template_event event
        recipient_type recipient_type
        text subject
        text body
        boolean is_active
        timestamptz updated_at
    }

    notification_log {
        serial id PK
        uuid appointment_id FK
        uuid patient_id FK
        text template_event
        text recipient_email
        text subject
        timestamptz sent_at
        notification_status status
        text error_message
    }

    doctor_settings {
        serial id PK
        text clinic_name
        text doctor_name
        text doctor_email
        text phone
        text address
        text google_calendar_id
        integer default_slot_duration_minutes
        integer cancellation_window_hours
        timestamptz updated_at
    }

    patients ||--o{ appointments : "has"
    appointment_types ||--o{ appointments : "categorizes"
    appointment_types ||--o{ weekly_schedule : "has schedule"
    appointment_types ||--o{ waitlist_entries : "requested for"
    appointments ||--o{ notification_log : "triggers"
    patients ||--o{ notification_log : "receives"
```

---

## 12. Seed Data

### 12.1 Seed Script

```ts
// src/db/seed.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // ──────────────────────────────────────────────
  // 1. Doctor Settings (singleton, id=1)
  // ──────────────────────────────────────────────
  await db.insert(schema.doctorSettings).values({
    clinicName: "Dr. Morocz Angela Nogyogyaszati Rendelo",
    doctorName: "Dr. Morocz Angela",
    doctorEmail: "rendelo@moroczangela.hu",
    phone: "+36301234567",
    address: "1234 Budapest, Pelda utca 1.",
    googleCalendarId: null,
    defaultSlotDurationMinutes: 30,
    cancellationWindowHours: 24,
  });
  console.log("  Doctor settings created.");

  // ──────────────────────────────────────────────
  // 2. Appointment Types
  // ──────────────────────────────────────────────
  await db.insert(schema.appointmentTypes).values([
    {
      name: "Varandosgondozas",
      slug: "varandosgondozas",
      durationMinutes: 45,
      color: "#EC4899", // pink-500
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Nogyogyaszat",
      slug: "nogyogyaszat",
      durationMinutes: 30,
      color: "#8B5CF6", // violet-500
      sortOrder: 2,
      isActive: true,
    },
  ]);
  console.log("  Appointment types created.");

  // ──────────────────────────────────────────────
  // 3. Default Weekly Schedule (Mon-Fri 08:00-16:00)
  // ──────────────────────────────────────────────
  const weekdays = [1, 2, 3, 4, 5]; // Monday through Friday
  await db.insert(schema.weeklySchedule).values(
    weekdays.map((day) => ({
      appointmentTypeId: null, // global schedule, applies to all types
      dayOfWeek: day,
      startTime: "08:00",
      endTime: "16:00",
      isActive: true,
    })),
  );
  console.log("  Weekly schedule created (Mon-Fri 08:00-16:00).");

  // ──────────────────────────────────────────────
  // 4. Default Message Templates (Hungarian)
  // ──────────────────────────────────────────────
  await db.insert(schema.messageTemplates).values([
    // --- appointment_created ---
    {
      event: "appointment_created",
      recipientType: "patient",
      subject: "Idopontfoglalas visszaigazolas - $appointmentType",
      body: `Kedves $patientName!

Koszonjuk, hogy idopontot foglalt rendelonkben.

Idopont reszletei:
- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime
- Helyszin: $clinicAddress

Amennyiben le szeretne mondani az idopontot, kerjuk kattintson az alabbi linkre:
$cancellationLink

Kerdes eseten keresse munkatarsainkat a $clinicPhone telefonszamon.

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },
    {
      event: "appointment_created",
      recipientType: "doctor",
      subject: "Uj idopontfoglalas: $patientName - $appointmentType",
      body: `Uj idopontfoglalas erkezett.

Paciens: $patientName
Tipus: $appointmentType
Datum: $appointmentDate
Idopont: $appointmentTime`,
      isActive: true,
    },

    // --- reminder_24h ---
    {
      event: "reminder_24h",
      recipientType: "patient",
      subject: "Emlekezeto: holnapi idopontja - $appointmentType",
      body: `Kedves $patientName!

Emlekeztetjuk, hogy holnap idopontja van rendelonkben.

Idopont reszletei:
- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime
- Helyszin: $clinicAddress

Amennyiben le szeretne mondani az idopontot, kerjuk kattintson az alabbi linkre:
$cancellationLink

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },

    // --- cancelled_by_patient ---
    {
      event: "cancelled_by_patient",
      recipientType: "patient",
      subject: "Idopont lemondva - $appointmentType",
      body: `Kedves $patientName!

Az alabbi idopontjat sikeresen lemondtuk:

- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime

Ha uj idopontot szeretne foglalni, kerjuk latogasson el weboldalunkra.

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },
    {
      event: "cancelled_by_patient",
      recipientType: "doctor",
      subject: "Idopont lemondva: $patientName - $appointmentType",
      body: `Idopont lemondva a paciens altal.

Paciens: $patientName
Tipus: $appointmentType
Datum: $appointmentDate
Idopont: $appointmentTime`,
      isActive: true,
    },

    // --- cancelled_by_doctor ---
    {
      event: "cancelled_by_doctor",
      recipientType: "patient",
      subject: "Idopont valtozas - $appointmentType",
      body: `Kedves $patientName!

Sajnalattal ertesitjuk, hogy az alabbi idopontjat le kellett mondanunk:

- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime

Kerjuk, foglaljon uj idopontot weboldalunkon, vagy hivjon minket a $clinicPhone telefonszamon.

Elnezest kerunk az esetleges kellemetlensegert.

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },

    // --- status_changed ---
    {
      event: "status_changed",
      recipientType: "patient",
      subject: "Idopont allapot valtozas - $appointmentType",
      body: `Kedves $patientName!

Az alabbi idopontjaval kapcsolatban valtozas tortent:

- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime

Kerdes eseten keresse munkatarsainkat a $clinicPhone telefonszamon.

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },

    // --- waitlist_slot_available ---
    {
      event: "waitlist_slot_available",
      recipientType: "patient",
      subject: "Szabad idopont elerheto - $appointmentType",
      body: `Kedves $patientName!

Orulunk, hogy ertesithetjuk: egy Onnek megfelelo idopont felszabadult!

- Tipus: $appointmentType
- Datum: $appointmentDate
- Idopont: $appointmentTime

Kerjuk, foglaljon mihamarabb, mert az idopontot nem tudjuk garantalni.

Udvozlettel,
$doctorName
$clinicName`,
      isActive: true,
    },
  ]);
  console.log("  Message templates created.");

  console.log("Seeding complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

### 12.2 Available Template Variables

These `$variable` placeholders are available in message template `subject` and `body` fields:

| Variable             | Description                                       |
| -------------------- | ------------------------------------------------- |
| `$patientName`       | Patient's full name (firstName + lastName)         |
| `$appointmentDate`   | Formatted date, e.g. "2026. februar 25."           |
| `$appointmentTime`   | Formatted time, e.g. "14:30"                       |
| `$appointmentType`   | Appointment type name, e.g. "Nogyogyaszat"         |
| `$doctorName`        | From doctor_settings                               |
| `$clinicName`        | From doctor_settings                               |
| `$clinicPhone`       | From doctor_settings                               |
| `$clinicAddress`     | From doctor_settings                               |
| `$cancellationLink`  | Full URL with cancellation token                   |

---

## 13. CSV Import Strategy (2,320 existing patients)

The CSV has columns: `firstName`, `lastName`, `email`, `phone`, `lastAppointment`.

Import plan:
1. Parse CSV, validate emails, normalize phone to E.164 (`+36...`).
2. Upsert into `patients` table using `ON CONFLICT (email) DO UPDATE` to handle duplicates.
3. Store `lastAppointment` date in the `importedLastAppointment` column.

```ts
// scripts/import-patients.ts
import { db } from "@/db";
import { patients } from "@/db/schema";
import { sql } from "drizzle-orm";

interface CsvRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lastAppointment?: string;
}

async function importPatients(rows: CsvRow[]) {
  for (const row of rows) {
    await db
      .insert(patients)
      .values({
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.trim().toLowerCase(),
        phone: normalizePhone(row.phone),
        importedLastAppointment: row.lastAppointment || null,
      })
      .onConflictDoUpdate({
        target: patients.email,
        set: {
          phone: sql`COALESCE(EXCLUDED.phone, ${patients.phone})`,
          importedLastAppointment: sql`COALESCE(EXCLUDED.imported_last_appointment, ${patients.importedLastAppointment})`,
        },
      });
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("36")) return `+${digits}`;
  if (digits.startsWith("06")) return `+36${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+36${digits.slice(1)}`;
  return `+36${digits}`;
}
```

---

## 14. GDPR Considerations

- **Patients table**: Contains PII. Must support right-to-erasure. Implementation: anonymize (replace name/email/phone with `[DELETED]`) rather than hard-delete, to preserve appointment history integrity.
- **Notification log**: Retains `recipientEmail` for audit trail. After anonymization, these become orphaned but still show delivery status.
- **Cancellation tokens**: Expire after the appointment time passes. Scheduled cleanup job should null out expired tokens.
- **Admin passwords**: Stored as bcrypt/argon2 hashes. Never logged, never returned in API responses.

---

## 15. Deployment Checklist

```
1. Create Neon project in Frankfurt (eu-central-1)
2. Copy DATABASE_URL to .env.local
3. npm install drizzle-orm @neondatabase/serverless
4. npm install -D drizzle-kit
5. npx drizzle-kit push                         # create all tables
6. Apply custom SQL migrations:
   psql $DATABASE_URL -f drizzle/migrations/custom/0001_appointment_exclusion_constraint.sql
   psql $DATABASE_URL -f drizzle/migrations/custom/0002_check_constraints.sql
7. npx tsx src/db/seed.ts                        # seed initial data
8. Verify in Neon console: 10 tables, all enums, exclusion constraint
```

---

## 16. package.json Scripts (to add)

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```
