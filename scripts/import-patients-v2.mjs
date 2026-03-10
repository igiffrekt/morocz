/**
 * Mórocz Medical — Páciens TÖRLÉS + Újraimport
 *
 * CSV formátum (Tom leírása szerint):
 *   A: vezetéknév (family name)
 *   B: keresztnév (first name)
 *   C: email
 *   D: telefonszám (+36... prefix nélkül → +36... lesz)
 *   E: utolsó látogatás (M/D/YYYY → tárolva YYYY-MM-DD, admin: YYYY.MM.DD)
 *   F: születési dátum (nem importáljuk)
 *   G: megjegyzés (notes mezőbe)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Sanity config ────────────────────────────────────────────────────────────
const sanityClient = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token:
    "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

// ─── Test entry szűrő ─────────────────────────────────────────────────────────
const TEST_EMAILS = new Set([
  "stickerey@gmail.com",
  "d3secondary@gmail.com",
  "aihmasir3n@gmail.com",
  "booknetic.test@gmail.com",
  "musahesenli02@gmail.com",
  "testbooknetic@yopmail.com",
]);

function isTestEntry(colA, colB, email) {
  const em = email.toLowerCase();
  if (TEST_EMAILS.has(em)) return true;
  if (em.includes("@yopmail.") || em.includes("test@")) return true;
  const combined = `${colA} ${colB}`.toLowerCase().trim();
  if (combined.includes("test") && combined.includes("test")) return true;
  if (combined === "aihma siren") return true;
  return false;
}

// ─── Telefonszám formázás ─────────────────────────────────────────────────────
function formatPhone(raw) {
  if (!raw || raw.trim() === "-" || raw.trim() === "") return null;
  let s = raw.trim();

  // Excel scientific notation (pl. 3.6302E+10)
  if (/^\d+\.?\d*[Ee][+-]?\d+$/i.test(s)) {
    try {
      const num = Number(s);
      if (!Number.isNaN(num) && num < 1e15) {
        s = Math.round(num).toString();
      } else {
        return s; // korrumpált, eredeti
      }
    } catch {
      return s;
    }
  }

  // Szóközök, kötőjelek eltávolítása
  s = s.replace(/[\s\-()]/g, "");
  // Vezető + eltávolítása (majd visszatesszük)
  s = s.replace(/^\+/, "");

  if (!s || s.length < 5) return null;

  return `+${s}`;
}

// ─── Dátum formázás ───────────────────────────────────────────────────────────
// Bemenet: M/D/YYYY → Kimenet: YYYY-MM-DD (Sanity date mező)
// Az adminban YYYY.MM.DD-ként lesz megjelenítve
function formatDate(raw) {
  if (!raw || raw.trim() === "-" || raw.trim() === "") return null;
  const parts = raw.trim().split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  if (!y || y.length !== 4) return null;
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

// ─── CSV sor parse (quoted fields támogatással) ───────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Step 1: Összes meglévő páciens törlése ───────────────────────────────────
async function deleteAllPatients() {
  console.log("\n🗑️  Meglévő páciensek törlése Sanity-ból...");
  let totalDeleted = 0;

  // Batch-enként töröl, amíg nincs több
  while (true) {
    const ids = await sanityClient.fetch(`*[_type == "patient"][0...100]._id`);
    if (!ids || ids.length === 0) break;

    const tx = sanityClient.transaction();
    for (const id of ids) {
      tx.delete(id);
    }
    await tx.commit();
    totalDeleted += ids.length;
    process.stdout.write(`\r  Törölve: ${totalDeleted} db`);
  }

  console.log(`\n✅ Összes páciens törölve (${totalDeleted} db)`);
  return totalDeleted;
}

// ─── Step 2: CSV feldolgozás ──────────────────────────────────────────────────
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  const patients = [];
  let skippedHeader = false;
  let skippedTest = 0;
  let skippedEmpty = 0;

  for (const line of lines) {
    if (!skippedHeader) {
      skippedHeader = true; // első sor = fejléc
      continue;
    }

    const cols = parseCSVLine(line);
    if (cols.length < 3) continue;

    const colA = (cols[0] || "").trim(); // vezetéknév
    const colB = (cols[1] || "").trim(); // keresztnév
    const email = (cols[2] || "").trim().toLowerCase();
    const phoneRaw = (cols[3] || "").trim();
    const lastApptRaw = (cols[4] || "").trim();
    // cols[5] = születési dátum (kihagyjuk)
    const noteRaw = (cols[6] || "").trim();

    // Üres sorok kizárása
    if (!colA && !colB && !email) {
      skippedEmpty++;
      continue;
    }

    // Teszt bejegyzések kizárása
    if (isTestEntry(colA, colB, email)) {
      skippedTest++;
      continue;
    }

    // Teljes név: "Kató-Szabó Emese"
    const name = `${colA} ${colB}`.replace(/\s+/g, " ").trim();

    patients.push({
      name,
      email: email || null,
      phone: formatPhone(phoneRaw),
      lastVisitDate: formatDate(lastApptRaw),
      notes: noteRaw && noteRaw !== "-" ? noteRaw : null,
    });
  }

  console.log(
    `\n📋 CSV feldolgozva: ${patients.length} páciens, ${skippedTest} teszt kizárva, ${skippedEmpty} üres sor`,
  );
  return patients;
}

// ─── Step 3: Deduplikálás email alapján ───────────────────────────────────────
function deduplicate(patients) {
  const seen = new Map();
  const deduped = [];
  let dupes = 0;

  for (const p of patients) {
    // Ha nincs email, névvel deduplikál
    const key = p.email || `nomail:${p.name.toLowerCase()}`;
    if (seen.has(key)) {
      dupes++;
      // Ha az újabb bejegyzésnek van lastVisitDate és a régi nem, frissítjük
      const existing = seen.get(key);
      if (p.lastVisitDate && !existing.lastVisitDate) {
        existing.lastVisitDate = p.lastVisitDate;
      }
      continue;
    }
    seen.set(key, p);
    deduped.push(p);
  }

  console.log(`🔄 Deduplikálás: ${deduped.length} egyedi páciens, ${dupes} duplikátum kizárva`);
  return deduped;
}

// ─── Step 4: Sanity import ────────────────────────────────────────────────────
async function importPatients(patients) {
  const BATCH_SIZE = 50;
  let imported = 0;
  const now = new Date().toISOString();

  console.log(
    `\n📤 Import indul: ${patients.length} páciens, ${Math.ceil(patients.length / BATCH_SIZE)} batch...\n`,
  );

  for (let i = 0; i < patients.length; i += BATCH_SIZE) {
    const batch = patients.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(patients.length / BATCH_SIZE);

    const tx = sanityClient.transaction();

    for (const p of batch) {
      const doc = {
        _type: "patient",
        name: p.name,
        source: "imported",
        importedAt: now,
      };
      if (p.email) doc.email = p.email;
      if (p.phone) doc.phone = p.phone;
      if (p.lastVisitDate) doc.lastVisitDate = p.lastVisitDate;
      if (p.notes) doc.notes = p.notes;

      tx.create(doc);
    }

    await tx.commit();
    imported += batch.length;
    console.log(`  Batch ${batchNum}/${totalBatches} — ${batch.length} doc elmentve ✅`);
  }

  console.log(`\n✅ Import kész: ${imported} páciens a Sanity-ban`);
  return imported;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const csvPath = path.join(__dirname, "..", "patients-new.csv");

if (!fs.existsSync(csvPath)) {
  console.error(`❌ CSV nem található: ${csvPath}`);
  process.exit(1);
}

async function main() {
  console.log("🏥 Mórocz Medical — Páciens újraimport (v2)");
  console.log("=".repeat(50));

  // 1. Töröl
  await deleteAllPatients();

  // 2. CSV parse
  const patients = parseCSV(csvPath);

  // 3. Deduplikál
  const deduped = deduplicate(patients);

  // 4. Import
  await importPatients(deduped);

  console.log("\n🎉 Minden kész!");
  console.log(
    `\nEllenőrzés: https://www.sanity.io/manage → project l5qdfoyx → Vision → *[_type == "patient"] | count`,
  );
}

main().catch((err) => {
  console.error("❌ Hiba:", err.message);
  process.exit(1);
});
