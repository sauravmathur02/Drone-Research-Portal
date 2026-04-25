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
      { name: 'GA-AD', country: 'India', type: 'Tactical', specs: { price_usd: 12000, range_km: 10, endurance_hr: 0.5, payload_kg: 15, speed_kmh: 35, maintenance_cost_per_hr: 15 }, description: 'Logistics drone by Garuda Aerospace' },
      { name: 'MQ-9 Reaper', country: 'USA', type: 'MALE', specs: { price_usd: 32000000, range_km: 1850, endurance_hr: 24, payload_kg: 1700, speed_kmh: 480, stealth_level: 'Low' }, description: 'Long-endurance unmanned aerial vehicle (UAV) used by USA for surveillance and precision strike missions.' },
      { name: 'MQ-1 Predator', country: 'USA', type: 'MALE', specs: { price_usd: 4500000, range_km: 1250, endurance_hr: 24, payload_kg: 204, speed_kmh: 217, stealth_level: 'Low' }, description: 'American medium-altitude long-endurance UAV used for reconnaissance and armed missions.' },
      { name: 'RQ-4 Global Hawk', country: 'USA', type: 'HALE', specs: { price_usd: 220000000, range_km: 22796, endurance_hr: 34, payload_kg: 1360, speed_kmh: 574, stealth_level: 'Low' }, description: 'American high-altitude, long-endurance UAV for strategic reconnaissance missions.' },
      { name: 'RQ-170 Sentinel', country: 'USA', type: 'UCAV', specs: { price_usd: 100000000, range_km: null, endurance_hr: 6, payload_kg: null, speed_kmh: null, stealth_level: 'High' }, description: 'Stealth unmanned aerial vehicle developed by the USA for reconnaissance missions.' },
      { name: 'MQ-8 Fire Scout', country: 'USA', type: 'Tactical', specs: { price_usd: 20000000, range_km: 278, endurance_hr: 12, payload_kg: 317, speed_kmh: 250, stealth_level: 'Low' }, description: 'American unmanned helicopter (tactical UAV) used for naval reconnaissance and surveillance.' },
      { name: 'RQ-7 Shadow', country: 'USA', type: 'Tactical', specs: { price_usd: 1000000, range_km: 125, endurance_hr: 8, payload_kg: 43, speed_kmh: null, stealth_level: 'Low' }, description: 'American tactical UAV used for battlefield surveillance and reconnaissance.' },
      { name: 'Switchblade 300', country: 'USA', type: 'Loitering', specs: { price_usd: 60000, range_km: 30, endurance_hr: 0.33, payload_kg: 1.68, speed_kmh: 161, stealth_level: 'Low' }, description: 'American portable loitering munition (kamikaze drone) for precision strikes.' },
      { name: 'MQ-4C Triton', country: 'USA', type: 'HALE', specs: { price_usd: 165000000, range_km: 15200, endurance_hr: 30, payload_kg: null, speed_kmh: 575, stealth_level: 'Low' }, description: 'American HALE UAV for persistent maritime surveillance.' },
      { name: 'Wing Loong II', country: 'China', type: 'MALE', specs: { price_usd: 4500000, range_km: 4000, endurance_hr: 32, payload_kg: 480, speed_kmh: 370, stealth_level: 'Low' }, description: 'Chinese medium-altitude long-endurance unmanned combat aerial vehicle with strike capability.' },
      { name: 'Wing Loong I', country: 'China', type: 'MALE', specs: { price_usd: 2500000, range_km: 4000, endurance_hr: 20, payload_kg: 1000, speed_kmh: 280, stealth_level: 'Low' }, description: 'Chinese medium-altitude long-endurance UAV used for surveillance and strike missions.' },
      { name: 'CH-4 Rainbow', country: 'China', type: 'MALE', specs: { price_usd: 4000000, range_km: 2750, endurance_hr: 30, payload_kg: 345, speed_kmh: 350, stealth_level: 'Low' }, description: 'Chinese medium-altitude long-endurance UAV used for reconnaissance and strike.' },
      { name: 'CH-5 Rainbow', country: 'China', type: 'MALE', specs: { price_usd: 8000000, range_km: 10000, endurance_hr: 60, payload_kg: 1000, speed_kmh: 480, stealth_level: 'Low' }, description: 'Chinese heavy MALE UAV for long-range surveillance and strike missions.' },
      { name: 'WZ-7 Soar Dragon', country: 'China', type: 'HALE', specs: { price_usd: 100000000, range_km: 7000, endurance_hr: 10, payload_kg: null, speed_kmh: 750, stealth_level: 'Low' }, description: 'Chinese high-altitude long-endurance UAV for strategic reconnaissance.' },
      { name: 'Orion (Inokhodets)', country: 'Russia', type: 'MALE', specs: { price_usd: 15000000, range_km: 1440, endurance_hr: 24, payload_kg: 250, speed_kmh: 200, stealth_level: 'Low' }, description: 'Russian medium-altitude long-endurance UAV for surveillance and attack missions.' },
      { name: 'Forpost R', country: 'Russia', type: 'MALE', specs: { price_usd: 9000000, range_km: 350, endurance_hr: 18, payload_kg: null, speed_kmh: null, stealth_level: 'Low' }, description: 'Russian license-built MALE UAV (IAI Heron variant) for reconnaissance.' },
      { name: 'S-70 Okhotnik (Hunter)', country: 'Russia', type: 'UCAV', specs: { price_usd: 500000000, range_km: 6000, endurance_hr: 10, payload_kg: 2000, speed_kmh: 1000, stealth_level: 'High' }, description: 'Russian stealth heavy unmanned combat aerial vehicle for strike missions.' },
      { name: 'Orlan-10', country: 'Russia', type: 'Tactical', specs: { price_usd: 150000, range_km: 600, endurance_hr: 16, payload_kg: 6, speed_kmh: 150, stealth_level: 'Low' }, description: 'Russian tactical UAV used for battlefield reconnaissance.' },
      { name: 'Lancet-1', country: 'Russia', type: 'Loitering', specs: { price_usd: 40000, range_km: 40, endurance_hr: 0.5, payload_kg: 1, speed_kmh: 110, stealth_level: 'Low' }, description: 'Russian small loitering munition for kamikaze strikes.' },
      { name: 'Heron', country: 'Israel', type: 'MALE', specs: { price_usd: 2500000, range_km: 1000, endurance_hr: 52, payload_kg: 250, speed_kmh: 207, stealth_level: 'Low' }, description: 'Israeli medium-altitude long-endurance UAV for surveillance missions.' },
      { name: 'TAPAS Rustom-II', country: 'India', type: 'MALE', specs: { price_usd: 12000000, range_km: 1000, endurance_hr: 24, payload_kg: 350, speed_kmh: 250, stealth_level: 'Low' }, description: 'Indian medium-altitude long-endurance UAV for surveillance and strike.' },
      { name: 'Harop', country: 'Israel', type: 'Loitering', specs: { price_usd: 300000, range_km: 200, endurance_hr: 6, payload_kg: 16, speed_kmh: 417, stealth_level: 'Low' }, description: 'Israeli loitering munition for precision strike missions.' },
      { name: 'Switch UAV', country: 'India', type: 'Tactical', specs: { price_usd: 350000, range_km: 15, endurance_hr: 2, payload_kg: 7, speed_kmh: 47, stealth_level: 'Low' }, description: 'Indian VTOL hybrid UAV for surveillance and reconnaissance.' },
      { name: 'Nishant', country: 'India', type: 'Tactical', specs: { price_usd: 250000, range_km: 100, endurance_hr: 4.5, payload_kg: 45, speed_kmh: 216, stealth_level: 'Low' }, description: 'Indian battlefield UAV for reconnaissance and surveillance.' },
      { name: 'Hermes 450', country: 'Israel', type: 'Tactical', specs: { price_usd: 3000000, range_km: 300, endurance_hr: 17, payload_kg: 180, speed_kmh: 176, stealth_level: 'Low' }, description: 'Israeli tactical UAV for surveillance and reconnaissance missions.' },
      { name: 'Hermes 900', country: 'Israel', type: 'MALE', specs: { price_usd: 12000000, range_km: null, endurance_hr: 36, payload_kg: 350, speed_kmh: 220, stealth_level: 'Low' }, description: 'Israeli MALE UAV for long-endurance surveillance and target acquisition.' },
      { name: 'Skylark I', country: 'Israel', type: 'Tactical', specs: { price_usd: 60000, range_km: 40, endurance_hr: 3, payload_kg: 5, speed_kmh: 60, stealth_level: 'Low' }, description: 'Israeli small tactical UAV for short-range reconnaissance missions.' },
      { name: 'Eitan (Heron TP)', country: 'Israel', type: 'MALE', specs: { price_usd: 80000000, range_km: 7400, endurance_hr: 30, payload_kg: 2700, speed_kmh: 407, stealth_level: 'Low' }, description: 'Israeli advanced MALE UAV designed for extended range and high-payload missions.' }
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
