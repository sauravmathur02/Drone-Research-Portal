const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/ai-query', aiController.query);

module.exports = router;
