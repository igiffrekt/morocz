const { createClient } = require('@sanity/client');

const client = createClient({
  projectId: 'l5qdfoyx',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: 'skoN2qWYf4O4QfdhOgdWQ9WU9Eybt2TDiYabLkDnxU3FVKx5beSuTQcR2mz565ygay2J9U2Rgp2gDMSOuSmCdI1ERqd8b4sBJEqz6qBEdf6ZWYPul6MNMW6l8GBQ8eagbwbeNB0fHT6MAb7auL6qicXA12i3XXGungzd2xAsGxPZBtheHMrY',
});

(async () => {
  console.log('Creating custom availability for April 15, 2026 (Wednesday)...');

  const result = await client.create({
    _type: 'customAvailability',
    date: '2026-04-15',
    startTime: '11:00',
    endTime: '15:20',
    note: 'Exception - normally closed on Wednesday',
    services: [] // Empty array = applies to all services
  });

  console.log('Created:', result._id);
  console.log('This will override the "day off" setting for April 15');
})();
