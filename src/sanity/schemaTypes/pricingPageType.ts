import { defineField, defineType } from "sanity";

const badgeStyleOptions = [
  { title: "Mint (+UH)", value: "mint" },
  { title: "Pink (+UH+LBC)", value: "pink" },
  { title: "Fehér (kedvezmény)", value: "white" },
];

const priceRowFields = [
  defineField({
    name: "label",
    title: "Megnevezés",
    type: "string",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "subtitle",
    title: "Alcím (halvány címke)",
    type: "string",
    description: 'Pl. "ultrahang nélkül", "ultrahanggal"',
  }),
  defineField({
    name: "badge",
    title: "Színes címke",
    type: "string",
    description: 'Pl. "+ UH", "+ UH + LBC", "-27%"',
  }),
  defineField({
    name: "badgeStyle",
    title: "Címke színe",
    type: "string",
    options: { list: badgeStyleOptions },
  }),
  defineField({
    name: "note",
    title: "Megjegyzés (a név után, halvány)",
    type: "string",
    description: 'Pl. "(3 hónapon belül)"',
  }),
  defineField({
    name: "price",
    title: "Ár (Ft)",
    type: "number",
    validation: (rule) => rule.required().min(0),
  }),
];

const priceRowPreview = {
  select: { title: "label", subtitle: "price", badge: "badge" },
  prepare({ title, subtitle, badge }: { title?: string; subtitle?: number; badge?: string }) {
    const price = typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—";
    return {
      title: badge ? `[${badge}] ${title ?? ""}` : (title ?? ""),
      subtitle: price,
    };
  },
};

export const pricingPageType = defineType({
  name: "pricingPage",
  title: "Árak oldal",
  type: "document",
  fields: [
    defineField({
      name: "validityNote",
      title: "Érvényesség jelzés",
      type: "string",
      description: 'A hero részben megjelenő dátum címke, pl. "Érvényes 2026. április 1-től"',
      initialValue: "Érvényes 2026. április 1-től",
    }),

    // === Gynecological exams — base group ===
    defineField({
      name: "gynBaseExam",
      title: "Nőgyógyászati alapvizsgálat",
      type: "object",
      fields: [
        defineField({
          name: "items",
          title: "Vizsgálat sorok",
          type: "array",
          of: [{ type: "object", fields: priceRowFields, preview: priceRowPreview }],
        }),
      ],
      initialValue: {
        items: [
          { label: "Vizsgálat / tanácsadás", subtitle: "ultrahang nélkül", price: 29900 },
          { label: "Vizsgálat ultrahanggal", badge: "+ UH", badgeStyle: "mint", price: 41990 },
          {
            label: "Vizsgálat ultrahanggal és méhnyakszűréssel",
            badge: "+ UH + LBC",
            badgeStyle: "pink",
            price: 49900,
          },
          {
            label: "Kontroll vizsgálat",
            badge: "-27%",
            badgeStyle: "white",
            note: "(3 hónapon belül)",
            price: 22000,
          },
        ],
      },
    }),

    // === Spiral services ===
    defineField({
      name: "spiralServices",
      title: "Spirál szolgáltatások",
      type: "object",
      fields: [
        defineField({
          name: "items",
          title: "Sorok",
          type: "array",
          of: [{ type: "object", fields: priceRowFields, preview: priceRowPreview }],
        }),
        defineField({
          name: "footnote",
          title: "Megjegyzés",
          type: "string",
        }),
      ],
      initialValue: {
        items: [
          { label: "Spirál felhelyezés / csere", subtitle: "ultrahanggal", price: 42900 },
          { label: "Spirál eltávolítás", price: 30000 },
        ],
        footnote: "Az eszköz árát nem tartalmazza",
      },
    }),

    // === Pregnancy care ===
    defineField({
      name: "pregnancyCare",
      title: "Várandósgondozás",
      type: "object",
      fields: [
        defineField({
          name: "label",
          title: "Megnevezés",
          type: "string",
        }),
        defineField({
          name: "subtitle",
          title: "Leírás",
          type: "string",
        }),
        defineField({
          name: "price",
          title: "Ár (Ft)",
          type: "number",
        }),
      ],
      initialValue: {
        label: "Várandósgondozás",
        subtitle: "Tájékozódó ultrahanggal (nem genetikai)",
        price: 42000,
      },
    }),

    // === Screening packages (3 tier cards) ===
    defineField({
      name: "screeningPackages",
      title: "Éves szűrőcsomagok",
      type: "object",
      fields: [
        defineField({
          name: "tiers",
          title: "Csomagok",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "name",
                  title: "Csomag neve",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "price",
                  title: "Ár (Ft)",
                  type: "number",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "highlighted",
                  title: 'Kiemelt ("Ajánlott" címkével)',
                  type: "boolean",
                  initialValue: false,
                }),
                defineField({
                  name: "features",
                  title: "Tartalom",
                  type: "array",
                  of: [
                    {
                      type: "object",
                      fields: [
                        defineField({
                          name: "text",
                          title: "Szöveg",
                          type: "string",
                          validation: (rule) => rule.required(),
                        }),
                        defineField({
                          name: "subtext",
                          title: "Kiegészítő szöveg",
                          type: "string",
                        }),
                        defineField({
                          name: "included",
                          title: "Tartalmazza",
                          type: "boolean",
                          initialValue: true,
                        }),
                        defineField({
                          name: "emphasized",
                          title: "Kiemelt",
                          type: "boolean",
                          initialValue: false,
                        }),
                      ],
                      preview: {
                        select: { title: "text", included: "included" },
                        prepare({ title, included }: { title?: string; included?: boolean }) {
                          return { title: `${included === false ? "✗" : "✓"} ${title ?? ""}` };
                        },
                      },
                    },
                  ],
                }),
              ],
              preview: {
                select: { title: "name", subtitle: "price" },
                prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                  const price =
                    typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—";
                  return { title: title ?? "", subtitle: price };
                },
              },
            },
          ],
          validation: (rule) => rule.length(3).error("Pontosan 3 csomag szükséges"),
        }),
      ],
      initialValue: {
        tiers: [
          {
            name: "Alap",
            price: 49900,
            highlighted: false,
            features: [
              { text: "Nőgyógyászati vizsgálat", included: true },
              { text: "Ultrahang", included: true },
              {
                text: "LBC méhnyakszűrés",
                subtext: "(vizsgálat+mintavétel+ultrahang)",
                included: true,
              },
              { text: "HPV DNS tipizálás", included: false },
            ],
          },
          {
            name: "Komplex",
            price: 59900,
            highlighted: true,
            features: [
              { text: "Nőgyógyászati vizsgálat", included: true },
              { text: "Ultrahang", included: true },
              {
                text: "LBC méhnyakszűrés",
                subtext: "(vizsgálat+mintavétel+ultrahang)",
                included: true,
              },
              { text: "HPV DNS tipizálás (15 genotípus)", included: true, emphasized: true },
            ],
          },
          {
            name: "Prémium",
            price: 71900,
            highlighted: false,
            features: [
              { text: "Minden a Komplexből +", included: true },
              { text: "Aptima mRNS HPV", included: true, emphasized: true },
              { text: "Hüvelyváladék tenyésztés", included: true, emphasized: true },
            ],
          },
        ],
      },
    }),

    // === Sampling surcharges ===
    defineField({
      name: "samplingServices",
      title: "Mintavételek",
      type: "object",
      fields: [
        defineField({
          name: "items",
          title: "Sorok",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "label",
                  title: "Megnevezés",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "price",
                  title: "Ár (Ft)",
                  type: "number",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: { title: "label", subtitle: "price" },
                prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                  return {
                    title: title ?? "",
                    subtitle:
                      typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—",
                  };
                },
              },
            },
          ],
        }),
      ],
      initialValue: {
        items: [
          { label: "Folyadékalapú méhnyakszűrés (LBC) mintavétel", price: 9900 },
          { label: "Endometrium (méhnyálkahártya) szövettani mintavétel", price: 21850 },
        ],
      },
    }),

    // === Microbiology ===
    defineField({
      name: "microbiologyServices",
      title: "Mikrobiológiai vizsgálatok",
      type: "object",
      fields: [
        defineField({
          name: "items",
          title: "Sorok",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "label",
                  title: "Megnevezés",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "suffix",
                  title: "Utótag (halvány)",
                  type: "string",
                  description: 'Pl. "/kórokozó"',
                }),
                defineField({
                  name: "price",
                  title: "Ár (Ft)",
                  type: "number",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: { title: "label", subtitle: "price" },
                prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                  return {
                    title: title ?? "",
                    subtitle:
                      typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—",
                  };
                },
              },
            },
          ],
        }),
      ],
      initialValue: {
        items: [
          {
            label: "Hüvelyváladék tenyésztés (aerob baktérium + gomba + kenet)",
            price: 8500,
          },
          { label: "STD vizsgálat", suffix: "/kórokozó", price: 7500 },
          { label: "GBS szűrés", price: 7500 },
        ],
      },
    }),

    // === HPV Tests ===
    defineField({
      name: "hpvTests",
      title: "HPV vizsgálatok",
      type: "object",
      fields: [
        defineField({
          name: "intro",
          title: "Bevezető szöveg",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "items",
          title: "Vizsgálatok",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "name",
                  title: "Név",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "description",
                  title: "Leírás",
                  type: "string",
                }),
                defineField({
                  name: "price",
                  title: "Ár (Ft)",
                  type: "number",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: { title: "name", subtitle: "price" },
                prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                  return {
                    title: title ?? "",
                    subtitle:
                      typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—",
                  };
                },
              },
            },
          ],
        }),
      ],
      initialValue: {
        intro:
          "A különböző HPV-vizsgálatok eltérő módszerrel és eltérő klinikai céllal történnek. A megfelelő vizsgálat kiválasztása orvosi javaslat alapján történik.",
        items: [
          {
            name: "HPV DNS alapú, 15 genotípus meghatározás",
            description: "HPV jelenlétét vizsgálja",
            price: 14000,
          },
          {
            name: "Aptima mRNS alapú HPV vizsgálat",
            description: "Magas kockázatú típusok aktivitásának kimutatására szolgál",
            price: 16000,
          },
        ],
      },
    }),

    // === Other standalone services ===
    defineField({
      name: "otherServices",
      title: "Egyéb szolgáltatások",
      type: "object",
      fields: [
        defineField({
          name: "items",
          title: "Sorok",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "label",
                  title: "Megnevezés",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "price",
                  title: "Ár (Ft)",
                  type: "number",
                  validation: (rule) => rule.required(),
                }),
              ],
              preview: {
                select: { title: "label", subtitle: "price" },
                prepare({ title, subtitle }: { title?: string; subtitle?: number }) {
                  return {
                    title: title ?? "",
                    subtitle:
                      typeof subtitle === "number" ? `${subtitle.toLocaleString("hu-HU")} Ft` : "—",
                  };
                },
              },
            },
          ],
        }),
        defineField({
          name: "footnote",
          title: "Megjegyzés",
          type: "string",
        }),
      ],
      initialValue: {
        items: [
          { label: "Injekció beadása", price: 6000 },
          { label: "Szakorvosi dokumentáció", price: 9900 },
          { label: "Sürgősségi fogamzásgátlás", price: 11900 },
          { label: "Receptírás", price: 4900 },
        ],
        footnote: "Receptírás vizsgálat alkalmával díjtalan.",
      },
    }),
  ],
  preview: {
    prepare() {
      return { title: "Árak oldal" };
    },
  },
});
