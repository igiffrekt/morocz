const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'l5qdfoyx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY',
});

(async () => {
  console.log('Checking future bookings from Apr 3, 2026...\n');

  // Get all future bookings
  const bookings = await client.fetch(`*[_type == "booking" && slotDate >= "2026-04-03"] | order(slotDate asc, slotTime asc) {
    _id, slotDate, slotTime, patientEmail, service->{title}
  }`);

  console.log(`Total future bookings: ${bookings.length}\n`);

  // Group by date
  const byDate = {};
  bookings.forEach(b => {
    if (!byDate[b.slotDate]) byDate[b.slotDate] = [];
    byDate[b.slotDate].push(b);
  });

  // Show first 10 dates
  const dates = Object.keys(byDate).sort().slice(0, 10);
  dates.forEach(date => {
    console.log(`${date} (${byDate[date].length} bookings):`);
    byDate[date].forEach(b => {
      console.log(`  ${b.slotTime} - ${b.service?.title || 'No service'} - ${b.patientEmail}`);
    });
    console.log('');
  });

  // Check for slot locks
  console.log('\nChecking slot locks for future dates...\n');
  const locks = await client.fetch(`*[_type == "slotLock" && slotDate >= "2026-04-03"] | order(slotDate asc, slotTime asc) {
    _id, slotDate, slotTime, status
  }`);

  console.log(`Total future slot locks: ${locks.length}\n`);

  // Group locks by date
  const locksByDate = {};
  locks.forEach(l => {
    if (!locksByDate[l.slotDate]) locksByDate[l.slotDate] = [];
    locksByDate[l.slotDate].push(l);
  });

  // Show first 5 dates
  const lockDates = Object.keys(locksByDate).sort().slice(0, 5);
  lockDates.forEach(date => {
    console.log(`${date} (${locksByDate[date].length} locks):`);
    locksByDate[date].slice(0, 5).forEach(l => {
      console.log(`  ${l.slotTime} - ${l.status}`);
    });
    console.log('');
  });
})();
