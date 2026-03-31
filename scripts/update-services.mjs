import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

// Categories based on the price list
const categories = [
  { name: "Nőgyógyászati vizsgálatok", emoji: "🏥", order: 1 },
  { name: "Várandósgondozás", emoji: "🤰", order: 2 },
  { name: "Spirál szolgáltatások", emoji: "💊", order: 3 },
  { name: "Kiegészítő szolgáltatások", emoji: "🔬", order: 4 },
  { name: "Laborvizsgálatok", emoji: "🧪", order: 5 },
  { name: "Adminisztráció", emoji: "📋", order: 6 },
];

// Services from the price list - 2026.04.01
const services = [
  // Nőgyógyászati vizsgálatok
  { name: "Nőgyógyászati vizsgálat/tanácsadás ultrahang nélkül", price: 30000, category: "Nőgyógyászati vizsgálatok", order: 1, duration: 20 },
  { name: "Ultrahang felár", price: 13000, category: "Nőgyógyászati vizsgálatok", order: 2, duration: 10 },
  { name: "Kontroll vizsgálat 3 hónapon belül", price: 22000, category: "Nőgyógyászati vizsgálatok", order: 3, duration: 15 },
  { name: "Sürgősségi fogamzásgátlás", price: 15000, category: "Nőgyógyászati vizsgálatok", order: 4, duration: 15 },

  // Várandósgondozás
  { name: "Várandósgondozás", price: 45000, category: "Várandósgondozás", order: 1, duration: 30 },

  // Spirál szolgáltatások
  { name: "Spirál felhelyezés/csere + ultrahang", price: 43000, category: "Spirál szolgáltatások", order: 1, duration: 30, description: "Az eszköz árát nem tartalmazza – aktuális készletünkről érdeklődjön elérhetőségeinken" },
  { name: "Spirál levétel ultrahang nélkül", price: 30000, category: "Spirál szolgáltatások", order: 2, duration: 20 },

  // Kiegészítő szolgáltatások
  { name: "Folyadék alapú méhnyakszűrés mintavétel", price: 11500, category: "Kiegészítő szolgáltatások", order: 1, duration: 10 },
  { name: "Hagyományos citológia mintavétel", price: 6500, category: "Kiegészítő szolgáltatások", order: 2, duration: 10 },
  { name: "Szövettani mintavétel (méhnyálkahártya)", price: 20000, category: "Kiegészítő szolgáltatások", order: 3, duration: 15 },
  { name: "Injekció beadása", price: 6000, category: "Kiegészítő szolgáltatások", order: 4, duration: 10 },
  { name: "Vérvételi díj", price: 3500, category: "Kiegészítő szolgáltatások", order: 5, duration: 10 },

  // Laborvizsgálatok
  { name: "Hüvelyváladék tenyésztés (aerob baktérium+gomba) + kenet", price: 8500, category: "Laborvizsgálatok", order: 1, duration: 10 },
  { name: "HPV21 tipizálás (21 genotípus DNS alapú meghatározása)", price: 18000, category: "Laborvizsgálatok", order: 2, duration: 10 },
  { name: "HPV15 tipizálás", price: 14000, category: "Laborvizsgálatok", order: 3, duration: 10 },
  { name: "Aptima mRNS alapú tipizálás", price: 16000, category: "Laborvizsgálatok", order: 4, duration: 10 },
  { name: "STD vizsgálat", price: 7500, category: "Laborvizsgálatok", order: 5, duration: 10, description: "Ár: 7500 Ft/kórokozó" },

  // Adminisztráció
  { name: "Szakorvosi dokumentáció kiállítása vizsgálaton kívül", price: 10000, category: "Adminisztráció", order: 1, duration: 10 },
];

async function main() {
  console.log("🗑️  Deleting existing services...");

  // Delete existing services first (they reference categories)
  const existingServices = await client.fetch('*[_type == "service"]._id');
  for (const id of existingServices) {
    try {
      await client.delete(id);
      console.log(`  Deleted service: ${id}`);
    } catch (e) {
      console.log(`  Could not delete service ${id}: ${e.message}`);
    }
  }

  console.log("\n🗑️  Deleting existing categories...");
  // Delete existing categories
  const existingCategories = await client.fetch('*[_type == "serviceCategory"]._id');
  for (const id of existingCategories) {
    try {
      await client.delete(id);
      console.log(`  Deleted category: ${id}`);
    } catch (e) {
      console.log(`  Could not delete category ${id}: ${e.message}`);
    }
  }

  console.log("\n📁 Creating categories...");
  const categoryIds = {};

  for (const cat of categories) {
    const doc = await client.create({
      _type: "serviceCategory",
      name: cat.name,
      emoji: cat.emoji,
      order: cat.order,
    });
    categoryIds[cat.name] = doc._id;
    console.log(`  Created: ${cat.emoji} ${cat.name}`);
  }

  console.log("\n💉 Creating services...");

  for (const svc of services) {
    const doc = await client.create({
      _type: "service",
      name: svc.name,
      price: svc.price,
      description: svc.description || "",
      category: {
        _type: "reference",
        _ref: categoryIds[svc.category],
      },
      order: svc.order,
      appointmentDuration: svc.duration,
    });
    console.log(`  Created: ${svc.name} - ${svc.price.toLocaleString()} Ft`);
  }

  console.log("\n✅ Done! Services updated.");
}

main().catch(console.error);
