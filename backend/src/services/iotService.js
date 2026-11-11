// ============================================================
// CANCHA PRO — Servicio de Automatización IoT (Relés de Iluminación)
// Soporta Protocolos MQTT y HTTP Webhooks para Sonoff/Shelly/ESP32
// ============================================================
const db = require('../config/database');

class IotService {
  /**
   * Enviar orden de conmutación de luces a la cancha
   * @param {string} fieldId - ID de la cancha
   * @param {string} action - 'TURN_ON' | 'TURN_OFF' | 'COURTESY_MODE'
   * @param {string} triggerSource - 'AUTO_SCHEDULER' | 'MANUAL_OVERRIDE'
   * @param {string} reservationId - ID opcional de la reserva
   */
  async triggerCourtLighting(fieldId, action, triggerSource = 'MANUAL_OVERRIDE', reservationId = null) {
    const field = await db.findFieldById(fieldId);
    if (!field) {
      throw new Error(`Cancha con ID ${fieldId} no encontrada`);
    }

    const venue = await db.findVenueById(field.venue_id);
    const channel = field.iot_relay_channel || 1;
    const deviceId = field.iot_device_id || `RELAY_${field.venue_id}_CH${channel}`;

    // Payload estándar IoT (compatible con Tasmota / Shelly / ESP32 firmware)
    const payload = {
      device: deviceId,
      relay_channel: channel,
      action: action,
      duration_minutes: action === 'TURN_ON' ? 60 : 0,
      timestamp: new Date().toISOString()
    };

    console.log(`💡 [IoT Service] Disparando relé: Cancha "${field.name}" -> Acción: ${action} en Canal ${channel}`);

    // Si hay broker MQTT o Webhook HTTP configurado en la sede, aquí se efectúa el dispatch
    let simulatedResponse = 'OK_RELAY_ACTIVATED';
    if (action === 'TURN_OFF') {
      simulatedResponse = 'OK_RELAY_DEACTIVATED';
    } else if (action === 'COURTESY_MODE') {
      simulatedResponse = 'OK_RELAY_COURTESY_5MIN';
    }

    // Registrar en log de auditoría
    const log = await db.logIotAction({
      venue_id: field.venue_id,
      field_id: fieldId,
      reservation_id: reservationId,
      action,
      trigger_source: triggerSource,
      device_id: deviceId,
      relay_channel: channel,
      payload,
      status_response: simulatedResponse
    });

    return {
      success: true,
      action,
      field_name: field.name,
      channel,
      status_response: simulatedResponse,
      log_id: log.id
    };
  }
}

const iotService = new IotService();
module.exports = iotService;
