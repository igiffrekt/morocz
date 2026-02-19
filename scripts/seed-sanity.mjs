/**
 * Seed script: populates Sanity singleton documents with Hungarian sample content.
 * Run with: node scripts/seed-sanity.mjs
 *
 * Uses the Sanity client directly with the API token to patch (or create) the
 * homepage (_id: "homepage") and siteSettings (_id: "siteSettings") documents.
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

// ─── siteSettings ──────────────────────────────────────────────────────────

const siteSettingsData = {
  _id: "siteSettings",
  _type: "siteSettings",
  clinicName: "Morocz Medical",
  phone: "+36 33 123 456",
  email: "info@moroczmedical.hu",
  address: "2500 Esztergom\nKossuth Lajos utca 12.",
  navigationLinks: [
    {
      _key: "nav-szolgaltatasok",
      label: "Szolgáltatások",
      href: "#szolgaltatasok",
    },
    {
      _key: "nav-laborvizsgalatok",
      label: "Laborvizsgálatok",
      href: "#laborvizsgalatok",
    },
    {
      _key: "nav-blog",
      label: "Blog",
      href: "#blog",
    },
    {
      _key: "nav-kapcsolat",
      label: "Kapcsolat",
      href: "#kapcsolat",
    },
  ],
  socialLinks: [
    {
      _key: "social-facebook",
      platform: "facebook",
      url: "https://facebook.com/moroczmedical",
    },
    {
      _key: "social-instagram",
      platform: "instagram",
      url: "https://instagram.com/moroczmedical",
    },
  ],
  footerColumns: [
    {
      _key: "col-szolgaltatasok",
      heading: "Szolgáltatások",
      links: [
        {
          _key: "fc1-altalanos",
          label: "Általános belgyógyászat",
          href: "#altalanos",
        },
        {
          _key: "fc1-kardiologia",
          label: "Kardiológia",
          href: "#kardiologia",
        },
        {
          _key: "fc1-labor",
          label: "Laborvizsgálatok",
          href: "#laborvizsgalatok",
        },
        {
          _key: "fc1-prevencio",
          label: "Megelőző vizsgálatok",
          href: "#prevencio",
        },
      ],
    },
    {
      _key: "col-informaciok",
      heading: "Információk",
      links: [
        {
          _key: "fc2-rolunk",
          label: "Rólunk",
          href: "#rolunk",
        },
        {
          _key: "fc2-blog",
          label: "Blog",
          href: "#blog",
        },
        {
          _key: "fc2-foglalas",
          label: "Időpontfoglalás",
          href: "#kapcsolat",
        },
        {
          _key: "fc2-gyik",
          label: "GYIK",
          href: "#gyik",
        },
      ],
    },
    {
      _key: "col-kapcsolat",
      heading: "Kapcsolat",
      links: [
        {
          _key: "fc3-cim",
          label: "2500 Esztergom, Kossuth Lajos u. 12.",
          href: "https://maps.google.com/?q=Esztergom",
        },
        {
          _key: "fc3-telefon",
          label: "+36 33 123 456",
          href: "tel:+3633123456",
        },
        {
          _key: "fc3-email",
          label: "info@moroczmedical.hu",
          href: "mailto:info@moroczmedical.hu",
        },
      ],
    },
  ],
  privacyPolicyUrl: "/adatvedelem",
  metaDescription:
    "Morocz Medical — Egészségügyi szolgáltatások Esztergomban. Belgyógyászat, laborvizsgálatok, megelőző vizsgálatok. Foglaljon időpontot online.",
};

// ─── homepage ──────────────────────────────────────────────────────────────

const homepageData = {
  _id: "homepage",
  _type: "homepage",
  heroHeadline: "Egészsége a legjobb kezekben",
  heroSubtitle:
    "Modern orvosi ellátás Esztergomban — belgyógyászat, laborvizsgálatok és megelőző vizsgálatok egyetlen helyen. Foglaljon időpontot percek alatt.",
  heroBadges: [
    {
      _key: "badge-tapasztalt",
      emoji: "🏥",
      text: "15+ év tapasztalat",
    },
    {
      _key: "badge-online",
      emoji: "📅",
      text: "Online időpontfoglalás",
    },
    {
      _key: "badge-labor",
      emoji: "🔬",
      text: "Saját labordiagnosztika",
    },
  ],
  heroCards: [
    {
      _key: "card-belgyogyaszat",
      title: "Belgyógyászat",
      subtitle: "Általános és szakorvosi ellátás",
    },
    {
      _key: "card-laborvizsgalat",
      title: "Laborvizsgálat",
      subtitle: "Gyors eredmények, pontos diagnózis",
    },
    {
      _key: "card-prevencio",
      title: "Megelőzés",
      subtitle: "Szűrővizsgálatok és tanácsadás",
    },
    {
      _key: "card-kardiologia",
      title: "Kardiológia",
      subtitle: "EKG és szívvizsgálatok",
    },
  ],
  servicesHeadline: "Szolgáltatásaink",
  servicesSubtitle:
    "Átfogó egészségügyi ellátás modern környezetben. Minden, amire szüksége van, egy helyen.",
  labTestsHeadline: "Laborvizsgálatok",
  labTestsSubtitle: "Gyors és megbízható labordiagnosztika kedvező árakon.",
  ctaHeadline: "Foglaljon időpontot még ma!",
  ctaDescription:
    "Ne várjon — egészsége a legfontosabb. Vegye fel velünk a kapcsolatot és foglaljon időpontot percek alatt.",
};

// ─── Execute mutations ─────────────────────────────────────────────────────

async function seed() {
  console.log("Seeding Sanity CMS with Hungarian sample content...\n");

  try {
    // createOrReplace ensures the document exists with the exact data
    // (works even if document doesn't exist yet, or if it exists but is empty)
    console.log("Upserting siteSettings document...");
    const siteResult = await client.createOrReplace(siteSettingsData);
    console.log(`  ✓ siteSettings created/updated (_rev: ${siteResult._rev})\n`);

    console.log("Upserting homepage document...");
    const homeResult = await client.createOrReplace(homepageData);
    console.log(`  ✓ homepage created/updated (_rev: ${homeResult._rev})\n`);

    console.log("Seed complete. Refresh http://localhost:3000 to see content.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    if (err.response) {
      console.error("Response:", JSON.stringify(err.response, null, 2));
    }
    process.exit(1);
  }
}

seed();
