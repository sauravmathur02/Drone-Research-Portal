const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, unique: true },
  drone_count: { type: Number, default: 0 },
  specialization: { type: String, default: '' },
  top_drones: [{ type: String }],
  lat: Number,
  lng: Number,
  growth_rate: { type: Number, default: 0 },
});

module.exports = mongoose.model('Country', countrySchema);
