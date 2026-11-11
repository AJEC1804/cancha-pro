// ============================================================
// CANCHA PRO — Database Routes
// ============================================================
const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

router.get('/status', databaseController.getStatus);
router.post('/configure', databaseController.configure);

module.exports = router;
