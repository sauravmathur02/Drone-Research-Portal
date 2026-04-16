const express = require('express');
const apiController = require('../controllers/apiController');
const adminController = require('../controllers/adminController');
const updateController = require('../controllers/updateController');
const requireAuth = require('../middleware/requireAuth');
const requireAdminAuth = require('../middleware/requireAdminAuth');
const historyController = require('../controllers/historyController');
const aiRoutes = require('./aiRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use(authRoutes);
router.use(aiRoutes);

router.get('/history', requireAuth, historyController.getHistory);
router.post('/admin/login', adminController.login);
router.get('/admin/session', adminController.session);
router.get('/updates', updateController.getUpdates);
router.get('/updates/stream', updateController.streamUpdates);

router.get('/countries', apiController.getCountries);
router.post('/countries', requireAdminAuth, apiController.createCountry);
router.put('/countries/:id', requireAdminAuth, apiController.updateCountry);
router.delete('/countries/:id', requireAdminAuth, apiController.deleteCountry);

router.get('/drones', apiController.getDrones);
router.post('/drones', requireAdminAuth, apiController.createDrone);
router.put('/drones/:id', requireAdminAuth, apiController.updateDrone);
router.delete('/drones/:id', requireAdminAuth, apiController.deleteDrone);

router.get('/counter-systems', apiController.getCounterSystems);
router.post('/counter-systems', requireAdminAuth, apiController.createCounterSystem);
router.put('/counter-systems/:id', requireAdminAuth, apiController.updateCounterSystem);
router.delete('/counter-systems/:id', requireAdminAuth, apiController.deleteCounterSystem);

router.get('/counters', apiController.getCounterSystems);
router.post('/simulate', apiController.simulateWhatIf);

module.exports = router;
