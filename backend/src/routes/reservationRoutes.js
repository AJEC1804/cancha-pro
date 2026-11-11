// ============================================================
// CANCHA PRO — Reservation Routes
// ============================================================
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

// Consulta de disponibilidad de parrilla (abierto para clientes y admins)
router.get('/grid', reservationController.getGridAvailability);
router.get('/multi-grid', reservationController.getMultiGridAvailability);

// Suscripciones y Clientes Fijos Semanales
router.get('/recurring', authenticate, reservationController.listSubscriptions);
router.post('/recurring', authenticate, reservationController.createRecurringSubscription);

// Bloqueos Operativos y Protocolo de Lluvia
router.get('/operational-blocks', reservationController.listOperationalBlocks);
router.post('/operational-blocks', authenticate, reservationController.createOperationalBlock);

// Bonos de Reprogramación
router.get('/vouchers', authenticate, reservationController.listVouchers);
router.post('/vouchers/redeem', authenticate, reservationController.redeemVoucher);

// Listado de reservas
router.get('/', authenticate, reservationController.listReservations);

// Bloqueo temporal preventivo (10 min hold)
router.post('/hold', reservationController.holdSlot);

// Confirmación de pago / abono
router.put('/:id/confirm-payment', reservationController.confirmPayment);

// Cancelar reserva
router.delete('/:id', authenticate, reservationController.cancelReservation);

module.exports = router;
