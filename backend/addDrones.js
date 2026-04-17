require('dotenv').config();
const mongoose = require('mongoose');
const Drone = require('./models/Drone');

async function importDrones() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('Connected to DB for import...');

    const newDrones = [
      { name: 'Drishti-10', country: 'India', type: 'MALE', specs: { price_usd: 14000000, range_km: 1000, endurance_hr: 36, payload_kg: 450, speed_kmh: 220, maintenance_cost_per_hr: 500 }, description: 'Strategic MALE drone by Adani/Elbit' },
      { name: 'Hermes 900 (India)', country: 'India', type: 'MALE', specs: { price_usd: 30000000, range_km: 1000, endurance_hr: 36, payload_kg: 350, speed_kmh: 250, maintenance_cost_per_hr: 800 }, description: 'Strategic MALE drone by Adani Defence' },
      { name: 'Archer-NG', country: 'India', type: 'MALE', specs: { price_usd: 12000000, range_km: 250, endurance_hr: 12, payload_kg: 300, speed_kmh: 200, maintenance_cost_per_hr: 450 }, description: 'Strategic UCAV by DRDO' },
      { name: 'ideaForge SWITCH', country: 'India', type: 'Tactical', specs: { price_usd: 125000, range_km: 15, endurance_hr: 2, payload_kg: 5, speed_kmh: 60, maintenance_cost_per_hr: 50 }, description: 'Tactical VTOL drone' },
      { name: 'A200-XT', country: 'India', type: 'Tactical', specs: { price_usd: 60000, range_km: 5, endurance_hr: 0.6, payload_kg: 0.5, speed_kmh: 45, maintenance_cost_per_hr: 20 }, description: 'Tactical surveillance drone by Asteria Aerospace' },
      { name: 'ideaForge NETRA', country: 'India', type: 'Tactical', specs: { price_usd: 65000, range_km: 10, endurance_hr: 1, payload_kg: 1, speed_kmh: 50, maintenance_cost_per_hr: 25 }, description: 'Tactical quadcopter' },
      { name: 'Zen Micro UAV', country: 'India', type: 'Tactical', specs: { price_usd: 25000, range_km: 5, endurance_hr: 0.75, payload_kg: 0.4, speed_kmh: 40, maintenance_cost_per_hr: 15 }, description: 'Micro tactical drone by Zen Technologies' },
      { name: 'AirTaxi (Cargo)', country: 'India', type: 'MALE', specs: { price_usd: 2500000, range_km: 50, endurance_hr: 1, payload_kg: 100, speed_kmh: 120, maintenance_cost_per_hr: 200 }, description: 'Heavy-lift logistics by ePlane Co' },
      { name: 'Heavy Lift VTOL', country: 'India', type: 'Tactical', specs: { price_usd: 18000, range_km: 20, endurance_hr: 0.6, payload_kg: 10, speed_kmh: 55, maintenance_cost_per_hr: 30 }, description: 'Logistics drone by Drones Tech Lab' },
      { name: 'Agribot', country: 'India', type: 'Tactical', specs: { price_usd: 10000, range_km: 5, endurance_hr: 0.3, payload_kg: 20, speed_kmh: 30, maintenance_cost_per_hr: 10 }, description: 'Agricultural / heavy lift by IoTechWorld' },
      { name: 'GA-AD', country: 'India', type: 'Tactical', specs: { price_usd: 12000, range_km: 10, endurance_hr: 0.5, payload_kg: 15, speed_kmh: 35, maintenance_cost_per_hr: 15 }, description: 'Logistics drone by Garuda Aerospace' }
    ];

    let addedCount = 0;
    
    for (const drone of newDrones) {
      const existing = await Drone.findOne({ name: drone.name });
      if (!existing) {
        await Drone.create(drone);
        console.log(`Added: ${drone.name}`);
        addedCount++;
      } else {
        console.log(`Skipped (already exists): ${drone.name}`);
      }
    }
    
    console.log(`Finished adding ${addedCount} drones.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

importDrones();
