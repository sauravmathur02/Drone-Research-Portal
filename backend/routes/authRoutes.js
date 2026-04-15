const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/signin', authController.signin);
router.get('/auth/session', authController.session);

module.exports = router;
