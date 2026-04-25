require('dotenv').config();
const mongoose = require('mongoose');
const Drone = require('./models/Drone');

async function updateModels() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const updates = [
      { name: 'Black Hornet 3', url: '/models/black_hornet_drone.glb' },
      { name: 'MQ-9 Reaper', url: '/models/mq-9_reaper.glb' },
      { name: 'Shahed 136', url: '/models/shahed-136.glb' },
      { name: 'Bayraktar TB2', url: '/models/ukrainian_bayraktar_tb2.glb' },
      { name: 'Agribot', url: '/models/Meshy_AI_Agribot_Explorer_0417165355_texture.glb' }
    ];

    for (const update of updates) {
      await Drone.updateOne({ name: update.name }, { $set: { model_url: update.url } });
      console.log(`Updated ${update.name}`);
    }

    console.log('Update complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateModels();
