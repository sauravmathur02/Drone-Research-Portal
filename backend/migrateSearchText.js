require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Drone = require('./models/Drone');

async function migrate() {
  await connectDB();
  console.log('Connected to DB for migration...');

  const drones = await Drone.find();
  console.log(`Found ${drones.length} drones to process.`);

  for (const drone of drones) {
    const searchParts = [
      drone.name,
      drone.country,
      drone.type,
      drone.description,
      drone.specs?.sensor_type,
      drone.specs?.stealth_level,
      drone.specs?.jamming_resistance,
      `range ${drone.specs?.range_km || 0}km`,
      `speed ${drone.specs?.speed_kmh || 0}kmh`
    ].filter(Boolean);

    drone.searchText = searchParts.join(' ').toLowerCase();
    await drone.save();
    console.log(`Updated search text for: ${drone.name}`);
  }

  console.log('Migration complete. Disconnecting...');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
