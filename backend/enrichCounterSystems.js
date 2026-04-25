require('dotenv').config();
const mongoose = require('mongoose');
const CounterSystem = require('./models/CounterSystem');

/**
 * Enriches existing counter-systems with tactical intelligence attributes.
 * Values are based on real-world system capabilities.
 */
const TACTICAL_DATA = {
  // Laser systems: Multi-sensor, AI-guided, fast reaction
  'Iron Beam': { sensor_type: 'Multi-sensor', tracking_type: 'AI-guided', fire_control: 'Networked', reaction_time_sec: 3, simultaneous_targets: 2 },
  'ATHENA': { sensor_type: 'Multi-sensor', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 4, simultaneous_targets: 1 },
  'DragonFire': { sensor_type: 'IR', tracking_type: 'AI-guided', fire_control: 'Networked', reaction_time_sec: 3, simultaneous_targets: 1 },

  // Jamming/EW: Electronic warfare sensors
  'KORAL': { sensor_type: 'EW', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 2, simultaneous_targets: 8 },
  'Krasukha-4': { sensor_type: 'EW', tracking_type: 'Fully-auto', fire_control: 'Networked', reaction_time_sec: 2, simultaneous_targets: 10 },

  // Missile systems: Radar-guided, semi-auto to fully-auto
  'Pantsir-S1': { sensor_type: 'Multi-sensor', tracking_type: 'Fully-auto', fire_control: 'Networked', reaction_time_sec: 5, simultaneous_targets: 4 },
  'Iron Dome': { sensor_type: 'Radar', tracking_type: 'AI-guided', fire_control: 'Networked', reaction_time_sec: 4, simultaneous_targets: 6 },
  'NASAMS': { sensor_type: 'Radar', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 6, simultaneous_targets: 3 },
  'Tor-M2': { sensor_type: 'Radar', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 7, simultaneous_targets: 4 },

  // Interceptor drones / kinetic
  'Drone Dome': { sensor_type: 'Multi-sensor', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 5, simultaneous_targets: 3 },
  'SkyWall': { sensor_type: 'Optical', tracking_type: 'Semi-auto', fire_control: 'Basic', reaction_time_sec: 8, simultaneous_targets: 1 },
};

async function enrich() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dronescope');
    console.log('Connected to DB...');

    const counters = await CounterSystem.find();
    let updated = 0;

    for (const counter of counters) {
      const data = TACTICAL_DATA[counter.name];
      if (data) {
        await CounterSystem.findByIdAndUpdate(counter._id, data);
        console.log(`  ✓ ${counter.name}: ${JSON.stringify(data)}`);
        updated++;
      } else {
        // Apply reasonable defaults based on type
        const defaults = {
          Laser: { sensor_type: 'IR', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 4, simultaneous_targets: 1 },
          Jamming: { sensor_type: 'EW', tracking_type: 'Fully-auto', fire_control: 'Advanced', reaction_time_sec: 3, simultaneous_targets: 5 },
          Missile: { sensor_type: 'Radar', tracking_type: 'Semi-auto', fire_control: 'Basic', reaction_time_sec: 8, simultaneous_targets: 2 },
          Interceptor: { sensor_type: 'Optical', tracking_type: 'Semi-auto', fire_control: 'Basic', reaction_time_sec: 10, simultaneous_targets: 1 },
        };
        const d = defaults[counter.type] || defaults.Missile;
        await CounterSystem.findByIdAndUpdate(counter._id, d);
        console.log(`  ~ ${counter.name} (default for ${counter.type}): ${JSON.stringify(d)}`);
        updated++;
      }
    }

    console.log(`\nEnriched ${updated}/${counters.length} counter-systems.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

enrich();
