import { defineQuery } from "next-sanity";

// Queries used only by the redesigned subpages (prices, service pages, lab packages).
// Kept apart from queries.ts so parallel redesign work does not collide there.

// Revalidation tag: "homepage"
export const doctorPortraitQuery = defineQuery(
  `*[_type == "homepage" && _id == "homepage"][0].heroDoctorImage`,
);

// Revalidation tag: "homepage" — the "Szolgáltatásaink" heading/lead shared with the homepage.
export const servicesIntroQuery = defineQuery(
  `*[_type == "homepage" && _id == "homepage"][0]{servicesHeadline, servicesSubtitle}`,
);
