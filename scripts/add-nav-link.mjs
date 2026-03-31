import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

async function addNavLink() {
  // Fetch current site settings
  const settings = await client.fetch('*[_type == "siteSettings" && _id == "siteSettings"][0]');

  if (!settings) {
    console.log("No site settings found");
    return;
  }

  const currentLinks = settings.navigationLinks || [];

  // Check if link already exists
  const exists = currentLinks.some(link => link.href === "/szolgaltatasok-es-arak");
  if (exists) {
    console.log("Link already exists in navigation");
    return;
  }

  // Add new link
  const newLink = {
    _key: `nav-szolgaltatasok-${Date.now()}`,
    label: "Árak",
    href: "/szolgaltatasok-es-arak"
  };

  // Insert after first link (assuming first is "Főoldal" or similar)
  const updatedLinks = [
    ...currentLinks.slice(0, 1),
    newLink,
    ...currentLinks.slice(1)
  ];

  await client
    .patch("siteSettings")
    .set({ navigationLinks: updatedLinks })
    .commit();

  console.log("Added 'Árak' link to navigation");
  console.log("Updated navigation:", updatedLinks.map(l => l.label).join(" | "));
}

addNavLink().catch(console.error);
