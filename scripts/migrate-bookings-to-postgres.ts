import { createClient } from "@sanity/client";
import { db } from "../src/lib/db";
import { bookingHistory } from "../src/lib/db/schema";

async function migrate() {
  const sanityClient = createClient({
    projectId: "l5qdfoyx",
    dataset: "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN || "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
    useCdn: false,
  });

  // Step 1: Delete all slotLock documents first (they reference bookings)
  console.log("Step 1: Deleting slotLock documents...");
  const slotLocks = await sanityClient.fetch(`*[_type == "slotLock"] { _id }`);
  console.log(`Found ${slotLocks.length} slotLock documents`);

  if (slotLocks.length > 0) {
    const lockTransaction = sanityClient.transaction();
    slotLocks.forEach((lock: any) => {
      lockTransaction.delete(lock._id);
    });
    await lockTransaction.commit();
    console.log(`✅ Deleted ${slotLocks.length} slotLock documents`);
  }

  // Step 2: Delete bookings with null dates (imported from old WordPress without date data)
  console.log("\nStep 2: Finding bookings with null dates (imported historical data without dates)...");

  const query = `*[_type == "booking" && date == null] {
    _id,
    patient->{_id, email, name},
    service->{_id, name},
    date,
    time,
    status,
    notes,
    _createdAt
  }`;

  const bookings = await sanityClient.fetch(query);

  console.log(`Found ${bookings.length} bookings with null dates (no useful historical data)`);

  if (bookings.length === 0) {
    console.log("No bookings to delete.");
    return;
  }

  console.log("These bookings have no date/time data, so they're not useful. Deleting them from Sanity...");

  // Delete from Sanity
  const bookingIds = bookings.map((b: any) => b._id);
  const batchSize = 100;

  for (let i = 0; i < bookingIds.length; i += batchSize) {
    const batch = bookingIds.slice(i, i + batchSize);
    const transaction = sanityClient.transaction();

    batch.forEach((id: string) => {
      transaction.delete(id);
    });

    await transaction.commit();
    console.log(`Deleted ${Math.min(i + batchSize, bookingIds.length)}/${bookingIds.length} from Sanity...`);
  }

  console.log("\n✅ Cleanup complete!");
  console.log(`- Deleted ${slotLocks.length} slotLock documents`);
  console.log(`- Deleted ${bookingIds.length} useless bookings from Sanity`);
  console.log(`- Total Sanity document count reduced by ${slotLocks.length + bookingIds.length}`);
}

migrate().catch(console.error);
