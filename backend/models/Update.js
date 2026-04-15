const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  source: { type: String, required: true, trim: true },
  summary: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now, index: true },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
  },
  country: { type: String, default: '', trim: true },
  category: { type: String, default: '', trim: true },
  link: { type: String, default: '', trim: true },
  external_id: { type: String, default: '', trim: true, index: true },
  provider: { type: String, default: '', trim: true },
  ingested_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Update', updateSchema);
