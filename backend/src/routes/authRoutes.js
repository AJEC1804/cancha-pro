// ============================================================
// CANCHA PRO — Auth Routes
// ============================================================
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.getMe);
router.get('/demo-accounts', authController.getDemoAccounts);

module.exports = router;
