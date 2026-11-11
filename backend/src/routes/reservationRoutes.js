// ============================================================
// CANCHA PRO — Reservation Routes
// ============================================================
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

// Consulta de disponibilidad de parrilla (abierto para clientes y admins)
router.get('/grid', reservationController.getGridAvailability);

// Listado de reservas
router.get('/', authenticate, reservationController.listReservations);

// Bloqueo temporal preventivo (10 min hold)
router.post('/hold', reservationController.holdSlot);

// Confirmación de pago / abono
router.put('/:id/confirm-payment', reservationController.confirmPayment);

// Cancelar reserva
router.delete('/:id', authenticate, reservationController.cancelReservation);

module.exports = router;
