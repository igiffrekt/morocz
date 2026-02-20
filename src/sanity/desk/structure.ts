import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Tartalom")
    .items([
      // Kezdőlap (Homepage singleton)
      S.listItem()
        .title("Kezdőlap")
        .child(
          S.document().schemaType("homepage").documentId("homepage").title("Kezdőlap szerkesztése"),
        ),

      S.divider(),

      // Szolgáltatások group
      S.listItem()
        .title("Szolgáltatások")
        .child(
          S.list()
            .title("Szolgáltatások")
            .items([
              S.listItem()
                .title("Szolgáltatások")
                .schemaType("service")
                .child(S.documentTypeList("service").title("Szolgáltatások")),
              S.listItem()
                .title("Kategóriák")
                .schemaType("serviceCategory")
                .child(S.documentTypeList("serviceCategory").title("Kategóriák")),
              S.listItem()
                .title("Laborvizsgálatok")
                .schemaType("labTest")
                .child(S.documentTypeList("labTest").title("Laborvizsgálatok")),
            ]),
        ),

      S.divider(),

      // Vélemények (Testimonials — standalone)
      S.listItem()
        .title("Vélemények")
        .schemaType("testimonial")
        .child(S.documentTypeList("testimonial").title("Vélemények")),

      S.divider(),

      // Blog group
      S.listItem()
        .title("Blog")
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Blog bejegyzések")
                .schemaType("blogPost")
                .child(S.documentTypeList("blogPost").title("Blog bejegyzések")),
              S.listItem()
                .title("Blog kategóriák")
                .schemaType("blogCategory")
                .child(S.documentTypeList("blogCategory").title("Blog kategóriák")),
            ]),
        ),

      S.divider(),

      // Beállítások (SiteSettings singleton)
      S.listItem()
        .title("Beállítások")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Weboldal beállítások"),
        ),
    ]);
