// ============================================================
// CANCHA PRO — "La Vaca Digital" Routes
// ============================================================
const express = require('express');
const router = express.Router();
const vacaController = require('../controllers/vacaController');

// Crear la vaca para una reserva
router.post('/initialize', vacaController.initializeVaca);

// Consultar progreso del pozo de la vaca
router.get('/:reservationId', vacaController.getVacaStatus);

// Pagar cupo individual de un jugador
router.post('/pay-share', vacaController.payPlayerShare);

module.exports = router;
