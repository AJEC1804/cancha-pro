// ============================================================
// CANCHA PRO — Vercel Serverless Function Entrypoint
// Mapea todas las solicitudes /api/* al enrutador Express
// ============================================================
const url = require('url');
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

  // Resolver la URL original de la API preservando todos los query parameters
  const parsed = url.parse(req.url, true);
  if (parsed.query && parsed.query.path) {
    const queryCopy = { ...parsed.query };
    delete queryCopy.path;
    const searchParams = new URLSearchParams(queryCopy).toString();
    req.url = '/api/' + parsed.query.path + (searchParams ? '?' + searchParams : '');
  } else if (req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'];
  } else if (req.headers['x-forwarded-uri']) {
    req.url = req.headers['x-forwarded-uri'];
  }

  return app(req, res);
};
