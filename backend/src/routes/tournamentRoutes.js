// ============================================================
// CANCHA PRO — Tournaments Routes
// ============================================================
const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.get('/', tournamentController.listTournaments);
router.post('/', authenticate, requireRoles('superadmin', 'tenant_admin'), tournamentController.createTournament);
router.post('/teams', authenticate, requireRoles('superadmin', 'tenant_admin'), tournamentController.registerTeam);
router.get('/:id/standings', tournamentController.getTournamentStandings);
router.get('/:id/matches', tournamentController.listMatches);
router.post('/schedule-match', authenticate, requireRoles('superadmin', 'tenant_admin'), tournamentController.scheduleMatchOnGrid);
router.put('/matches/:id/result', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), tournamentController.recordMatchResult);
router.post('/generate-fixture', authenticate, requireRoles('superadmin', 'tenant_admin'), tournamentController.generateRoundRobinFixture);

module.exports = router;
