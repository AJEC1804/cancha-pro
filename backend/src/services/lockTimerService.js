// ============================================================
// CANCHA PRO — Servicio de Temporizador de Bloqueo (10 min TTL)
// Previene "Cancha Vacía" y libera reservas no pagadas
// ============================================================
const db = require('../config/database');

class LockTimerService {
  constructor() {
    this.intervalId = null;
    this.subscribers = new Set();
  }

  // Iniciar tarea periódica de limpieza de reservas expiradas cada 30 segundos
  startAutoCleanup(intervalMs = 30000) {
    if (this.intervalId) return;
    console.log('⏱️ [LockTimerService] Auto-cleanup de reservas de 10 minutos iniciado.');
    
    this.intervalId = setInterval(async () => {
      try {
        await this.cleanExpiredReservations();
      } catch (err) {
        console.error('Error en auto-cleanup de reservas:', err);
      }
    }, intervalMs);
  }

  stopAutoCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Verifica y marca como 'expired' las reservas que superaron los 10 minutos sin abono
   */
  async cleanExpiredReservations() {
    const now = new Date();
    const heldReservations = await db.findReservations({ status: 'held' });
    let expiredCount = 0;

    for (const res of heldReservations) {
      if (res.held_until && new Date(res.held_until) < now) {
        await db.updateReservation(res.id, {
          status: 'expired',
          notes: (res.notes ? res.notes + ' | ' : '') + 'Liberada automáticamente por temporizador de 10 min.'
        });
        expiredCount++;
        console.log(`⏳ Reserva ${res.id} expirada y liberada para Cancha: ${res.field_id}`);
        
        // Notificar suscriptores en tiempo real (Parrilla/WebSockets)
        this.notifySlotReleased(res);
      }
    }

    return expiredCount;
  }

  /**
   * Calcula el timestamp exacto de vencimiento (por defecto 10 minutos a partir de ahora)
   */
  calculateHoldExpiry(minutes = 10) {
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }

  /**
   * Calcula los segundos restantes de retención para el frontend
   */
  getRemainingSeconds(heldUntil) {
    if (!heldUntil) return 0;
    const diff = Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }

  // Manejo de eventos en vivo para parrilla
  onSlotReleased(callback) {
    this.subscribers.add(callback);
  }

  notifySlotReleased(reservation) {
    this.subscribers.forEach(cb => {
      try { cb(reservation); } catch (e) { console.error(e); }
    });
  }
}

const lockTimerService = new LockTimerService();
module.exports = lockTimerService;
