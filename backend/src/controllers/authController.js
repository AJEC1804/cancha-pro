// ============================================================
// CANCHA PRO — Auth Controller (Multi-Rol & Tokens JWT)
// ============================================================
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'canchapro_secret_jwt_key_2026_super_secure';

// Iniciar sesión
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    // Para la demo admitimos contraseña 'admin123' o coincidencia directa
    const isValid = user.password_hash === password || password === 'admin123' || password === 'cliente123';
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    // Generar Token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        venue_id: user.venue_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Adjuntar datos de la sede si tiene una asignada
    let venue = null;
    if (user.venue_id) {
      venue = await db.findVenueById(user.venue_id);
      // BLOQUEO ESTRICTO SI LA SEDE ESTÁ SUSPENDIDA
      if (venue && !venue.is_active && user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          suspended: true,
          error: `El complejo deportivo "${venue.name}" se encuentra suspendido. La gestión está bloqueada. Por favor, comunícate con el SuperAdmin del sistema.`
        });
      }
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        venue_id: user.venue_id,
        venue_name: venue ? venue.name : null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Registro de clientes / jugadores
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, document_id } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Todos los campos obligatorios deben completarse.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe una cuenta con este correo electrónico.' });
    }

    const newUser = await db.createUser({
      name,
      email,
      phone,
      document_id: document_id || null,
      password_hash: password, // En producción se usa bcrypt.hash
      role: 'cliente',
      venue_id: null
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, venue_id: null },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// Obtener perfil actual
const getMe = async (req, res) => {
  let venue = null;
  if (req.user.venue_id) {
    venue = await db.findVenueById(req.user.venue_id);
  }

  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      venue_id: req.user.venue_id,
      venue: venue || null
    }
  });
};

// Lista de cuentas demo disponibles para selección rápida
const getDemoAccounts = async (req, res) => {
  const users = await Promise.all(
    db.store.users.map(async (u) => {
      let venue = null;
      if (u.venue_id) {
        venue = await db.findVenueById(u.venue_id);
      }
      return {
        id: u.id,
        role: u.role,
        name: u.name,
        email: u.email,
        venue_name: venue ? venue.name : 'Todas las sedes (Global)'
      };
    })
  );

  res.json({ success: true, accounts: users });
};

module.exports = {
  login,
  register,
  getMe,
  getDemoAccounts
};
