/**
 * Mórocz Medical — Páciens CSV Import Script
 * Futtatás: node scripts/import-patients.mjs
 *
 * Importálja a legacy pácienslistát a Sanity CMS-be (patient type).
 * Duplikátumokat email alapján kizárja (első bejegyzés nyer).
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Sanity config ──────────────────────────────────────────────────────────
const sanityClient = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token:
    "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse M/D/YYYY or MM/DD/YYYY → YYYY-MM-DD
 * Returns null if invalid or "-"
 */
function parseDate(raw) {
  if (!raw || raw.trim() === "-" || raw.trim() === "") return null;
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  if (!y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Clean phone number:
 * - Scientific notation (Excel artifact): try to convert back
 * - Remove spaces, dashes, parens
 * - Strip leading +
 */
function cleanPhone(raw) {
  if (!raw || raw.trim() === "-" || raw.trim() === "") return "";
  let s = raw.trim();

  // Handle scientific notation strings like "3.58403E+11"
  if (/^\d+\.?\d*[Ee][+-]?\d+$/.test(s)) {
    try {
      const num = Number(s);
      if (!Number.isNaN(num) && num < 1e14) {
        s = Math.round(num).toString();
      } else {
        // Too large, likely corrupted — store as-is
        return s;
      }
    } catch {
      return s;
    }
  }

  // Remove common formatting chars (spaces, dashes, parens)
  s = s.replace(/[\s\-()]/g, "");

  // Remove leading +
  if (s.startsWith("+")) s = s.slice(1);

  return s;
}

/**
 * Generate a stable Sanity document ID from patient name + email.
 * Must be: [a-z0-9][a-z0-9._-]{0,63}
 */
function makeDocId(name, email) {
  const base = `patient-${email || name}`
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);
  return base.startsWith("-") ? `p${base}` : base;
}

/**
 * Test entries to skip (bots, test accounts, duplicates of admin)
 */
const SKIP_EMAILS = new Set([
  "testbooknetic@yopmail.com",
  "booknetic.test@gmail.com",
  "musahesenli02@gmail.com",
]);

function isTestEntry(name, email) {
  const n = name.toLowerCase();
  if (n.startsWith("test") || n.startsWith("teszt") || n.startsWith("aihma")) return true;
  if (SKIP_EMAILS.has(email?.toLowerCase())) return true;
  return false;
}

// ─── Parse CSV ───────────────────────────────────────────────────────────────

async function parseCsv(filePath) {
  const patients = [];
  const seenEmails = new Set();
  const seenDocIds = new Set();

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, "utf8"),
    crlfDelay: Infinity,
  });

  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // skip header

    // Simple CSV split (no quoted commas in this file)
    const cols = line.split(",");
    if (cols.length < 3) continue;

    // columns: Category(0), Full name(1), Email(2), PHONE(3), LAST APPOINTMENT(4), DOB(5), Note(6)
    const name = (cols[1] ?? "").trim();
    const email = (cols[2] ?? "").trim().toLowerCase();
    const phone = cleanPhone(cols[3] ?? "");
    const lastVisitRaw = cols[4] ?? "";
    const lastVisitDate = parseDate(lastVisitRaw);

    if (!name || name === "-") continue;
    if (isTestEntry(name, email)) {
      console.log(`  ⏭  Skip test entry: ${name} <${email}>`);
      continue;
    }

    // Deduplicate by email (first occurrence wins)
    if (email && seenEmails.has(email)) {
      console.log(`  ⏭  Duplicate email, skipping: ${name} <${email}>`);
      continue;
    }
    if (email) seenEmails.add(email);

    const docId = makeDocId(name, email);
    // Handle doc ID collision (different people with very similar names/emails)
    let finalDocId = docId;
    let suffix = 2;
    while (seenDocIds.has(finalDocId)) {
      finalDocId = `${docId}-${suffix++}`;
    }
    seenDocIds.add(finalDocId);

    patients.push({
      _id: finalDocId,
      _type: "patient",
      name,
      email: email || undefined,
      phone: phone || undefined,
      lastVisitDate: lastVisitDate || undefined,
      source: "imported",
      importedAt: new Date().toISOString(),
    });
  }

  return patients;
}

// ─── Import in batches ───────────────────────────────────────────────────────

async function importPatients(patients) {
  const BATCH_SIZE = 50;
  let created = 0;
  let updated = 0;
  let errors = 0;

  console.log(`\n📤 Importing ${patients.length} patients to Sanity...\n`);

  for (let i = 0; i < patients.length; i += BATCH_SIZE) {
    const batch = patients.slice(i, i + BATCH_SIZE);
    const tx = sanityClient.transaction();

    for (const p of batch) {
      // createOrReplace = upsert: creates if not exists, replaces if exists
      tx.createOrReplace(p);
    }

    try {
      const result = await tx.commit();
      const batchCreated = result.results?.filter((r) => r.operation === "create").length ?? 0;
      const batchUpdated = result.results?.filter((r) => r.operation === "update").length ?? 0;
      created += batchCreated;
      updated += batchUpdated;
      console.log(
        `  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(patients.length / BATCH_SIZE)} — ${batch.length} docs committed`,
      );
    } catch (err) {
      errors += batch.length;
      console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err.message);
    }

    // Small delay between batches to be polite to the API
    if (i + BATCH_SIZE < patients.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { created, updated, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(__dirname, "..", "patients.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    console.error("   Place the CSV as patients.csv in the project root.");
    process.exit(1);
  }

  console.log(`\n📂 Parsing CSV: ${csvPath}`);
  const patients = await parseCsv(csvPath);
  console.log(`\n✅ Parsed ${patients.length} unique patients (test entries excluded)\n`);

  if (patients.length === 0) {
    console.log("Nothing to import. Exiting.");
    return;
  }

  const { errors } = await importPatients(patients);

  console.log("\n─────────────────────────────────────");
  console.log(`✅ Import complete!`);
  console.log(`   Total patients processed: ${patients.length}`);
  if (errors > 0) console.log(`   ⚠️  Errors: ${errors}`);
  console.log("─────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
