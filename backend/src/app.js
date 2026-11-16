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

function renderSuspendedVenueHtml(venue) {
  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Servicio Suspendido — ${venue.name} | CanchaPro</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' };</script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans selection:bg-red-500 selection:text-white">
  <div class="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
    <div class="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-3xl">
      🚫
    </div>
    
    <div class="space-y-2">
      <span class="text-xs uppercase font-black tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
        Estado: Sede Suspendida
      </span>
      <h1 class="text-2xl sm:text-3xl font-black text-white pt-2">${venue.name}</h1>
      <p class="text-xs text-slate-400">${venue.city || 'Colombia'} • ${venue.address || ''}</p>
    </div>

    <div class="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed text-left space-y-2">
      <p class="font-bold text-red-400">⚠️ Servicio temporalmente suspendido.</p>
      <p>El portal público y el motor de reservas de este complejo deportivo han sido temporalmente desactivados por la administración central de CanchaPro SaaS.</p>
      <p class="text-slate-400 text-[11px]">Si eres el propietario de este complejo, ponte en contacto con soporte técnico para regularizar la cuenta y reactivar el servicio de inmediato.</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
      <a href="/" class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition text-center">
        Volver a Inicio
      </a>
      <a href="https://wa.me/573006799595?text=Hola,%20necesito%20soporte%20sobre%20la%20sede%20${encodeURIComponent(venue.name)}" target="_blank" class="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition text-center shadow-lg shadow-emerald-500/20">
        Contactar Soporte
      </a>
    </div>

    <p class="text-[10px] text-slate-500">© 2026 CanchaPro SaaS — EscuTech Solutions</p>
  </div>
</body>
</html>`;
}

function renderVenueLandingHtml(venue) {
  const primaryColor = venue.primary_color || '#1e3a8a';
  const secondaryColor = venue.secondary_color || '#facc15';
  const fields = venue.fields || [];
  const isWeekend = [0, 6].includes(new Date().getDay());

  return `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${venue.name} — Reservas Online | CanchaPro</title>
  <meta name="description" content="Reserva tu cancha en ${venue.name}, ${venue.city}. Disponibilidad en vivo, La Vaca Digital y confirmación de abono.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            venuePrimary: '${primaryColor}',
            venueSecondary: '${secondaryColor}'
          }
        }
      }
    };
  </script>
  <script src="https://unpkg.com/feather-icons"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950">

  <!-- Header Sede Oficial -->
  <header class="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg" style="background-color: ${primaryColor};">
          ⚽
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-base sm:text-lg font-black text-white tracking-tight">${venue.name}</h1>
            <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style="background-color: ${secondaryColor}20; color: ${secondaryColor};">
              ${venue.city}
            </span>
          </div>
          <p class="text-[11px] text-slate-400">${venue.address}</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <a href="/sede/${venue.slug}/portal" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition">
          Portal Jugador
        </a>
        <a href="/sede/${venue.slug}/admin" class="hidden sm:inline-flex bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 transition">
          Admin Sede
        </a>
      </div>
    </div>
  </header>

  <!-- Hero de la Sede con Aviso de Reglas y Tarjetas -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
    
    <!-- Aviso Oficial de Reglas del Complejo (Estilo La Bernabéu) -->
    <div class="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg" style="background-color: ${primaryColor}15; border-color: ${primaryColor}40;">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">⚠️</span>
        <div>
          <h4 class="text-xs font-black uppercase tracking-wider" style="color: ${secondaryColor};">
            Reglamento Oficial de la Sede
          </h4>
          <p class="text-xs text-slate-200 mt-0.5">
            ${venue.rules_and_conditions || 'Uso obligatorio de tenis o guayos de goma sintética (turf). Prohibido terminantemente el ingreso con guayos de taches metálicos o de aluminio.'}
          </p>
        </div>
      </div>
      <span class="text-[10px] font-bold text-slate-400 shrink-0">Puntualidad: Llegar 15 min antes</span>
    </div>

    <!-- Grid: Sub-canchas y Tarjetas vs Card de Login Obligatorio -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      <!-- Columna Canchas (8 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Instalaciones Oficiales
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white mt-2">
            Sub-Canchas Disponibles en ${venue.name}
          </h2>
          <p class="text-xs text-slate-400 mt-1">
            Tarifas transparentes por hora para horario diurno (Valle), nocturno (Pico) y fines de semana.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4">
          ${fields.map(f => {
            const valleyPrice = isWeekend ? (f.weekend_price_per_hour || f.default_price_per_hour) : f.default_price_per_hour;
            const peakPrice = isWeekend ? (f.weekend_peak_price_per_hour || f.peak_price_per_hour) : f.peak_price_per_hour;
            return `
              <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    ${f.sport_type.replace('_', ' ')}
                  </span>
                  <span class="text-[11px] text-slate-400 font-mono">${f.open_time} - ${f.close_time}</span>
                </div>
                
                <div>
                  <h3 class="text-base font-black text-white">${f.name}</h3>
                  <p class="text-xs text-slate-400 mt-0.5">${f.description || 'Grama sintética profesional con iluminación de alta potencia.'}</p>
                </div>

                <div class="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span class="text-slate-500 block text-[10px]">Horario Valle (Diurno)</span>
                    <span class="font-bold text-white">$${Number(valleyPrice).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-500 block text-[10px]">Horario Pico (Nocturno)</span>
                    <span class="font-black text-emerald-400">$${Number(peakPrice).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <div class="pt-1 flex items-center justify-between">
                  <span class="text-[10px] text-amber-400 font-bold">Abono requerido: 50%</span>
                  <a href="/sede/${venue.slug}/portal?tab=nueva&field=${f.id}" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-sm">
                    Reservar Turno
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Columna Login Obligatorio (5 cols) -->
      <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl sticky top-24">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold text-emerald-400 mb-1">
            <span>🔒</span>
            <span>Reserva Segura Autenticada</span>
          </div>
          <h3 class="text-xl font-black text-white">Ingresa a tu Portal de Jugador</h3>
          <p class="text-xs text-slate-400 mt-1">
            Por seguridad de los turnos y para coordinar La Vaca Digital, debes iniciar sesión antes de apartar una cancha.
          </p>
        </div>

        <!-- Formulario Login / Demo Rápido -->
        <form onsubmit="handleVenueLogin(event)" class="space-y-4 text-xs">
          <div>
            <label class="text-slate-400 block mb-1 font-bold">Correo Electrónico</label>
            <input type="email" id="venueLoginEmail" required placeholder="tu@correo.com" value="mateo@gmail.com" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="text-slate-400 block mb-1 font-bold">Contraseña</label>
            <input type="password" id="venueLoginPass" required value="cliente123" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500">
          </div>

          <button type="submit" class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20">
            Entrar y Reservar en Esta Sede
          </button>
        </form>

        <!-- Accesos Demo Rápidos para Pruebas -->
        <div class="space-y-2 pt-3 border-t border-slate-800 text-xs">
          <span class="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Acceso de Demostración Rápido:</span>
          <div class="grid grid-cols-2 gap-2">
            <button onclick="loginAsDemo('cliente')" class="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-left hover:bg-blue-500/20 transition">
              ⚽ Mateo Jugador
            </button>
            <button onclick="loginAsDemo('tenant_admin')" class="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-left hover:bg-emerald-500/20 transition">
              🏢 Admin Sede
            </button>
          </div>
        </div>

        <div class="text-[11px] text-slate-500 text-center">
          ¿No tienes cuenta? <a href="/sede/${venue.slug}/portal" class="text-emerald-400 font-bold hover:underline">Crear cuenta gratis</a>
        </div>
      </div>

    </div>

  </main>

  <footer class="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
    <p>© 2026 ${venue.name} — Operado con tecnología CanchaPro SaaS (EscuTech Solutions).</p>
  </footer>

  <script>
    function handleVenueLogin(e) {
      e.preventDefault();
      localStorage.setItem('canchapro_role', 'cliente');
      localStorage.setItem('canchapro_token', 'demo-user-b0000000-0000-0000-0000-000000000004');
      window.location.href = '/sede/${venue.slug}/portal';
    }

    function loginAsDemo(role) {
      if (role === 'cliente') {
        localStorage.setItem('canchapro_role', 'cliente');
        localStorage.setItem('canchapro_token', 'demo-user-b0000000-0000-0000-0000-000000000004');
        window.location.href = '/sede/${venue.slug}/portal';
      } else {
        localStorage.setItem('canchapro_role', 'tenant_admin');
        localStorage.setItem('canchapro_token', 'demo-user-b0000000-0000-0000-0000-000000000002');
        window.location.href = '/sede/${venue.slug}/admin';
      }
    }
  </script>
</body>
</html>`;
}


// Ruta SuperAdmin Torre de Control
app.get(['/superadmin', '/admin'], (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, '../../public/dashboard.html'), 'utf8');
  const ssrScript = `<script>
    window.__INITIAL_ROLE__ = 'superadmin';
  </script>`;
  html = html.replace('</head>', `${ssrScript}\n</head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Ruta Panel Administrativo de la Sede
app.get('/sede/:slug/admin', async (req, res) => {
  const { slug } = req.params;
  try {
    const venue = await db.findVenueById(slug);
    if (!venue) return res.redirect('/');
    if (!venue.is_active) {
      return res.status(403).send(renderSuspendedVenueHtml(venue));
    }
    const fields = await db.findFieldsByVenue(venue.id, true);
    const enrichedVenue = { ...venue, fields };

    let html = fs.readFileSync(path.join(__dirname, '../../public/dashboard.html'), 'utf8');
    const ssrScript = `<script>
      window.__INITIAL_VENUE__ = ${JSON.stringify(enrichedVenue).replace(/</g, '\\u003c')};
      window.__INITIAL_ROLE__ = 'tenant_admin';
    </script>`;
    html = html.replace('</head>', `${ssrScript}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.redirect('/');
  }
});

// Ruta Portal del Jugador Aislado por Sede
app.get(['/sede/:slug/portal', '/sede/:slug/reservar'], async (req, res) => {
  const { slug } = req.params;
  try {
    const venue = await db.findVenueById(slug);
    if (!venue) return res.redirect('/');
    if (!venue.is_active) {
      return res.status(403).send(renderSuspendedVenueHtml(venue));
    }
    const fields = await db.findFieldsByVenue(venue.id, true);
    const enrichedVenue = { ...venue, fields };

    let html = fs.readFileSync(path.join(__dirname, '../../public/dashboard.html'), 'utf8');
    const ssrScript = `<script>
      window.__INITIAL_VENUE__ = ${JSON.stringify(enrichedVenue).replace(/</g, '\\u003c')};
      window.__INITIAL_ROLE__ = 'cliente';
    </script>`;
    html = html.replace('</head>', `${ssrScript}\n</head>`);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.redirect('/');
  }
});

// Ruta Entrada Sede Branded (Módulo Independiente con SSR y Bloqueo de Suspensión)
app.get(['/sede/:slug', '/sede'], async (req, res) => {
  const slug = req.params.slug;
  if (!slug) return res.redirect('/');

  try {
    const venue = await db.findVenueById(slug);
    if (!venue) return res.redirect('/');

    // BLOQUEO INMEDIATO SI LA SEDE ESTÁ SUSPENDIDA
    if (venue.is_active === false) {
      return res.status(403).send(renderSuspendedVenueHtml(venue));
    }

    const fields = await db.findFieldsByVenue(venue.id, true);
    const enrichedVenue = { ...venue, fields };

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderVenueLandingHtml(enrichedVenue));
  } catch (err) {
    res.redirect('/');
  }
});

// Portal Global y Login
app.get(['/portal', '/dashboard/portal'], (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, '../../public/dashboard.html'), 'utf8');
  const ssrScript = `<script>window.__INITIAL_ROLE__ = 'cliente';</script>`;
  html = html.replace('</head>', `${ssrScript}\n</head>`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
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
