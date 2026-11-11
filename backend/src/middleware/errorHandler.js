// ============================================================
// CANCHA PRO — Error Handler Centralizado
// ============================================================

const errorHandler = (err, req, res, next) => {
  console.error(`[Error ${new Date().toISOString()}] ${req.method} ${req.url}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
