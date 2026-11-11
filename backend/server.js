// ============================================================
// CANCHA PRO — Server Entrypoint
// ============================================================
require('dotenv').config();
const app = require('./src/app');
const lockTimerService = require('./src/services/lockTimerService');

const PORT = process.env.PORT || 5000;

// Iniciar temporizador de liberación automática para reservas de 10 minutos
lockTimerService.startAutoCleanup(30000);

const server = app.listen(PORT, () => {
  console.log('============================================================');
  console.log(`🚀 [CANCHA PRO] Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`🌐 Acceso Web: http://localhost:${PORT}`);
  console.log(`⚡ API Health: http://localhost:${PORT}/api/health`);
  console.log(`⏱️ Auto-liberador de 10 min: ACTIVO`);
  console.log('============================================================');
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('Cerrando servidor ordenadamente...');
  lockTimerService.stopAutoCleanup();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Servidor detenido por usuario.');
  lockTimerService.stopAutoCleanup();
  server.close(() => process.exit(0));
});
