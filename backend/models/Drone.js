const mongoose = require('mongoose');

const droneSpecsSchema = new mongoose.Schema(
  {
    price_usd: { type: Number, default: 0 },
    range_km: { type: Number, default: 0 },
    endurance_hr: { type: Number, default: 0 },
    payload_kg: { type: Number, default: 0 },
    speed_kmh: { type: Number, default: 0 },
    maintenance_cost_per_hr: { type: Number, default: 0 },
    detection_range_km: { type: Number, default: 0 },
    communication_range_km: { type: Number, default: 0 },
    weapon_range_km: { type: Number, default: 0 },
    jamming_resistance: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    stealth_level: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    sensor_type: { type: String, enum: ['EO/IR', 'Radar', 'Multi-spectral'], default: 'EO/IR' },
  },
  { _id: false }
);

const droneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    enum: ['Nano', 'Tactical', 'MALE', 'HALE', 'UCAV', 'Loitering', 'Swarm', 'QUANTUM'],
    required: true,
  },
  specs: { type: droneSpecsSchema, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '/images/default-drone.jpg' },
  model_url: { type: String, default: '' },
  searchText: { type: String, default: '', index: true },
});

module.exports = mongoose.model('Drone', droneSchema);
