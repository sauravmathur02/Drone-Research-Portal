const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const updateStream = require('../utils/updateStream');
const aiService = require('../services/aiService');
const Drone = require('../models/Drone');
const Update = require('../models/Update');

// Optional existing controllers (gracefully wired if methods exist)
let adminController = {};
let historyController = {};
let updateController = {};
let requireAdminAuth = (req, res, next) => next();

try { adminController = require('../controllers/adminController'); } catch (_) {}
try { historyController = require('../controllers/historyController'); } catch (_) {}
try { updateController = require('../controllers/updateController'); } catch (_) {}
try { requireAdminAuth = require('../middleware/requireAdminAuth'); } catch (_) {}

// --- DRONE ENCYCLOPEDIA & TACTICAL ROUTES ---
router.get('/drones', apiController.getDrones);
router.get('/drones/:id', apiController.getDroneById);

// --- COUNTER-UAS & COUNTRY GEO-INTEL ROUTES ---
router.get('/counter-systems', apiController.getCounterSystems);
router.get('/countries', apiController.getCountries);

// --- UAV EVOLUTION & HISTORY ROUTES ---
router.get('/history', apiController.getHistory);
if (historyController.getHistory) {
  router.get('/user/history', historyController.getHistory);
}

// --- SIMULATION & ACADEMIC PHYSICS LAB ROUTES ---
router.post('/simulate', apiController.runSimulation);
router.post('/academic/simulate', apiController.runSimulation);

// --- REAL-TIME SSE STREAM & AUTOMATED DISCOVERY ROUTES ---
router.get('/updates/stream', (req, res) => updateStream.addClient(req, res));
router.get('/updates', updateController.getUpdates || (async (req, res) => {
  try {
    const updates = await Update.find().populate('relatedDrone', 'name country category image').sort('-createdAt').limit(40);
    res.json({ updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}));
router.post('/automation/sync', apiController.triggerAutomationSync);

// --- HYBRID AI & ACADEMIC PROFESSOR Q&A ---
router.post('/ai/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const keywords = question.split(/\s+/).filter((w) => w.length > 2).join('|');
    const relevantDrones = keywords
      ? await Drone.find({ searchText: new RegExp(keywords, 'i') }).limit(6)
      : await Drone.find().limit(6);

    const response = await aiService.askAcademicTutor(question, relevantDrones);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN MANAGEMENT ROUTES ---
if (adminController.createDrone) {
  router.post('/admin/drones', requireAdminAuth, adminController.createDrone);
}
if (adminController.updateDrone) {
  router.put('/admin/drones/:id', requireAdminAuth, adminController.updateDrone);
}
if (adminController.deleteDrone) {
  router.delete('/admin/drones/:id', requireAdminAuth, adminController.deleteDrone);
}

module.exports = router;
