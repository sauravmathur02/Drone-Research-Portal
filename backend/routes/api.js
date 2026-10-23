const express = require('express');
const router = express.Router();
const Drone = require('../models/Drone');
const Update = require('../models/Update');
const { calculateFlightPhysics } = require('../utils/simulation');
const discoveryService = require('../services/newsUpdateService');
const aiService = require('../services/aiService');
const updateStream = require('../utils/updateStream');

// 1. Get all drones with search, category, country, and sort filters
router.get('/drones', async (req, res) => {
  try {
    const { search, category, country, source, sort = '-introducedYear' } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (country && country !== 'All') filter.country = country;
    if (source && source !== 'All') filter['automationMeta.source'] = source;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { manufacturer: new RegExp(search, 'i') },
        { country: new RegExp(search, 'i') },
        { role: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const drones = await Drone.find(filter).sort(sort).limit(200);
    const stats = {
      totalDrones: await Drone.countDocuments(),
      autoDiscoveredCount: await Drone.countDocuments({ 'automationMeta.source': { $ne: 'Manual' } }),
      countriesCount: (await Drone.distinct('country')).length
    };

    res.json({ drones, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Real-time Server-Sent Events (SSE) stream for live auto-discovered drones
router.get('/updates/stream', (req, res) => {
  updateStream.addClient(req, res);
});

// 3. Get recent automated discovery & news updates
router.get('/updates', async (req, res) => {
  try {
    const updates = await Update.find().populate('relatedDrone', 'name country category image').sort('-createdAt').limit(30);
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Trigger Automated Discovery Pipeline (Wikidata Sync + Live RSS AI Scan)
router.post('/automation/sync', async (req, res) => {
  try {
    const { mode = 'both' } = req.body;
    const results = {};

    if (mode === 'wikidata' || mode === 'both') {
      results.wikidata = await discoveryService.syncFromWikidata(40);
    }
    if (mode === 'news' || mode === 'both') {
      results.news = await discoveryService.scanNewsForNewDrones();
    }

    res.json({
      message: 'Automated drone discovery sync completed.',
      results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Academic UAV Flight Physics & Endurance Simulator
router.post('/academic/simulate', (req, res) => {
  try {
    const result = calculateFlightPhysics(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. AI Academic Research Tutor Q&A
router.post('/ai/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const keywords = question
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .join('|');

    const relevantDrones = keywords
      ? await Drone.find({ searchText: new RegExp(keywords, 'i') }).limit(5)
      : await Drone.find().limit(5);

    const response = await aiService.askAcademicTutor(question, relevantDrones);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
