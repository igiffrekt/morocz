import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// Categories
const categories = [
  { name: "Nőgyógyászati vizsgálatok", emoji: "👩‍⚕️", order: 1 },
  { name: "Egyéb szolgáltatások", emoji: "📋", order: 2 },
  { name: "Mintavételek (Felárak)", emoji: "🧪", order: 3 },
  { name: "Mikrobiológiai vizsgálatok", emoji: "🔬", order: 4 },
  { name: "HPV vizsgálatok", emoji: "🧬", order: 5 },
  { name: "Éves Szűrőcsomagok", emoji: "🩺", order: 6 },
];

// Services by category
const servicesByCategory = {
  "Nőgyógyászati vizsgálatok": [
    { name: "Nőgyógyászati vizsgálat / tanácsadás (ultrahang nélkül)", price: 30000, order: 1 },
    { name: "Nőgyógyászati vizsgálat ultrahanggal", price: 43000, order: 2 },
    { name: "Kontroll vizsgálat (3 hónapon belül, rövidített)", price: 22000, order: 3 },
    { name: "Spirál felhelyezés vagy csere ultrahanggal", price: 43000, description: "Az eszköz árát nem tartalmazza. Az aktuálisan elérhető eszközökről rendelőnk elérhetőségein érdeklődhet.", order: 4 },
    { name: "Spirál eltávolítás (ultrahang nélkül)", price: 30000, order: 5 },
    { name: "Várandósgondozás", price: 42000, description: "Várandósgondozás során tájékozódó ultrahangot végzek, mely nem minősül genetikai ultrahangnak!", order: 6 },
  ],
  "Egyéb szolgáltatások": [
    { name: "Szakorvosi dokumentáció kiállítása (vizsgálaton kívül)", price: 12000, order: 1 },
    { name: "Sürgősségi fogamzásgátlás", price: 12000, order: 2 },
    { name: "Receptírás rendelőnk páciensei részére", price: 6000, description: "Receptírás a vizsgálat alkalmával díjtalan.", order: 3 },
  ],
  "Mintavételek (Felárak)": [
    { name: "Folyadékalapú méhnyakszűrés (LBC) mintavétel", price: 11500, description: "A folyadékalapú citológia egy korszerűbb méhnyakszűrési módszer.", order: 1 },
    { name: "Endometrium (méhnyálkahártya) szövettani mintavétel", price: 22000, order: 2 },
    { name: "Injekció beadása", price: 6000, order: 3 },
  ],
  "Mikrobiológiai vizsgálatok": [
    { name: "Hüvelyváladék tenyésztés (aerob baktérium + gomba + kenet)", price: 8500, order: 1 },
    { name: "STD vizsgálat", price: 7500, description: "Ár kórokozónként", order: 2 },
    { name: "GBS szűrés", price: 7500, order: 3 },
  ],
  "HPV vizsgálatok": [
    { name: "HPV DNS alapú, 21 genotípus meghatározás", price: 18000, description: "HPV jelenlétét vizsgálja", order: 1 },
    { name: "Aptima mRNS alapú HPV vizsgálat", price: 16000, description: "Magas kockázatú típusok aktivitásának kimutatására szolgál", order: 2 },
  ],
  "Éves Szűrőcsomagok": [
    { name: "Alap Szűrőcsomag", price: 52000, description: "Nőgyógyászati vizsgálat + ultrahang vizsgálat, Folyadékalapú méhnyakszűrés (LBC). Évente egy alkalommal igénybe vehető.", order: 1 },
    { name: "Komplex Szűrőcsomag", price: 64000, description: "Nőgyógyászati vizsgálat + ultrahang, Folyadékalapú méhnyakszűrés, HPV DNS tipizálás (21 típus). Évente egy alkalommal igénybe vehető.", order: 2 },
    { name: "Prémium Szűrőcsomag", price: 74000, description: "Nőgyógyászati vizsgálat, Nőgyógyászati Ultrahang, Folyadékalapú méhnyakszűrés, Aptima mRNS alapú HPV vizsgálat, Hüvelyváladék tenyésztés (baktérium + gomba). Évente egy alkalommal igénybe vehető.", order: 3 },
  ],
};

async function main() {
  console.log("Step 1: Delete ALL services first (to remove references)...");

  // Delete all services first
  const allServices = await client.fetch('*[_type == "service"]._id');
  console.log("Found", allServices.length, "services to delete");
  for (const id of allServices) {
    try {
      await client.delete(id);
      console.log("Deleted service:", id);
    } catch (e) {
      console.log("Could not delete service", id, e.message);
    }
  }

  console.log("\nStep 2: Delete ALL categories...");
  const allCategories = await client.fetch('*[_type == "serviceCategory"]._id');
  console.log("Found", allCategories.length, "categories to delete");
  for (const id of allCategories) {
    try {
      await client.delete(id);
      console.log("Deleted category:", id);
    } catch (e) {
      console.log("Could not delete category", id, e.message);
    }
  }

  console.log("\nStep 3: Creating new categories...");

  // Create categories and store their IDs
  const categoryIds = {};
  for (const cat of categories) {
    const result = await client.create({
      _type: "serviceCategory",
      name: cat.name,
      emoji: cat.emoji,
      order: cat.order,
    });
    categoryIds[cat.name] = result._id;
    console.log("Created category:", cat.name, result._id);
  }

  console.log("\nStep 4: Creating services...");

  // Create services
  for (const [categoryName, services] of Object.entries(servicesByCategory)) {
    const categoryId = categoryIds[categoryName];
    for (const svc of services) {
      const result = await client.create({
        _type: "service",
        name: svc.name,
        price: svc.price,
        description: svc.description || "",
        order: svc.order,
        category: {
          _type: "reference",
          _ref: categoryId,
        },
      });
      console.log("Created service:", svc.name);
    }
  }

  console.log("\nDone! Created", categories.length, "categories and", Object.values(servicesByCategory).flat().length, "services");
}

main().catch(console.error);
