import { createClient } from "@sanity/client";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { bookingHistory } from "../src/lib/db/schema";

const DATABASE_URL = "postgresql://neondb_owner:npg_GpMigF3C6RKA@ep-red-smoke-alowj0zr-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function archive() {
  const sanityClient = createClient({
    projectId: "l5qdfoyx",
    dataset: "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN || "skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY",
    useCdn: false,
  });

  const currentYear = new Date().getFullYear();
  const cutoffDate = `${currentYear}-01-01`;

  console.log(`Archiving bookings older than ${cutoffDate} to Postgres...`);

  // Get all bookings before current year (2026) with actual date data
  const query = `*[_type == "booking" && slotDate < "${cutoffDate}" && slotDate != null] {
    _id,
    patientEmail,
    patientName,
    service->{_id, name},
    slotDate,
    slotTime,
    status,
    notes,
    _createdAt
  }`;

  const bookings = await sanityClient.fetch(query);

  console.log(`Found ${bookings.length} bookings to archive`);

  if (bookings.length === 0) {
    console.log("No bookings to archive.");
    return;
  }

  // Insert into Postgres
  let archived = 0;
  for (const booking of bookings) {
    try {
      await db.insert(bookingHistory).values({
        id: booking._id,
        patientId: null,
        patientEmail: booking.patientEmail || null,
        patientName: booking.patientName || null,
        serviceId: booking.service?._id || null,
        serviceName: booking.service?.name || null,
        date: booking.slotDate,
        time: booking.slotTime,
        status: booking.status || "completed",
        notes: booking.notes || null,
        createdAt: new Date(booking._createdAt),
      });
      archived++;
      if (archived % 100 === 0) {
        console.log(`Archived ${archived}/${bookings.length} to Postgres...`);
      }
    } catch (error) {
      console.error(`Failed to archive booking ${booking._id}:`, error);
    }
  }

  console.log(`\n✅ Archived ${archived} bookings to Postgres`);

  // Delete from Sanity
  console.log("\nDeleting archived bookings from Sanity...");
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

  console.log("\n✅ Archive complete!");
  console.log(`- Moved ${archived} bookings to Postgres`);
  console.log(`- Deleted ${bookingIds.length} from Sanity`);
  console.log(`- Sanity document count reduced by ${bookingIds.length}`);
}

archive().catch(console.error);
