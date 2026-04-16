const mongoose = require('mongoose');

const droneSpecsSchema = new mongoose.Schema(
  {
    price_usd: { type: Number, default: 0 },
    range_km: { type: Number, default: 0 },
    endurance_hr: { type: Number, default: 0 },
    payload_kg: { type: Number, default: 0 },
    speed_kmh: { type: Number, default: 0 },
    maintenance_cost_per_hr: { type: Number, default: 0 },
  },
  { _id: false }
);

const droneSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, index: true },
  type: {
    type: String,
    enum: ['Nano', 'Tactical', 'MALE', 'HALE', 'Loitering', 'Swarm'],
    required: true,
  },
  specs: { type: droneSpecsSchema, required: true },
  description: { type: String, default: '' },
});

module.exports = mongoose.model('Drone', droneSchema);
