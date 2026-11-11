// ============================================================
// CANCHA PRO — Reservation Controller
// Algoritmo Anti-Double Booking, Temporizador 10 min y Parrilla
// ============================================================
const db = require('../config/database');
const lockTimerService = require('../services/lockTimerService');
const iotService = require('../services/iotService');

/**
 * Genera la parrilla horaria completa interactiva para una fecha y cancha
 * GET /api/reservations/grid?venue_id=...&field_id=...&date=YYYY-MM-DD
 */
const getGridAvailability = async (req, res, next) => {
  try {
    const { venue_id, field_id, date } = req.query;
    if (!field_id || !date) {
      return res.status(400).json({ success: false, error: 'field_id y date son obligatorios.' });
    }

    const field = await db.findFieldById(field_id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Cancha no encontrada.' });
    }

    const venue = await db.findVenueById(field.venue_id);

    // Limpiar reservas 'held' expiradas en tiempo real
    await lockTimerService.cleanExpiredReservations();

    // Obtener todas las reservas de esa cancha en la fecha seleccionada
    const dayReservations = await db.findReservations({
      field_id,
      booking_date: date
    });

    // Generar franjas horarias de apertura a cierre
    const openHour = parseInt(field.open_time.split(':')[0], 10);
    const closeHour = parseInt(field.close_time.split(':')[0], 10);
    const slots = [];
    const now = new Date();

    for (let h = openHour; h < closeHour; h++) {
      const startTime = `${String(h).padStart(2, '0')}:00`;
      const endTime = `${String(h + 1).padStart(2, '0')}:00`;

      // Regla de hora pico: a partir de las 17:00 (5:00 PM) o fines de semana
      const isPeakHour = h >= 17;
      const hourlyPrice = isPeakHour ? field.peak_price_per_hour : field.default_price_per_hour;

      // Buscar si existe una reserva activa para este slot
      const existingRes = dayReservations.find(r => 
        !['cancelled', 'expired'].includes(r.status) &&
        (startTime < r.end_time && endTime > r.start_time)
      );

      let slotStatus = 'available';
      let reservationData = null;
      let secondsRemaining = 0;

      if (existingRes) {
        if (existingRes.status === 'held') {
          // Está temporalmente bloqueada por 10 min
          secondsRemaining = lockTimerService.getRemainingSeconds(existingRes.held_until);
          if (secondsRemaining > 0) {
            slotStatus = 'held'; // Bloqueado esperando pago
            reservationData = {
              reservation_id: existingRes.id,
              client_name: existingRes.client_name,
              held_until: existingRes.held_until,
              seconds_remaining: secondsRemaining
            };
          } else {
            // Ya expiró
            existingRes.status = 'expired';
            slotStatus = 'available';
          }
        } else if (['confirmed', 'in_progress', 'completed'].includes(existingRes.status)) {
          slotStatus = existingRes.status;
          reservationData = {
            reservation_id: existingRes.id,
            client_name: existingRes.client_name,
            client_phone: existingRes.client_phone,
            payment_status: existingRes.payment_status,
            total_amount: existingRes.total_amount,
            remaining_balance: existingRes.remaining_balance
          };
        }
      }

      slots.push({
        slot_index: h,
        start_time: startTime,
        end_time: endTime,
        status: slotStatus,
        price: hourlyPrice,
        is_peak: isPeakHour,
        reservation: reservationData
      });
    }

    res.json({
      success: true,
      field: {
        id: field.id,
        name: field.name,
        sport_type: field.sport_type,
        venue_name: venue ? venue.name : '',
        deposit_percentage: venue ? venue.deposit_percentage : 50
      },
      date,
      slots
    });
  } catch (err) {
    next(err);
  }
};

/**
 * BLOQUEO TEMPORAL DE 10 MINUTOS (HELD SLOT)
 * Previene Race Conditions y Double Booking
 * POST /api/reservations/hold
 */
const holdSlot = async (req, res, next) => {
  try {
    const {
      venue_id, field_id, booking_date, start_time, end_time,
      client_name, client_phone, client_email, payment_mode, notes
    } = req.body;

    if (!field_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Cancha, fecha y horario son obligatorios.' });
    }

    const field = await db.findFieldById(field_id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Cancha no encontrada.' });
    }

    const venue = await db.findVenueById(field.venue_id);

    // 1. Verificación atómica de conflicto de horario
    const conflict = await db.checkConflict(field_id, booking_date, start_time, end_time);
    if (conflict) {
      const isHeld = conflict.status === 'held';
      return res.status(409).json({
        success: false,
        error: isHeld
          ? 'Este turno se encuentra retenido temporalmente por otro jugador (esperando confirmación de abono). Se liberará si no completa el pago en 10 minutos.'
          : 'El horario seleccionado ya está reservado y confirmado.',
        conflict_status: conflict.status
      });
    }

    // 2. Calcular tarifa dinámica
    const startHour = parseInt(start_time.split(':')[0], 10);
    const isPeakHour = startHour >= 17;
    const totalAmount = isPeakHour ? field.peak_price_per_hour : field.default_price_per_hour;
    const depositPct = venue ? (venue.deposit_percentage / 100) : 0.5;
    const depositRequired = Math.round(totalAmount * depositPct);

    // 3. Crear timestamp exacto de retención de 10 minutos
    const holdUntil = lockTimerService.calculateHoldExpiry(venue ? venue.hold_timeout_minutes : 10);

    // 4. Datos del usuario cliente
    const userId = req.user ? req.user.id : (await db.findUserByEmail(client_email))?.id || 'u0000000-0000-0000-0000-000000000004';

    const newReservation = await db.createReservation({
      venue_id: field.venue_id,
      field_id: field.id,
      field_name: field.name,
      user_id: userId,
      client_name: client_name || (req.user ? req.user.name : 'Cliente Mostrador'),
      client_phone: client_phone || (req.user ? req.user.phone : '3000000000'),
      client_email: client_email || (req.user ? req.user.email : 'cliente@canchapro.com'),
      booking_date,
      start_time,
      end_time,
      status: 'held', // Retenido por 10 minutos
      payment_status: 'pending',
      payment_mode: payment_mode || 'deposit_50',
      total_amount: totalAmount,
      deposit_required: depositRequired,
      deposit_paid: 0,
      remaining_balance: totalAmount,
      held_until: holdUntil,
      accepted_terms: true,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Cancha bloqueada temporalmente por 10 minutos. Realiza el abono antes de que expire el temporizador.',
      reservation: {
        id: newReservation.id,
        field_id: field.id,
        field_name: field.name,
        booking_date,
        start_time,
        end_time,
        total_amount: totalAmount,
        deposit_required: depositRequired,
        payment_mode: newReservation.payment_mode,
        held_until: holdUntil,
        seconds_remaining: 600, // 10 min
        payment_options: {
          nequi_number: venue ? venue.phone : '3006799595',
          bancolombia_qr: 'https://canchapro.com/qr/bancolombia-demo',
          pse_checkout_url: `https://checkout.wompi.co/p/?ref=${newReservation.id}&amount=${depositRequired}`
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CONFIRMAR PAGO O ABONO
 * PUT /api/reservations/:id/confirm-payment
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_method, amount_paid, payment_reference, receipt_url } = req.body;

    const reservation = await db.findReservationById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada.' });
    }

    if (reservation.status === 'expired') {
      return res.status(400).json({ success: false, error: 'Esta reserva ya expiró. Debes seleccionarla nuevamente.' });
    }

    const paid = Number(amount_paid || reservation.deposit_required);
    const newDepositPaid = (reservation.deposit_paid || 0) + paid;
    const newRemainingBalance = Math.max(0, reservation.total_amount - newDepositPaid);
    const newPaymentStatus = newRemainingBalance === 0 ? 'paid' : (newDepositPaid > 0 ? 'partial' : 'pending');

    const updated = await db.updateReservation(id, {
      status: 'confirmed', // Pasa a confirmada definitiva
      payment_status: newPaymentStatus,
      deposit_paid: newDepositPaid,
      remaining_balance: newRemainingBalance,
      held_until: null, // Se retira el cronómetro de 10 min
      receipt_url: receipt_url || null,
      payment_reference: payment_reference || `PAY-${Date.now()}`
    });

    res.json({
      success: true,
      message: '¡Reserva confirmada exitosamente!',
      reservation: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CANCELAR RESERVA (Con validación de tiempo mínimo de preaviso)
 * DELETE /api/reservations/:id
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await db.findReservationById(id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada.' });
    }

    const venue = await db.findVenueById(reservation.venue_id);
    const minNoticeHours = venue ? venue.cancellation_hours_notice : 6;

    // Verificar ventana de cancelación si es cliente
    if (req.user && req.user.role === 'cliente') {
      const matchDateTime = new Date(`${reservation.booking_date}T${reservation.start_time}:00`);
      const diffHours = (matchDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

      if (diffHours < minNoticeHours) {
        return res.status(400).json({
          success: false,
          error: `Las cancelaciones deben realizarse con al menos ${minNoticeHours} horas de anticipación. Por favor comunícate directamente con la administración.`
        });
      }
    }

    const updated = await db.updateReservation(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    });

    res.json({ success: true, message: 'Reserva cancelada correctamente.', reservation: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Listar reservas con filtros
 * GET /api/reservations
 */
const listReservations = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.venue_id) query.venue_id = req.query.venue_id;
    if (req.query.field_id) query.field_id = req.query.field_id;
    if (req.query.date) query.booking_date = req.query.date;
    if (req.query.status) query.status = req.query.status;

    // Si es cliente regular, solo puede consultar sus reservas
    if (req.user && req.user.role === 'cliente') {
      query.user_id = req.user.id;
    }

    const reservations = await db.findReservations(query);
    res.json({ success: true, reservations });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGridAvailability,
  holdSlot,
  confirmPayment,
  cancelReservation,
  listReservations
};
