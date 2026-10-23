const mongoose = require('mongoose');

const DroneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    manufacturer: { type: String, default: 'Unknown Manufacturer', index: true },
    country: { type: String, required: true, index: true },
    countryCode: { type: String, default: 'UN' },
    category: {
      type: String,
      enum: [
        'Academic & Research',
        'Commercial & Photography',
        'Agricultural',
        'Urban Air Mobility (eVTOL)',
        'Heavy Lift & Logistics',
        'Micro / Nano UAV',
        'MALE / HALE Surveillance',
        'Tactical / Loitering',
        'Autonomous Swarm',
        'Experimental'
      ],
      default: 'Commercial & Photography',
      index: true
    },
    role: { type: String, required: true },
    introducedYear: { type: Number, index: true },
    status: {
      type: String,
      enum: ['Active', 'Prototype', 'In Development', 'Retired', 'Concept'],
      default: 'Active'
    },
    image: { type: String, default: '/drones/default.jpg' },
    specifications: {
      maxSpeedKmh: { type: Number, default: 0 },
      rangeKm: { type: Number, default: 0 },
      enduranceHours: { type: Number, default: 0 },
      serviceCeilingM: { type: Number, default: 0 },
      maxTakeoffWeightKg: { type: Number, default: 0 },
      payloadCapacityKg: { type: Number, default: 0 },
      wingspanOrDiameterM: { type: Number, default: 0 },
      propulsionType: {
        type: String,
        enum: ['Electric Brushless', 'LiPo Multirotor', 'Turboprop', 'Turbofan', 'Piston Engine', 'Hybrid-Electric', 'Hydrogen Fuel Cell', 'Solar-Electric'],
        default: 'Electric Brushless'
      },
      autonomyLevel: {
        type: String,
        enum: ['Manual RC', 'GPS Waypoint', 'Obstacle Avoidance', 'Full Autonomous SLAM', 'AI Swarm Collaborative'],
        default: 'GPS Waypoint'
      }
    },
    academicNotes: {
      aerodynamicProfile: { type: String, default: '' },
      controlArchitecture: { type: String, default: '' },
      sensorSuite: [{ type: String }],
      learningTakeaways: [{ type: String }]
    },
    description: { type: String, required: true },
    searchText: { type: String, index: 'text' },
    automationMeta: {
      source: { type: String, enum: ['Manual', 'Wikidata-Sync', 'AI-News-Discovery'], default: 'Manual' },
      wikidataId: { type: String, sparse: true },
      sourceUrl: { type: String },
      confidenceScore: { type: Number, default: 1.0 },
      lastSyncedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

// Automatically build slug and searchText before validation and saving
DroneSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  this.searchText = [
    this.name,
    this.manufacturer,
    this.country,
    this.category,
    this.role,
    this.description,
    this.specifications?.propulsionType,
    this.academicNotes?.aerodynamicProfile,
    ...(this.academicNotes?.sensorSuite || [])
  ]
    .filter(Boolean)
    .join(' ');
  next();
});

module.exports = mongoose.model('Drone', DroneSchema);
