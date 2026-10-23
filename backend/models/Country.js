const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    region: { type: String, default: 'Global' },
    drone_count: { type: Number, default: 0 },
    droneCount: { type: Number, default: 0 },
    specialization: { type: String, default: '' },
    top_drones: [{ type: String }],
    leadingManufacturers: [{ type: String }],
    keyTestCenters: [{ type: String }],
    regulatoryBody: { type: String, default: 'National Aviation Authority' },
    summary: { type: String, default: '' },
    lat: Number,
    lng: Number,
    growth_rate: { type: Number, default: 0 }
  },
  { timestamps: true }
);

countrySchema.pre('save', function (next) {
  if (this.droneCount && !this.drone_count) this.drone_count = this.droneCount;
  if (this.drone_count && !this.droneCount) this.droneCount = this.drone_count;
  next();
});

module.exports = mongoose.model('Country', countrySchema);
