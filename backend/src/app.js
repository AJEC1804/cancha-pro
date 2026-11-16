// ============================================================
// CANCHA PRO — Express Application
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const venueRoutes = require('./routes/venueRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const vacaRoutes = require('./routes/vacaRoutes');
const posRoutes = require('./routes/posRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares Globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático directamente (Soporta public/ y frontend/)
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rutas Dedicadas por Sede (Aislamiento Multi-Tenant con SSR) y Dashboard/Portal
app.get(['/sede/:slug', '/sede'], async (req, res) => {
  const slug = req.params.slug;
  const indexPath = path.join(__dirname, '../../public/index.html');

  if (!slug) {
    return res.sendFile(indexPath);
  }

  try {
    const venue = await db.findVenueById(slug);
    if (!venue) {
      return res.sendFile(indexPath);
    }
    const fields = await db.findFieldsByVenue(venue.id, true);
    const enrichedVenue = { ...venue, fields };

    let html = fs.readFileSync(indexPath, 'utf8');

    // Inyección de estado SSR para eliminar parpadeo inicial
    const ssrScript = `<script>window.__INITIAL_VENUE__ = ${JSON.stringify(enrichedVenue).replace(/</g, '\\u003c')};</script>`;
    html = html.replace('</head>', `${ssrScript}\n</head>`);

    // Inyección de título y sede en el navbar
    html = html.replace(/<title>.*?<\/title>/i, `<title>${venue.name} (${venue.city}) — CanchaPro SaaS</title>`);
    html = html.replace(
      /<strong id="currentVenueLabel"[^>]*>.*?<\/strong>/i,
      `<strong id="currentVenueLabel" class="text-slate-900 dark:text-white">${venue.name} (${venue.city})</strong>`
    );
    html = html.replace(
      /<span id="drawerVenueText">.*?<\/span>/i,
      `<span id="drawerVenueText">${venue.name} (${venue.city})</span>`
    );

    // Inyectar nombre de sede en el Hero
    html = html.replace(
      /<span class="text-emerald-500 font-black">La Bernabéu<\/span>/i,
      `<span class="text-emerald-500 font-black">${venue.name}</span>`
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    return res.sendFile(indexPath);
  }
});

app.get(['/portal', '/dashboard/portal'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

app.get(['/login', '/registro'], (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
});

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/vaca', vacaRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/database', databaseRoutes);

// Endpoint Health Check & Info
app.get(['/api', '/api/health'], (req, res) => {
  res.json({
    status: 'OK',
    app: 'CanchaPro Engine API',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'production',
    cloud: 'Vercel Serverless',
    time: new Date().toISOString()
  });
});

// 404 handler específico para /api
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `Ruta API no encontrada: ${req.method} ${req.originalUrl || req.url}` });
});

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
