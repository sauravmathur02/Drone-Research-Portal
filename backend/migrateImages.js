require('dotenv').config();
const mongoose = require('mongoose');
const Drone = require('./models/Drone');

const imageMap = {
  'A200-XT': '/drones/a200xt.jpg',
  'Agribot': '/drones/agribot.png',
  'AirTaxi (Cargo)': '/drones/airtaxi.jpg',
  'Archer-NG': '/drones/archerng.jpg',
  'Bayraktar TB2': '/drones/tb2.png',
  'Black Hornet 3': '/drones/blackhornet.png',
  'CH-4 Rainbow': '/drones/ch4.jpg',
  'Drishti-10': '/drones/drishti10.jpg',
  'GA-AD': '/drones/gaad.jpg',
  'Heavy Lift VTOL': '/drones/heavylift.jpg',
  'Hermes 900 (India)': '/drones/hermes900.jpg',
  'Hero-120': '/drones/hero120.jpg',
  'MQ-9 Reaper': '/drones/mq9.jpg',
  'Shahed 136': '/drones/shahed136.jpg',
  'Swarm Variant X': '/drones/swarmx.jpg',
  'Tapas BH-201': '/drones/tapas.jpg',
  'Zen Micro UAV': '/drones/zenmicro.jpg',
  'ideaForge NETRA': '/drones/netra.png',
  'ideaForge SWITCH': '/drones/switch.png'
};

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    const drones = await Drone.find({});
    console.log(`Found ${drones.length} drones.`);

    let updatedCount = 0;
    for (const drone of drones) {
      if (imageMap[drone.name]) {
        drone.photo_url = imageMap[drone.name];
        await drone.save();
        updatedCount++;
        console.log(`Updated: ${drone.name} -> ${drone.photo_url}`);
      } else {
        console.log(`No image mapping found for: ${drone.name}`);
        drone.photo_url = '/drones/default.jpg';
        await drone.save();
        updatedCount++;
      }
    }

    console.log(`Successfully migrated ${updatedCount} drone images.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
