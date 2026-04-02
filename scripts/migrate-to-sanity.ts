import { createClient } from "@sanity/client";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;
const SANITY_PROJECT_ID = "l5qdfoyx";
const SANITY_DATASET = "production";
const SANITY_TOKEN = process.env.SANITY_API_TOKEN!;

const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

function formatDateForSanity(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Fetch all imported customers from Postgres (those with firstName/lastName set)
  const result = await pool.query(`
    SELECT
      id,
      email,
      first_name,
      last_name,
      phone_number,
      last_appointment,
      role
    FROM "user"
    WHERE first_name IS NOT NULL OR last_name IS NOT NULL
  `);

  console.log(`Found ${result.rows.length} customers to migrate to Sanity`);

  // Check existing patients in Sanity
  const existingPatients = await sanityClient.fetch<{ email: string }[]>(
    `*[_type == "patient"]{ email }`
  );
  const existingEmails = new Set(
    existingPatients.map((p) => p.email?.toLowerCase().trim()).filter(Boolean)
  );
  console.log(`Found ${existingEmails.size} existing patients in Sanity`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Batch create in Sanity (max 100 per transaction)
  const BATCH_SIZE = 100;
  const batches: any[][] = [];
  let currentBatch: any[] = [];

  for (const row of result.rows) {
    const email = row.email?.toLowerCase().trim();
    if (!email) {
      skipped++;
      continue;
    }

    if (existingEmails.has(email)) {
      console.log(`Skipping existing: ${email}`);
      skipped++;
      continue;
    }

    const name = `${row.first_name || ""} ${row.last_name || ""}`.trim();
    const lastVisitDate = formatDateForSanity(row.last_appointment);

    currentBatch.push({
      create: {
        _type: "patient",
        _id: `patient-${row.id}`,
        name,
        email,
        phone: row.phone_number || undefined,
        lastVisitDate: lastVisitDate || undefined,
        source: "imported",
        latogatas: 0,
      },
    });

    if (currentBatch.length >= BATCH_SIZE) {
      batches.push(currentBatch);
      currentBatch = [];
    }
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  console.log(`Processing ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const transaction = sanityClient.transaction();
      for (const op of batch) {
        transaction.create(op.create);
      }
      await transaction.commit();
      created += batch.length;
      console.log(`Batch ${i + 1}/${batches.length}: created ${batch.length} patients`);
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
            console.error(`Failed to create ${op.create.email}:`, e.message);
            errors++;
          }
        }
      }
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);

  // Now clean up Postgres - remove imported customer fields (set to null)
  // We keep the user records for auth purposes but clear the customer-specific data
  console.log(`\nCleaning up Postgres...`);

  const cleanup = await pool.query(`
    UPDATE "user"
    SET
      first_name = NULL,
      last_name = NULL,
      last_appointment = NULL
    WHERE first_name IS NOT NULL OR last_name IS NOT NULL
  `);

  console.log(`Cleared customer fields from ${cleanup.rowCount} Postgres records`);

  await pool.end();
}

main().catch(console.error);
