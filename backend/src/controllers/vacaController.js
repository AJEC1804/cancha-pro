// ============================================================
// CANCHA PRO — "La Vaca Digital" (Split Payment Engine)
// Divide la tarifa entre los jugadores y confirma al alcanzar el umbral
// ============================================================
const db = require('../config/database');

/**
 * Inicializar "La Vaca Digital" para una reserva
 * POST /api/vaca/initialize
 */
const initializeVaca = async (req, res, next) => {
  try {
    const { reservation_id, total_players, players_list } = req.body;

    if (!reservation_id || !total_players || total_players < 2) {
      return res.status(400).json({
        success: false,
        error: 'reservation_id y total_players (mínimo 2 personas) son requeridos.'
      });
    }

    const reservation = await db.findReservationById(reservation_id);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada.' });
    }

    // Calcular cuota equitativa por jugador
    const shareAmount = Math.ceil(reservation.total_amount / total_players);

    // Crear las participaciones individuales (cuotas)
    const splits = [];
    const players = players_list && players_list.length === total_players
      ? players_list
      : Array.from({ length: total_players }, (_, i) => ({
          name: i === 0 ? `${reservation.client_name} (Organizador)` : `Jugador #${i + 1}`,
          phone: i === 0 ? reservation.client_phone : ''
        }));

    for (let i = 0; i < total_players; i++) {
      const p = players[i];
      const split = await db.createVacaSplit({
        reservation_id: reservation.id,
        player_name: p.name,
        player_phone: p.phone,
        share_amount: shareAmount,
        payment_status: 'pending',
        paid_at: null
      });
      splits.push(split);
    }

    // Actualizar la reserva a modo 'vaca_split'
    await db.updateReservation(reservation.id, {
      payment_mode: 'vaca_split'
    });

    // Generar mensaje de WhatsApp preformateado para el organizador
    const venue = await db.findVenueById(reservation.venue_id);
    const whatsappText = encodeURIComponent(
      `⚽ ¡Muchachos, se armó el picado en *${reservation.field_name}*!\n` +
      `📅 Fecha: ${reservation.booking_date} | ⏰ Hora: ${reservation.start_time} - ${reservation.end_time}\n` +
      `💰 Cuota por jugador: *$${shareAmount.toLocaleString('es-CO')} COP*\n` +
      `🐄 Entra al link de *La Vaca Digital* y paga tu cupo por Nequi/PSE antes de que empiece el partido:\n` +
      `🔗 https://canchapro.com/vaca/${reservation.id}`
    );

    res.status(201).json({
      success: true,
      message: 'Vaca digital creada con éxito.',
      vaca: {
        reservation_id: reservation.id,
        field_name: reservation.field_name,
        total_amount: reservation.total_amount,
        target_deposit: reservation.deposit_required,
        total_players,
        share_per_player: shareAmount,
        collected_amount: 0,
        players: splits,
        share_whatsapp_url: `https://api.whatsapp.com/send?text=${whatsappText}`
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Consultar progreso de La Vaca Digital
 * GET /api/vaca/:reservationId
 */
const getVacaStatus = async (req, res, next) => {
  try {
    const { reservationId } = req.params;
    const reservation = await db.findReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Reserva no encontrada.' });
    }

    const splits = await db.findVacaSplitsByReservation(reservationId);
    const paidSplits = splits.filter(s => s.payment_status === 'paid');
    const collectedAmount = paidSplits.reduce((acc, s) => acc + s.share_amount, 0);

    const progressPercentage = Math.min(100, Math.round((collectedAmount / reservation.total_amount) * 100));
    const isDepositReached = collectedAmount >= reservation.deposit_required;
    const isFullyPaid = collectedAmount >= reservation.total_amount;

    res.json({
      success: true,
      reservation_id: reservation.id,
      field_name: reservation.field_name,
      booking_date: reservation.booking_date,
      start_time: reservation.start_time,
      status: reservation.status,
      total_amount: reservation.total_amount,
      deposit_required: reservation.deposit_required,
      collected_amount: collectedAmount,
      remaining_amount: Math.max(0, reservation.total_amount - collectedAmount),
      progress_percentage: progressPercentage,
      is_deposit_reached: isDepositReached,
      is_fully_paid: isFullyPaid,
      players_paid: paidSplits.length,
      total_players: splits.length,
      splits
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Pagar cuota individual de un jugador (Simulación de Webhook o Pago Directo)
 * POST /api/vaca/pay-share
 */
const payPlayerShare = async (req, res, next) => {
  try {
    const { token, payment_method, player_name } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token de pago requerido.' });
    }

    const split = await db.findVacaSplitByToken(token);
    if (!split) {
      return res.status(404).json({ success: false, error: 'Cupo de pago no encontrado.' });
    }

    if (split.payment_status === 'paid') {
      return res.status(400).json({ success: false, error: 'Esta cuota ya ha sido pagada previamente.' });
    }

    // Registrar pago del jugador
    await db.updateVacaSplit(split.id, {
      payment_status: 'paid',
      player_name: player_name || split.player_name,
      paid_at: new Date().toISOString(),
      payment_reference: `VACA-${Date.now()}`
    });

    // Recalcular estado acumulado de la vaca
    const reservation = await db.findReservationById(split.reservation_id);
    const allSplits = await db.findVacaSplitsByReservation(reservation.id);
    const paidSplits = allSplits.filter(s => s.payment_status === 'paid');
    const newCollected = paidSplits.reduce((acc, s) => acc + s.share_amount, 0);

    const isDepositMet = newCollected >= reservation.deposit_required;
    const isTotalMet = newCollected >= reservation.total_amount;

    // Si ya alcanzó el abono mínimo (50%) o el 100%, la reserva se confirma automáticamente
    let newResStatus = reservation.status;
    let newPaymentStatus = reservation.payment_status;

    if (isDepositMet && reservation.status === 'held') {
      newResStatus = 'confirmed'; // Se libera el cronómetro y la cancha queda en firme!
    }

    if (isTotalMet) {
      newPaymentStatus = 'paid';
    } else if (newCollected > 0) {
      newPaymentStatus = 'partial';
    }

    await db.updateReservation(reservation.id, {
      status: newResStatus,
      payment_status: newPaymentStatus,
      deposit_paid: newCollected,
      remaining_balance: Math.max(0, reservation.total_amount - newCollected),
      held_until: newResStatus === 'confirmed' ? null : reservation.held_until
    });

    res.json({
      success: true,
      message: `¡Pago de $${split.share_amount.toLocaleString('es-CO')} recibido con éxito!`,
      vaca_summary: {
        collected_amount: newCollected,
        total_amount: reservation.total_amount,
        reservation_status: newResStatus,
        is_deposit_met: isDepositMet,
        is_fully_paid: isTotalMet
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initializeVaca,
  getVacaStatus,
  payPlayerShare
};
