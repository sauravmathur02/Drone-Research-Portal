const mongoose = require('mongoose');
const { buildDroneSearchText } = require('../utils/droneSearchText');

const DroneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    slug: { type: String, lowercase: true, index: true },
    manufacturer: { type: String, default: 'Unknown Manufacturer', index: true },
    country: { type: String, required: true, index: true },
    origin: { type: String, index: true }, // Backward compatibility with original repo scripts
    countryCode: { type: String, default: 'UN' },
    type: { type: String, index: true }, // Original repo field (e.g., 'MALE UCAV', 'Loitering Munition', 'Quadcopter')
    category: {
      type: String,
      default: 'Tactical / Multi-Role',
      index: true
    },
    role: { type: String, default: 'Multi-Role Unmanned Aerial System' },
    year: { type: Number, index: true }, // Original repo field
    introducedYear: { type: Number, index: true },
    status: {
      type: String,
      default: 'Active',
      index: true
    },
    isTheoretical: { type: Boolean, default: false, index: true }, // Used by seedTheoretical.js
    image: { type: String, default: '/drones/default.jpg' },
    imageUrl: { type: String, default: '/drones/default.jpg' }, // Used by migrateImages.js

    // Original specs object + normalized numeric specifications
    specs: {
      speed: { type: String, default: 'N/A' },
      range: { type: String, default: 'N/A' },
      endurance: { type: String, default: 'N/A' },
      ceiling: { type: String, default: 'N/A' },
      payload: { type: String, default: 'N/A' },
      wingspan: { type: String, default: 'N/A' },
      weight: { type: String, default: 'N/A' },
      propulsion: { type: String, default: 'Electric / Turboprop' }
    },
    specifications: {
      maxSpeedKmh: { type: Number, default: 0 },
      rangeKm: { type: Number, default: 0 },
      enduranceHours: { type: Number, default: 0 },
      serviceCeilingM: { type: Number, default: 0 },
      maxTakeoffWeightKg: { type: Number, default: 0 },
      payloadCapacityKg: { type: Number, default: 0 },
      wingspanOrDiameterM: { type: Number, default: 0 },
      propulsionType: { type: String, default: 'Electric Brushless' },
      autonomyLevel: { type: String, default: 'GPS Waypoint' }
    },

    // Preserved for migrateTacticalData.js & simulation.js
    tacticalData: {
      rcs: { type: String, default: '0.1 m²' }, // Radar Cross Section
      radarCrossSectionM2: { type: Number, default: 0.1 },
      thermalSignature: { type: String, default: 'Low' },
      acousticSignature: { type: String, default: 'Moderate' },
      ewResilience: { type: Number, default: 70 }, // 0-100 scale
      swarmCapable: { type: Boolean, default: false },
      communicationLinks: [{ type: String }],
      vulnerabilities: [{ type: String }],
      recommendedCounters: [{ type: String }]
    },

    // Academic & Engineering Education Module
    academicNotes: {
      aerodynamicProfile: { type: String, default: 'High-efficiency composite airframe' },
      controlArchitecture: { type: String, default: 'Redundant EKF sensor-fusion flight controller' },
      sensorSuite: [{ type: String }],
      flightPhysicsFormula: { type: String, default: 'L = 0.5 * rho * v^2 * S * C_L' },
      learningTakeaways: [{ type: String }],
      referencePapers: [
        {
          title: { type: String },
          url: { type: String },
          year: { type: Number }
        }
      ]
    },

    description: { type: String, required: true },
    searchText: { type: String, index: 'text' },

    // Automated Discovery & Verification Pipeline Metadata
    automationMeta: {
      source: {
        type: String,
        enum: ['Manual', 'Seed-Core', 'Wikidata-SPARQL', 'AI-RSS-Discovery', 'ArXiv-Academic'],
        default: 'Seed-Core'
      },
      wikidataId: { type: String, sparse: true },
      sourceUrl: { type: String },
      confidenceScore: { type: Number, default: 1.0 },
      lastSyncedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

function synchronizeDroneFields(doc) {
  if (doc.name && !doc.slug) {
    doc.slug = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  if (!doc.origin && doc.country) doc.origin = doc.country;
  if (!doc.country && doc.origin) doc.country = doc.origin;
  if (!doc.year && doc.introducedYear) doc.year = doc.introducedYear;
  if (!doc.introducedYear && doc.year) doc.introducedYear = doc.year;
  if (!doc.type && doc.category) doc.type = doc.category;
  if (doc.image && (!doc.imageUrl || doc.imageUrl === '/drones/default.jpg')) {
    doc.imageUrl = doc.image;
  }

  // Sync human-readable specs with numeric specifications
  if (doc.specifications) {
    if (doc.specifications.maxSpeedKmh && (!doc.specs || doc.specs.speed === 'N/A')) {
      doc.specs = doc.specs || {};
      doc.specs.speed = `${doc.specifications.maxSpeedKmh} km/h`;
    }
    if (doc.specifications.rangeKm && (!doc.specs || doc.specs.range === 'N/A')) {
      doc.specs = doc.specs || {};
      doc.specs.range = `${doc.specifications.rangeKm} km`;
    }
    if (doc.specifications.enduranceHours && (!doc.specs || doc.specs.endurance === 'N/A')) {
      doc.specs = doc.specs || {};
      doc.specs.endurance = `${doc.specifications.enduranceHours} hrs`;
    }
  }

  // Use your repo's droneSearchText utility if present, otherwise fallback
  try {
    if (typeof buildDroneSearchText === 'function') {
      doc.searchText = buildDroneSearchText(doc);
    } else {
      throw new Error('Fallback');
    }
  } catch (_) {
    doc.searchText = [
      doc.name,
      doc.manufacturer,
      doc.country,
      doc.category,
      doc.type,
      doc.role,
      doc.description,
      doc.specifications?.propulsionType,
      doc.academicNotes?.aerodynamicProfile,
      ...(doc.academicNotes?.sensorSuite || []),
      ...(doc.tacticalData?.recommendedCounters || [])
    ]
      .filter(Boolean)
      .join(' ');
  }
}

// Keep legacy and new fields synchronized automatically before validate and save
DroneSchema.pre('validate', function (next) {
  synchronizeDroneFields(this);
  if (typeof next === 'function') next();
});

DroneSchema.pre('save', function (next) {
  synchronizeDroneFields(this);
  if (typeof next === 'function') next();
});

module.exports = mongoose.model('Drone', DroneSchema);
