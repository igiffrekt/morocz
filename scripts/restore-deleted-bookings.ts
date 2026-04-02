import { createClient } from "@sanity/client";

async function restore() {
  const sanityClient = createClient({
    projectId: "l5qdfoyx",
    dataset: "production",
    apiVersion: "2024-01-01",
    token: "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
    useCdn: false,
  });

  // Try to get transaction history
  try {
    const response = await fetch(
      "https://l5qdfoyx.api.sanity.io/v1/data/history/production/transactions?excludeContent=true&reverse=true&limit=100",
      {
        headers: {
          Authorization: `Bearer skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY`,
        },
      }
    );
    const data = await response.json();
    console.log("Transaction history:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to get history:", error);
  }
}

restore().catch(console.error);
