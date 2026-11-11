// ============================================================
// CANCHA PRO — Tournaments Routes
// ============================================================
const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/', tournamentController.listTournaments);
router.get('/:id/standings', tournamentController.getTournamentStandings);
router.post('/generate-fixture', authenticate, requireRoles('superadmin', 'tenant_admin'), tournamentController.generateRoundRobinFixture);

module.exports = router;
