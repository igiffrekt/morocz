/**
 * Seed script: populates Sanity with ServiceCategory, Service, and LabTest documents
 * for Phase 4 visual verification.
 *
 * Run with: node scripts/seed-phase4.mjs
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token:
    "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

// ─── Service Categories ────────────────────────────────────────────────────────

const categories = [
  {
    _id: "seed-cat-belgyogyaszat",
    _type: "serviceCategory",
    name: "Belgyógyászat",
    emoji: "🏥",
    order: 1,
  },
  {
    _id: "seed-cat-laborvizsgalat",
    _type: "serviceCategory",
    name: "Laborvizsgálat",
    emoji: "🔬",
    order: 2,
  },
  {
    _id: "seed-cat-megelozes",
    _type: "serviceCategory",
    name: "Megelőzés és szűrés",
    emoji: "🩺",
    order: 3,
  },
];

// ─── Services ──────────────────────────────────────────────────────────────────

const services = [
  // Belgyógyászat
  {
    _id: "seed-svc-altalanos",
    _type: "service",
    name: "Általános belgyógyászati vizsgálat",
    description:
      "Átfogó belgyógyászati szűrés és diagnózis, anamnézissel és fizikális vizsgálattal.",
    category: { _type: "reference", _ref: "seed-cat-belgyogyaszat" },
    order: 1,
  },
  {
    _id: "seed-svc-kardiologia",
    _type: "service",
    name: "Kardiológiai vizsgálat",
    description: "EKG, vérnyomásmérés és szívultrahang. Szívbetegségek korai felismerése.",
    category: { _type: "reference", _ref: "seed-cat-belgyogyaszat" },
    order: 2,
  },
  {
    _id: "seed-svc-cukorbetegseg",
    _type: "service",
    name: "Cukorbetegség gondozás",
    description: "Vércukorszint követés, HbA1c mérés, diétás tanácsadás és terápia beállítás.",
    category: { _type: "reference", _ref: "seed-cat-belgyogyaszat" },
    order: 3,
  },
  // Laborvizsgálat
  {
    _id: "seed-svc-veresvizeletes",
    _type: "service",
    name: "Véres és vizeletvizsgálat",
    description: "Teljes vérképelemzés, vizeletvizsgálat 24 órán belüli eredménnyel.",
    category: { _type: "reference", _ref: "seed-cat-laborvizsgalat" },
    order: 4,
  },
  {
    _id: "seed-svc-hormonvizsgalat",
    _type: "service",
    name: "Hormonvizsgálat",
    description: "Pajzsmirigy, mellékvese és nemi hormonok szintjének meghatározása.",
    category: { _type: "reference", _ref: "seed-cat-laborvizsgalat" },
    order: 5,
  },
  // Megelőzés és szűrés
  {
    _id: "seed-svc-szurovizsgalat",
    _type: "service",
    name: "Komplex szűrővizsgálat",
    description: "Teljes körű preventív csomag: vér-, vizelet-, EKG- és ultrahangvizsgálat.",
    category: { _type: "reference", _ref: "seed-cat-megelozes" },
    order: 6,
  },
  {
    _id: "seed-svc-tanacsadas",
    _type: "service",
    name: "Életmód-tanácsadás",
    description:
      "Személyre szabott diétás és mozgásprogram, egészséges életmódra való felkészítés.",
    category: { _type: "reference", _ref: "seed-cat-megelozes" },
    order: 7,
  },
];

// ─── Lab Tests ─────────────────────────────────────────────────────────────────

const labTests = [
  {
    _id: "seed-lab-teljes-verkep",
    _type: "labTest",
    name: "Teljes vérkép",
    description: "Vörösvérsejt, fehérvérsejt és vérlemezkék részletes elemzése.",
    price: 4500,
    order: 1,
  },
  {
    _id: "seed-lab-cholesterol",
    _type: "labTest",
    name: "Koleszterin panel",
    description: "LDL, HDL, triglicerid és össz-koleszterin meghatározása éhgyomri mintából.",
    price: 7500,
    order: 2,
  },
  {
    _id: "seed-lab-pajzsmirigy",
    _type: "labTest",
    name: "Pajzsmirigy funkció (TSH, T3, T4)",
    description: "Pajzsmirigy alul- vagy túlműködés kiszűrése hormonszint mérésével.",
    price: 12000,
    order: 3,
  },
  {
    _id: "seed-lab-vercukor",
    _type: "labTest",
    name: "Vércukor (éhomi + HbA1c)",
    description: "Cukorbetegség szűrése és a hosszú távú vércukor-szabályozás értékelése.",
    price: 5500,
    order: 4,
  },
  {
    _id: "seed-lab-vizelet",
    _type: "labTest",
    name: "Vizeletvizsgálat",
    description: "Vesefunkció, húgyúti fertőzések és anyagcsere-rendellenességek kiszűrése.",
    price: 3000,
    order: 5,
  },
];

// ─── Execute mutations ─────────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding Sanity CMS with Phase 4 content (categories, services, lab tests)...\n");

  try {
    console.log("Upserting service categories...");
    for (const cat of categories) {
      const result = await client.createOrReplace(cat);
      console.log(`  ok ${result._id} (${cat.name})`);
    }

    console.log("\nUpserting services...");
    for (const svc of services) {
      const result = await client.createOrReplace(svc);
      console.log(`  ok ${result._id} (${svc.name})`);
    }

    console.log("\nUpserting lab tests...");
    for (const test of labTests) {
      const result = await client.createOrReplace(test);
      console.log(`  ok ${result._id} (${test.name})`);
    }

    console.log(
      "\nSeed complete. Refresh http://localhost:3000 to see services and lab tests sections.",
    );
  } catch (err) {
    console.error("Seed failed:", err.message);
    if (err.response) {
      console.error("Response:", JSON.stringify(err.response, null, 2));
    }
    process.exit(1);
  }
}

seed();
