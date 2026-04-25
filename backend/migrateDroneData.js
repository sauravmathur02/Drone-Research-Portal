require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Drone = require('./models/Drone');

async function migrate() {
  await connectDB();
  console.log('Connected to DB for migration...');

  try {
    const drones = await Drone.find();
    console.log(`Found ${drones.length} drones to check.`);

    for (const drone of drones) {
      let updated = false;

      // WISE RECOVERY: Prioritize existing photo_url over default image
      const hasRealPhoto = drone._doc.photo_url && drone._doc.photo_url !== '/images/default-drone.jpg';
      const imageIsDefault = !drone.image || drone.image === '/images/default-drone.jpg';

      if (hasRealPhoto && imageIsDefault) {
        drone.image = drone._doc.photo_url;
        updated = true;
        console.log(`Restoring real photo for ${drone.name}: ${drone.image}`);
      }

      // Final fallback for missing image
      if (!drone.image) {
        drone.image = '/images/default-drone.jpg';
        updated = true;
      }

      if (updated) {
        // We use updateOne to avoid schema validation errors if photo_url is no longer in schema
        await Drone.updateOne(
          { _id: drone._id },
          { 
            $set: { image: drone.image },
            $unset: { photo_url: "" }
          }
        );
        console.log(`Updated drone: ${drone.name}`);
      }
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

migrate();
