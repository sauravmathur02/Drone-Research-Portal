const mongoose = require('mongoose');

const counterSystemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['Laser', 'Jamming', 'Missile', 'Interceptor'],
    required: true,
  },
  effective_against: [{ type: String, required: true }],
  range_km: { type: Number, default: 0 },
  effectiveness: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  description: { type: String, default: '' },
  photo_url: { type: String, default: '' },
  model_url: { type: String, default: '' },
});

module.exports = mongoose.model('CounterSystem', counterSystemSchema);
