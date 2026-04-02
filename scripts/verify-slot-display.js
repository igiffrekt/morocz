const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'l5qdfoyx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY',
});

function generateTimeSlots(startTime, endTime, slotDuration = 20) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const slots = [];
  for (let t = startMinutes; t <= endMinutes - slotDuration; t += slotDuration) {
    const h = Math.floor(t / 60).toString().padStart(2, '0');
    const m = (t % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

(async () => {
  const testDates = ['2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16'];

  // Get schedule
  const schedule = await client.fetch(`*[_type == "weeklySchedule"][0]`);

  for (const date of testDates) {
    const d = new Date(date + 'T00:00:00');
    const dayOfWeek = d.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    console.log(`\n${date} (${dayNames[dayOfWeek]}):`);

    // Get day schedule
    let daySchedule = schedule.days.find(day => day.dayOfWeek === dayOfWeek);

    // Check for custom availability
    const customAvail = await client.fetch(`*[_type == "customAvailability" && date == $date][0]`, { date });

    if (customAvail) {
      console.log(`  ✨ Custom availability: ${customAvail.startTime} - ${customAvail.endTime}`);
      daySchedule = {
        ...daySchedule,
        isDayOff: false,
        startTime: customAvail.startTime,
        endTime: customAvail.endTime
      };
    }

    if (daySchedule.isDayOff) {
      console.log(`  ❌ Day off - no slots should be available`);
      continue;
    }

    console.log(`  Schedule: ${daySchedule.startTime} - ${daySchedule.endTime}`);

    // Generate all possible slots
    const allSlots = generateTimeSlots(daySchedule.startTime, daySchedule.endTime, schedule.defaultSlotDuration);
    console.log(`  Total slots: ${allSlots.length}`);

    // Get booked slots
    const slotLocks = await client.fetch(
      `*[_type == "slotLock" && slotDate == $date && (status == "held" || status == "booked")]`,
      { date }
    );

    const bookedTimes = slotLocks.map(lock => lock.slotTime);
    console.log(`  Booked: ${bookedTimes.length} slots`);

    // Calculate available
    const available = allSlots.filter(slot => !bookedTimes.includes(slot));
    console.log(`  Available: ${available.length} slots`);

    // Show booked times
    if (bookedTimes.length > 0) {
      console.log(`  Booked times: ${bookedTimes.sort().join(', ')}`);
    }
  }
})();
