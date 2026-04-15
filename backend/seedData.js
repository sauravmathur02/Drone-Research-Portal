const Drone = require('./models/Drone');
const Country = require('./models/Country');
const CounterSystem = require('./models/CounterSystem');

async function seedDatabase() {
  const droneCount = await Drone.countDocuments();

  if (droneCount > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding database...');

  const countries = [
    {
      code: 'USA',
      name: 'United States',
      lat: 38.9072,
      lng: -77.0369,
      drone_count: 12500,
      specialization: 'HALE / Precision Strike',
      top_drones: ['MQ-9 Reaper', 'Global Hawk'],
      growth_rate: 15,
    },
    {
      code: 'CHN',
      name: 'China',
      lat: 39.9042,
      lng: 116.4074,
      drone_count: 14200,
      specialization: 'Swarm / Stealth',
      top_drones: ['CH-4 Rainbow', 'Wing Loong'],
      growth_rate: 32,
    },
    {
      code: 'RUS',
      name: 'Russia',
      lat: 55.7558,
      lng: 37.6173,
      drone_count: 8900,
      specialization: 'Loitering Munitions',
      top_drones: ['Lancet', 'Orion'],
      growth_rate: 20,
    },
    {
      code: 'IND',
      name: 'India',
      lat: 28.6139,
      lng: 77.209,
      drone_count: 5400,
      specialization: 'Tactical Recon',
      top_drones: ['Tapas BH-201', 'Netra'],
      growth_rate: 25,
    },
    {
      code: 'ISR',
      name: 'Israel',
      lat: 31.0461,
      lng: 34.8516,
      drone_count: 4800,
      specialization: 'Loitering / Mini-Tactical',
      top_drones: ['Hero-120', 'Hermes 900'],
      growth_rate: 10,
    },
  ];

  const drones = [
    {
      name: 'Black Hornet 3',
      country: 'USA',
      type: 'Nano',
      specs: {
        price_usd: 195000,
        range_km: 2,
        endurance_hr: 0.4,
        payload_kg: 0,
        speed_kmh: 21,
        maintenance_cost_per_hr: 50,
      },
      description: 'Ultra-light reconnaissance drone for close-range intelligence gathering.',
    },
    {
      name: 'CH-4 Rainbow',
      country: 'China',
      type: 'MALE',
      specs: {
        price_usd: 4000000,
        range_km: 250,
        endurance_hr: 30,
        payload_kg: 345,
        speed_kmh: 330,
        maintenance_cost_per_hr: 1200,
      },
      description: 'Medium-altitude drone built for surveillance and precision strike support.',
    },
    {
      name: 'MQ-9 Reaper',
      country: 'USA',
      type: 'HALE',
      specs: {
        price_usd: 32000000,
        range_km: 1900,
        endurance_hr: 27,
        payload_kg: 1700,
        speed_kmh: 480,
        maintenance_cost_per_hr: 3600,
      },
      description: 'Long-range ISR and strike drone with heavy payload flexibility.',
    },
    {
      name: 'Bayraktar TB2',
      country: 'Turkey',
      type: 'Tactical',
      specs: {
        price_usd: 5000000,
        range_km: 300,
        endurance_hr: 27,
        payload_kg: 150,
        speed_kmh: 220,
        maintenance_cost_per_hr: 800,
      },
      description: 'Combat-proven tactical UAV for intelligence and light strike missions.',
    },
    {
      name: 'Shahed 136',
      country: 'Iran',
      type: 'Loitering',
      specs: {
        price_usd: 20000,
        range_km: 2500,
        endurance_hr: 12,
        payload_kg: 40,
        speed_kmh: 185,
        maintenance_cost_per_hr: 10,
      },
      description: 'Long-range loitering munition designed for saturation attacks.',
    },
    {
      name: 'Hero-120',
      country: 'Israel',
      type: 'Loitering',
      specs: {
        price_usd: 150000,
        range_km: 60,
        endurance_hr: 1,
        payload_kg: 4.5,
        speed_kmh: 100,
        maintenance_cost_per_hr: 20,
      },
      description: 'Portable loitering platform suited to tactical precision engagements.',
    },
    {
      name: 'Tapas BH-201',
      country: 'India',
      type: 'MALE',
      specs: {
        price_usd: 10000000,
        range_km: 250,
        endurance_hr: 24,
        payload_kg: 350,
        speed_kmh: 224,
        maintenance_cost_per_hr: 900,
      },
      description: 'Endurance-focused surveillance drone for medium-altitude missions.',
    },
    {
      name: 'Swarm Variant X',
      country: 'China',
      type: 'Swarm',
      specs: {
        price_usd: 5000,
        range_km: 20,
        endurance_hr: 0.5,
        payload_kg: 2,
        speed_kmh: 120,
        maintenance_cost_per_hr: 10,
      },
      description: 'Autonomous low-cost drone optimized for coordinated swarm attacks.',
    },
  ];

  const counterSystems = [
    {
      name: 'Iron Beam',
      type: 'Laser',
      effective_against: ['Swarm', 'Nano', 'Loitering'],
      range_km: 7,
      effectiveness: 'High',
      description: 'directed energy can engage many small drones quickly with precision and low per-shot cost.',
    },
    {
      name: 'Titan C-UAS',
      type: 'Jamming',
      effective_against: ['Swarm', 'Nano', 'Tactical'],
      range_km: 3,
      effectiveness: 'High',
      description: 'electronic attack breaks command links and navigation signals used by coordinated low-altitude raids.',
    },
    {
      name: 'DroneHunter F700',
      type: 'Interceptor',
      effective_against: ['Tactical', 'MALE'],
      range_km: 5,
      effectiveness: 'Medium',
      description: 'physical interception works when hostile drones resist spoofing or jamming.',
    },
    {
      name: 'Patriot PAC-3',
      type: 'Missile',
      effective_against: ['HALE', 'MALE'],
      range_km: 30,
      effectiveness: 'High',
      description: 'long-range missile defense is suitable for large, fast, high-altitude drones.',
    },
    {
      name: 'Pantsir-S1',
      type: 'Missile',
      effective_against: ['Tactical', 'Loitering', 'MALE'],
      range_km: 20,
      effectiveness: 'Medium',
      description: 'layered missile and gun coverage supports rapid responses to maneuvering drone threats.',
    },
    {
      name: 'SkyFence EW',
      type: 'Jamming',
      effective_against: ['Loitering', 'Tactical'],
      range_km: 4,
      effectiveness: 'Low',
      description: 'wide-area interference reduces guidance quality and weakens incoming attack waves.',
    },
  ];

  await Country.insertMany(countries);
  await Drone.insertMany(drones);
  await CounterSystem.insertMany(counterSystems);

  console.log('Database seeding complete.');
}

module.exports = seedDatabase;
