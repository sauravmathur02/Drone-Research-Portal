const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: 'Automated Discovery' },
    sourceName: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    summary: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
    publishedAt: { type: Date, default: Date.now },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    country: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    external_id: { type: String, default: '', trim: true, index: true },
    provider: { type: String, default: '', trim: true },
    relatedDrone: { type: mongoose.Schema.Types.ObjectId, ref: 'Drone' },
    ingested_at: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Update', updateSchema);
