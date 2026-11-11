// ============================================================
// CANCHA PRO — IoT Automation Controller (Luces & Sensores)
// ============================================================
const iotService = require('../services/iotService');
const db = require('../config/database');

// Conmutar luces manualmente o por webhook de partido
const switchCourtLighting = async (req, res, next) => {
  try {
    const { field_id, action, reservation_id } = req.body;

    if (!field_id || !action) {
      return res.status(400).json({ success: false, error: 'field_id y action (TURN_ON, TURN_OFF, COURTESY_MODE) son requeridos.' });
    }

    const result = await iotService.triggerCourtLighting(
      field_id,
      action.toUpperCase(),
      req.user ? `MANUAL_BY_${req.user.role.toUpperCase()}` : 'AUTOMATED_WEBHOOK',
      reservation_id || null
    );

    res.json({
      success: true,
      message: `Comando IoT enviado con éxito para la cancha.`,
      iot_result: result
    });
  } catch (err) {
    next(err);
  }
};

// Consultar historial de eventos de iluminación
const getIotLogs = async (req, res, next) => {
  try {
    const venueId = req.query.venue_id || (req.user ? req.user.venue_id : null);
    const logs = db.store.iot_relay_logs.filter(l => !venueId || l.venue_id === venueId);
    res.json({ success: true, logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  switchCourtLighting,
  getIotLogs
};
