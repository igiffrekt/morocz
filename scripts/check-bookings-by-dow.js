const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'l5qdfoyx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY',
});

(async () => {
  // Get all future bookings and check day of week
  const bookings = await client.fetch(`*[_type == "booking" && slotDate >= "2026-04-03"] | order(slotDate asc) {
    slotDate
  }`);

  const byDayOfWeek = {};
  bookings.forEach(b => {
    const d = new Date(b.slotDate + 'T00:00:00');
    const dow = d.getDay();
    if (!byDayOfWeek[dow]) byDayOfWeek[dow] = [];
    byDayOfWeek[dow].push(b.slotDate);
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const schedule = {
    1: { isDayOff: false, hours: '12:00-15:20' },
    2: { isDayOff: false, hours: '11:00-14:40' },
    3: { isDayOff: true, hours: 'DAY OFF' },
    4: { isDayOff: false, hours: '13:20-16:40' },
    5: { isDayOff: true, hours: 'DAY OFF' },
    6: { isDayOff: true, hours: 'DAY OFF' },
    0: { isDayOff: true, hours: 'DAY OFF' }
  };

  console.log('Bookings by day of week:\n');
  Object.keys(byDayOfWeek).sort((a, b) => a - b).forEach(dow => {
    const sched = schedule[dow];
    const marker = sched.isDayOff ? '❌' : '✅';
    console.log(`${marker} ${days[dow]} (${sched.hours}): ${byDayOfWeek[dow].length} bookings`);

    if (sched.isDayOff) {
      const uniqueDates = [...new Set(byDayOfWeek[dow])].sort();
      console.log('   ISSUE: Bookings on day off!');
      console.log('   Dates:', uniqueDates.join(', '));
    }
    console.log('');
  });
})();
