require('dotenv').config();
const mongoose = require('mongoose');
const Drone = require('./models/Drone');

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    console.log('Connected for tactical migration...');

    const tacticalUpdates = [
      {
        name: 'Black Hornet 3',
        specs: {
          detection_range_km: 1.5,
          communication_range_km: 2,
          weapon_range_km: 0,
          jamming_resistance: 'Low',
          stealth_level: 'High',
          sensor_type: 'EO/IR'
        }
      },
      {
        name: 'MQ-9 Reaper',
        specs: {
          detection_range_km: 120,
          communication_range_km: 1900,
          weapon_range_km: 14,
          jamming_resistance: 'High',
          stealth_level: 'Low',
          sensor_type: 'Radar'
        }
      },
      {
        name: 'Shahed 136',
        specs: {
          detection_range_km: 10,
          communication_range_km: 0,
          weapon_range_km: 2,
          jamming_resistance: 'Low',
          stealth_level: 'Medium',
          sensor_type: 'EO/IR'
        }
      },
      {
        name: 'Bayraktar TB2',
        specs: {
          detection_range_km: 50,
          communication_range_km: 300,
          weapon_range_km: 8,
          jamming_resistance: 'Medium',
          stealth_level: 'Medium',
          sensor_type: 'EO/IR'
        }
      },
      {
        name: 'Agribot',
        specs: {
          detection_range_km: 5,
          communication_range_km: 10,
          weapon_range_km: 0,
          jamming_resistance: 'Low',
          stealth_level: 'Low',
          sensor_type: 'EO/IR'
        }
      },
      {
        name: 'CH-4 Rainbow',
        specs: {
          detection_range_km: 80,
          communication_range_km: 250,
          weapon_range_km: 5,
          jamming_resistance: 'Medium',
          stealth_level: 'Medium',
          sensor_type: 'Radar'
        }
      }
    ];

    for (const update of tacticalUpdates) {
      const drone = await Drone.findOne({ name: update.name });
      if (drone) {
        // Merge with existing specs
        drone.specs = { ...drone.specs.toObject(), ...update.specs };
        await drone.save();
        console.log(`Updated tactical data for: ${update.name}`);
      }
    }

    // Update others with default values to ensure no nulls
    await Drone.updateMany(
      { "specs.sensor_type": { $exists: false } },
      { 
        $set: { 
          "specs.detection_range_km": 5,
          "specs.communication_range_km": 10,
          "specs.weapon_range_km": 0,
          "specs.jamming_resistance": 'Low',
          "specs.stealth_level": 'Low',
          "specs.sensor_type": 'EO/IR'
        }
      }
    );

    console.log('Tactical migration finished.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
