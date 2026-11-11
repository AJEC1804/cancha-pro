// ============================================================
// CANCHA PRO — Express Application
// ============================================================
const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Rutas de la API REST
app.use('/api/auth', authRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/vaca', vacaRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/database', databaseRoutes);

// Endpoint Health Check & Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'CanchaPro Engine API',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Manejador centralizado de errores
app.use(errorHandler);

module.exports = app;
