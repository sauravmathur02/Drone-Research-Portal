const mongoose = require('mongoose');
require('dotenv').config();
const Country = require('./models/Country');

async function seedBases() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dronescope');
    console.log('Connected to DB...');

    const updates = [
      { name: 'China', bases: [{ name: 'Fuzhou Airbase', lat: 26.07, lng: 119.3 }, { name: 'Kashgar Command', lat: 39.46, lng: 75.98 }] },
      { name: 'Russia', bases: [{ name: 'Crimea Fleet', lat: 44.6, lng: 33.5 }, { name: 'Engels Airbase', lat: 51.48, lng: 46.21 }] },
      { name: 'USA', bases: [{ name: 'Nellis AFB', lat: 36.23, lng: -115.03 }, { name: 'Ramstein HQ', lat: 49.43, lng: 7.58 }] },
      { name: 'Iran', bases: [{ name: 'Kashan UAV Center', lat: 33.9, lng: 51.4 }] },
      { name: 'Israel', bases: [{ name: 'Palmachim Airbase', lat: 31.89, lng: 34.69 }] },
    ];

    for (const item of updates) {
      await Country.findOneAndUpdate(
        { name: item.name },
        { strategic_bases: item.bases }
      );
      console.log(`Updated ${item.name} with ${item.bases.length} bases.`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedBases();
