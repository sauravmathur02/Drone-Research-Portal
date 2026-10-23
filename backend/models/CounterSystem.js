const mongoose = require('mongoose');

const counterSystemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: 'Interceptor' },
    manufacturer: { type: String, default: 'Defense Technology Division' },
    country: { type: String, default: 'International' },
    effective_against: [{ type: String }],
    range_km: { type: Number, default: 0 },
    rangeKm: { type: Number, default: 0 },
    effectiveness: { type: mongoose.Schema.Types.Mixed, default: 'High' },
    description: { type: String, default: '' },
    image: { type: String, default: '/counter/DroneHunter F700.png' },
    photo_url: { type: String, default: '' },
    model_url: { type: String, default: '' }
  },
  { timestamps: true }
);

counterSystemSchema.pre('save', function (next) {
  if (this.rangeKm && !this.range_km) this.range_km = this.rangeKm;
  if (this.range_km && !this.rangeKm) this.rangeKm = this.range_km;
  if (this.image && !this.photo_url) this.photo_url = this.image;
  if (this.photo_url && !this.image) this.image = this.photo_url;
  next();
});

module.exports = mongoose.model('CounterSystem', counterSystemSchema);
