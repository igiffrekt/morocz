import { sanityFetch } from "@/sanity/lib/fetch";
import {
  siteSettingsQuery,
  allServiceCategoriesQuery,
} from "@/sanity/lib/queries";
import type { SiteSettings, ServiceCategory } from "../../../sanity.types";

export default async function SanityTestPage() {
  const settings = await sanityFetch<SiteSettings | null>({
    query: siteSettingsQuery,
    tags: ["siteSettings"],
  });

  const categories = await sanityFetch<ServiceCategory[]>({
    query: allServiceCategoriesQuery,
    tags: ["serviceCategory"],
  });

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sanity Data Pipeline Test</h1>

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Site Settings</h2>
        {settings ? (
          <p>
            Clinic name:{" "}
            <strong>{settings.clinicName ?? "(not set)"}</strong>
          </p>
        ) : (
          <p className="text-amber-600">
            No siteSettings document found — create one in /studio
          </p>
        )}
      </section>

      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold mb-2">Service Categories</h2>
        {categories && categories.length > 0 ? (
          <ul>
            {categories.map((cat) => (
              <li key={cat._id}>
                {cat.emoji} {cat.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-amber-600">
            No categories yet — create them in /studio
          </p>
        )}
      </section>

      <div className="p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-green-700 font-semibold">
          ✓ Sanity data pipeline working! Fetch succeeded without errors.
        </p>
      </div>
    </main>
  );
}
