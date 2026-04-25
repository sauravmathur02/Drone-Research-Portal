/**
 * migrateCounterAssets.js
 * Populates photo_url and model_url for each CounterSystem in the DB.
 * Run once: node migrateCounterAssets.js
 *
 * Photos must be in:  frontend/public/counter/<filename>
 * Models  must be in: frontend/public/counter/model/<filename>
 *
 * File naming convention: "<SystemName><number>.<ext>"
 * e.g. "Pantsir-S11.jpg"  →  /counter/Pantsir-S11.jpg
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CounterSystem = require('./models/CounterSystem');

// Map DB system names  →  { photo_url, model_url }
// Adjust names to exactly match what is stored in MongoDB.
const ASSET_MAP = {
  'Pantsir-S1': {
    photo_url: '/counter/Pantsir-S11.jpg',
    model_url:  '/models/pantsir-s1.glb',
  },
  'Iron Beam': {
    photo_url: '/counter/Iron Beam1.jpg',
    model_url:  '',
  },
  'DroneHunter F700': {
    photo_url: '/counter/DroneHunter F700.png',
    model_url:  '',
  },
  'Patriot PAC-3': {
    photo_url: '/counter/Patriot PAC-31.jpg',
    model_url:  '',
  },
  'SkyFence EW': {
    photo_url: '/counter/SkyFence EW1.jpg',
    model_url:  '',
  },
  'Titan C-UAS': {
    photo_url: '/counter/Titan C-UAS1.jpg',
    model_url:  '',
  },
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let updated = 0;
    let skipped = 0;

    for (const [name, assets] of Object.entries(ASSET_MAP)) {
      const result = await CounterSystem.updateOne(
        { name },
        { $set: assets }
      );

      if (result.matchedCount === 0) {
        console.warn(`⚠️  No system found with name: "${name}"`);
        skipped++;
      } else {
        console.log(`✅  Updated "${name}"`);
        updated++;
      }
    }

    const allSystems = await CounterSystem.find({}, 'name photo_url model_url');
    console.log('\n--- All Counter Systems ---');
    allSystems.forEach(s => {
      console.log(`  ${s.name}  |  photo: ${s.photo_url || '(none)'}  |  model: ${s.model_url || '(none)'}`);
    });

    console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
