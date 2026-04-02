import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: "l5qdfoyx",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
  useCdn: false,
});

async function createSlotLocks() {
  console.log("Fetching all bookings...");

  const bookings = await sanityClient.fetch<
    Array<{
      _id: string;
      slotDate: string;
      slotTime: string;
      service: { _id: string } | null;
    }>
  >(`*[_type == "booking"] { _id, slotDate, slotTime, service->{_id} }`);

  console.log(`Found ${bookings.length} bookings`);

  // Check existing slotLocks
  const existingLocks = await sanityClient.fetch<Array<{ _id: string }>>(
    `*[_type == "slotLock"] { _id }`
  );
  console.log(`Found ${existingLocks.length} existing slot locks`);

  const existingLockIds = new Set(existingLocks.map((l) => l._id));

  let created = 0;
  let skipped = 0;

  for (const booking of bookings) {
    if (!booking.slotDate || !booking.slotTime) {
      skipped++;
      continue;
    }

    // Generate slotLock ID based on date and time
    const slotLockId = `slotLock-${booking.slotDate}-${booking.slotTime.replace(":", "-")}`;

    if (existingLockIds.has(slotLockId)) {
      skipped++;
      continue;
    }

    try {
      await sanityClient.create({
        _type: "slotLock",
        _id: slotLockId,
        slotDate: booking.slotDate,
        slotTime: booking.slotTime,
        status: "booked",
        expiresAt: null,
      });

      created++;
      if (created % 50 === 0) {
        console.log(`Created ${created} slot locks...`);
      }
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        skipped++;
      } else {
        console.error(`Failed to create slotLock for ${slotLockId}:`, error.message);
      }
    }
  }

  console.log("\n✅ Slot lock creation complete!");
  console.log(`- Created: ${created} slot locks`);
  console.log(`- Skipped: ${skipped} (already exists or missing data)`);
}

createSlotLocks().catch(console.error);
