// ============================================================
// CANCHA PRO — Vercel Serverless Function Entrypoint
// Mapea todas las solicitudes /api/* al enrutador Express
// ============================================================
const app = require('../backend/src/app');

module.exports = (req, res) => {
  // CORS Headers globales para Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  return app(req, res);
};
