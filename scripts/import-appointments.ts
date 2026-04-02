import { createClient } from "@sanity/client";
import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";

const SANITY_PROJECT_ID = "l5qdfoyx";
const SANITY_DATASET = "production";
const SANITY_TOKEN = process.env.SANITY_API_TOKEN || "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY";

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

// Map CSV service names to existing Sanity service IDs
const SERVICE_MAP: Record<string, string> = {
  "Nőgyógyászat": "PBvMc4A176yy1xKAL63JGv", // Nőgyógyászati vizsgálat ultrahanggal
  "Méhnyakszűrés-komplex vizsgálat": "PBvMc4A176yy1xKAL63LDb", // Komplex Szűrőcsomag
  "Várandósgondozás": "ylE3b8M0xWxRmlYLvBPcsX", // Várandósgondozás (exact)
  "Vérvétel": "service-vervetel-hidden", // Hidden service for historical data
};

interface CsvRow {
  ID: string;
  "START DATE": string;
  Customer: string;
  "Service Extras": string;
  "Customer Email": string;
  "Customer Phone Number": string;
  STAFF: string;
  SERVICE: string;
  PAYMENT: string;
  DURATION: string;
  "CREATED AT": string;
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  if (!trimmed) return { firstName: "", lastName: "" };

  const parts = trimmed.split(" ");

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  if (parts[0].includes("-")) {
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

function formatPhone(phone: string): string {
  if (!phone) return "";
  let phoneStr = phone.replace(/[^\d+]/g, "");
  if (!phoneStr.startsWith("+")) {
    phoneStr = "+" + phoneStr;
  }
  return phoneStr;
}

function parseDateTime(dateTimeStr: string): { date: string; time: string } | null {
  // Format: "2022-11-12 12:00"
  const parts = dateTimeStr.split(" ");
  if (parts.length !== 2) return null;
  return { date: parts[0], time: parts[1] };
}

function parseDuration(durationStr: string): number {
  // Format: "20m" or "30m"
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 20;
}

function generateReservationNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-appointments.ts <csv-file>");
    process.exit(1);
  }

  const csvContent = readFileSync(csvPath, "utf-8");
  const cleanContent = csvContent.replace(/^\uFEFF/, "");

  const records: CsvRow[] = parse(cleanContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} appointments to import`);

  // Get existing bookings to avoid duplicates
  const existingBookings = await sanityClient.fetch<{ patientEmail: string; slotDate: string; slotTime: string }[]>(
    `*[_type == "booking"]{ patientEmail, slotDate, slotTime }`
  );
  const existingSet = new Set(
    existingBookings.map((b) => `${b.patientEmail?.toLowerCase()}-${b.slotDate}-${b.slotTime}`)
  );
  console.log(`Found ${existingSet.size} existing bookings in Sanity`);

  // Get existing patients for linking
  const existingPatients = await sanityClient.fetch<{ _id: string; email: string }[]>(
    `*[_type == "patient"]{ _id, email }`
  );
  const patientByEmail = new Map<string, string>();
  for (const p of existingPatients) {
    if (p.email) {
      patientByEmail.set(p.email.toLowerCase().trim(), p._id);
    }
  }
  console.log(`Found ${patientByEmail.size} patients for linking`);

  let created = 0;
  let skipped = 0;
  let noService = 0;
  let errors = 0;

  const BATCH_SIZE = 100;
  const batches: any[][] = [];
  let currentBatch: any[] = [];

  for (const row of records) {
    const serviceName = row.SERVICE?.trim();
    const serviceId = SERVICE_MAP[serviceName];

    if (!serviceId) {
      if (serviceName && serviceName !== "SERVICE" && serviceName !== "Angéla Mórocz") {
        console.log(`Skipping: no service mapping for "${serviceName}"`);
      }
      noService++;
      continue;
    }

    const email = row["Customer Email"]?.toLowerCase().trim();
    if (!email) {
      skipped++;
      continue;
    }

    const dateTime = parseDateTime(row["START DATE"]);
    if (!dateTime) {
      skipped++;
      continue;
    }

    // Check for duplicates
    const key = `${email}-${dateTime.date}-${dateTime.time}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }
    existingSet.add(key); // Prevent duplicates within this import

    const { firstName, lastName } = parseName(row.Customer || "");
    const name = `${firstName} ${lastName}`.trim();
    const phone = formatPhone(row["Customer Phone Number"] || "");
    const duration = parseDuration(row.DURATION || "20m");

    const booking = {
      _type: "booking",
      _id: `booking-imported-${row.ID}`,
      patientName: name,
      patientEmail: email,
      patientPhone: phone,
      service: { _type: "reference", _ref: serviceId },
      slotDate: dateTime.date,
      slotTime: dateTime.time,
      status: "confirmed", // Historical bookings are confirmed
      reservationNumber: generateReservationNumber(),
      managementToken: randomUUID(),
      createdAt: row["CREATED AT"] ? new Date(row["CREATED AT"]).toISOString() : new Date().toISOString(),
    };

    currentBatch.push({ create: booking });

    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`\nProcessing ${batches.length} batches...`);
  console.log(`Skipped ${noService} appointments with unmapped services (Vérvétel, etc.)`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const transaction = sanityClient.transaction();
      for (const op of batch) {
        transaction.create(op.create);
      }
      await transaction.commit();
      created += batch.length;
      console.log(`Batch ${i + 1}/${batches.length}: created ${batch.length} bookings`);
    } catch (err: any) {
      console.error(`Batch ${i + 1} failed:`, err.message);
      // Try one by one
      for (const op of batch) {
        try {
          await sanityClient.create(op.create);
          created++;
        } catch (e: any) {
          if (e.message?.includes("already exists")) {
            skipped++;
          } else {
            console.error(`Failed to create booking for ${op.create.patientEmail}:`, e.message);
            errors++;
          }
        }
      }
    }
  }

  console.log(`\nImport complete!`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (duplicates/no email): ${skipped}`);
  console.log(`No service mapping: ${noService}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
