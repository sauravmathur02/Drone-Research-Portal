const Drone = require('../models/Drone');
const CounterSystem = require('../models/CounterSystem');
const Country = require('../models/Country');
const History = require('../models/History');
const Update = require('../models/Update');
const simulationUtil = require('../utils/simulation');
const discoveryService = require('../services/newsUpdateService');

let tfidfSearch = null;
try {
  tfidfSearch = require('../utils/droneTfidfSearch');
} catch (_) {}

// 1. GET /api/drones (Supports TF-IDF ranking, theoretical filter, country, category)
exports.getDrones = async (req, res) => {
  try {
    const { search, category, country, status, isTheoretical, source, sort = '-introducedYear' } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.$or = [{ category }, { type: category }];
    }
    if (country && country !== 'All') {
      filter.$or = [{ country }, { origin: country }];
    }
    if (status && status !== 'All') filter.status = status;
    if (isTheoretical !== undefined && isTheoretical !== 'All') {
      filter.isTheoretical = isTheoretical === 'true';
    }
    if (source && source !== 'All') {
      filter['automationMeta.source'] = source;
    }

    let drones = await Drone.find(filter).sort(sort).lean();

    // Use your repo's TF-IDF Search Engine when a search query is provided
    if (search && search.trim()) {
      if (tfidfSearch && typeof tfidfSearch.searchDrones === 'function') {
        const ranked = await tfidfSearch.searchDrones(search.trim(), drones);
        if (Array.isArray(ranked) && ranked.length > 0) {
          drones = ranked;
        }
      } else {
        const regex = new RegExp(search.trim(), 'i');
        drones = drones.filter(
          (d) =>
            regex.test(d.name) ||
            regex.test(d.manufacturer) ||
            regex.test(d.country) ||
            regex.test(d.role) ||
            regex.test(d.description) ||
            regex.test(d.searchText)
        );
      }
    }

    const [totalDrones, autoDiscoveredCount, countriesList, counterSystemsCount, theoreticalCount] =
      await Promise.all([
        Drone.countDocuments(),
        Drone.countDocuments({ 'automationMeta.source': { $nin: ['Manual', 'Seed-Core'] } }),
        Drone.distinct('country'),
        CounterSystem.countDocuments().catch(() => 0),
        Drone.countDocuments({ isTheoretical: true })
      ]);

    res.json({
      drones,
      stats: {
        totalDrones,
        autoDiscoveredCount,
        countriesCount: countriesList.length,
        counterSystemsCount,
        theoreticalCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. GET /api/drones/:id
exports.getDroneById = async (req, res) => {
  try {
    const drone = await Drone.findOne({
      $or: [
        ...(req.params.id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: req.params.id }] : []),
        { slug: req.params.id.toLowerCase() },
        { name: new RegExp(`^${req.params.id}$`, 'i') }
      ]
    });
    if (!drone) return res.status(404).json({ error: 'Drone not found' });
    res.json(drone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. GET /api/counter-systems (Restores CounterSystem.js + public/counter/ images)
exports.getCounterSystems = async (req, res) => {
  try {
    const systems = await CounterSystem.find().sort('name').lean();
    res.json({ counterSystems: systems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. GET /api/countries (Restores Country.js + seedBases.js geo-intelligence)
exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort('name').lean();
    res.json({ countries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. GET /api/history (Restores History.js timeline)
exports.getHistory = async (req, res) => {
  try {
    const events = await History.find({ year: { $exists: true } }).sort('year').lean();
    res.json({ history: events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. POST /api/simulate (Supports both Tactical Counter-UAS Engagement & Academic Flight Physics)
exports.runSimulation = async (req, res) => {
  try {
    const { mode = 'flight_physics', droneId, counterSystemId, weather, terrain, ...physicsParams } = req.body;

    if (mode === 'engagement' && droneId && counterSystemId) {
      const [drone, counter] = await Promise.all([
        Drone.findById(droneId).lean(),
        CounterSystem.findById(counterSystemId).lean()
      ]);
      const result = simulationUtil.simulateEngagement(drone, counter, { weather, terrain });
      return res.json(result);
    }

    const physicsResult = simulationUtil.calculateFlightPhysics(physicsParams);
    res.json(physicsResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// 7. POST /api/automation/sync (Triggers Wikidata + ArXiv Academic + Global RSS Drone Discovery)
exports.triggerAutomationSync = async (req, res) => {
  try {
    const { mode = 'all' } = req.body;
    const results = await discoveryService.runFullDiscoveryPipeline(mode);
    res.json({
      message: 'Automated multi-source drone discovery pipeline executed.',
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CRUD Handlers for Admin Panel & Management ---
exports.createDrone = async (req, res) => {
  try {
    const drone = await Drone.create(req.body);
    res.status(201).json(drone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateDrone = async (req, res) => {
  try {
    const drone = await Drone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!drone) return res.status(404).json({ error: 'Drone not found' });
    res.json(drone);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteDrone = async (req, res) => {
  try {
    const drone = await Drone.findByIdAndDelete(req.params.id);
    if (!drone) return res.status(404).json({ error: 'Drone not found' });
    res.json({ message: 'Drone deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCountry = async (req, res) => {
  try {
    const country = await Country.create(req.body);
    res.status(201).json(country);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json(country);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCountry = async (req, res) => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id);
    if (!country) return res.status(404).json({ error: 'Country not found' });
    res.json({ message: 'Country deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCounterSystem = async (req, res) => {
  try {
    const system = await CounterSystem.create(req.body);
    res.status(201).json(system);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateCounterSystem = async (req, res) => {
  try {
    const system = await CounterSystem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!system) return res.status(404).json({ error: 'Counter system not found' });
    res.json(system);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCounterSystem = async (req, res) => {
  try {
    const system = await CounterSystem.findByIdAndDelete(req.params.id);
    if (!system) return res.status(404).json({ error: 'Counter system not found' });
    res.json({ message: 'Counter system deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
