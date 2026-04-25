const mongoose = require('mongoose');
const Drone = require('./models/Drone');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function seedTheoretical() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for theoretical seeding...');

    const antigravityModule = {
      name: 'Project Antigravity: Multi-Phase Propulsion Module',
      country: 'Classified (Black Site)',
      type: 'QUANTUM',
      description: 'A theoretical near-future propulsion system utilizing mass displacement and spacetime curvature. Features a blue-shifted quantum core and zero-point energy flux stabilizers.',
      image: '/drones/antigravity.png',
      model_url: '', // Currently no 3D model for theoretical platforms
      specs: {
        range_km: 15.8,           // Mapped to Lift Capacity (G-force)
        speed_kmh: 4.2,           // Mapped to Energy Flux (TW)
        endurance_hr: 500,        // Mapped to Field Radius (m)
        payload_kg: 99.9,         // Mapped to Stability (%)
        price_usd: 12000000000,   // $12B project cost
        maintenance_cost_per_hr: 850000
      }
    };

    // Check if it exists and update, or create
    const existing = await Drone.findOne({ name: antigravityModule.name });
    if (existing) {
      await Drone.findByIdAndUpdate(existing._id, antigravityModule);
      console.log('Updated existing Antigravity Module.');
    } else {
      await Drone.create(antigravityModule);
      console.log('Created new Antigravity Module.');
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedTheoretical();
