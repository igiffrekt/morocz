import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Tartalom")
    .items([
      // Kezdolap (Homepage singleton)
      S.listItem()
        .title("Kezdolap")
        .child(
          S.document().schemaType("homepage").documentId("homepage").title("Kezdolap szerkesztese"),
        ),

      S.divider(),

      // Szolgaltatasok group
      S.listItem()
        .title("Szolgaltatasok")
        .child(
          S.list()
            .title("Szolgaltatasok")
            .items([
              S.listItem()
                .title("Szolgaltatasok")
                .schemaType("service")
                .child(S.documentTypeList("service").title("Szolgaltatasok")),
              S.listItem()
                .title("Kategoriak")
                .schemaType("serviceCategory")
                .child(S.documentTypeList("serviceCategory").title("Kategoriak")),
              S.listItem()
                .title("Laborvizsgalatok")
                .schemaType("labTest")
                .child(S.documentTypeList("labTest").title("Laborvizsgalatok")),
            ]),
        ),

      S.divider(),

      // Velemenyek (Testimonials — standalone)
      S.listItem()
        .title("Velemenyek")
        .schemaType("testimonial")
        .child(S.documentTypeList("testimonial").title("Velemenyek")),

      S.divider(),

      // Blog group
      S.listItem()
        .title("Blog")
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Blog bejegyzesek")
                .schemaType("blogPost")
                .child(S.documentTypeList("blogPost").title("Blog bejegyzesek")),
              S.listItem()
                .title("Blog kategoriak")
                .schemaType("blogCategory")
                .child(S.documentTypeList("blogCategory").title("Blog kategoriak")),
            ]),
        ),

      S.divider(),

      // Beallitasok (SiteSettings singleton)
      S.listItem()
        .title("Beallitasok")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Weboldal beallitasok"),
        ),
    ]);
