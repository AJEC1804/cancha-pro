// ============================================================
// CANCHA PRO — Middleware de Autenticación y RBAC Multi-Tenant
// ============================================================
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'canchapro_secret_jwt_key_2026_super_secure';

/**
 * Middleware para validar el token JWT y adjuntar el usuario en req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Token de autenticación requerido.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Soporte para tokens demo directos (útil para pruebas en Postman o frontend rápido)
    if (token.startsWith('demo-user-')) {
      const userId = token.replace('demo-user-', '');
      const user = await db.findUserById(userId);
      if (user) {
        req.user = user;
        return next();
      }
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.findUserById(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Usuario inactivo o sesión inválida.'
        });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido o expirado.'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware para restringir por roles (RBAC)
 * @param  {...string} roles - Ej: 'superadmin', 'tenant_admin', 'staff', 'cliente'
 */
const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere uno de los siguientes roles: [${roles.join(', ')}]. Tu rol actual es: ${req.user.role}.`
      });
    }
    next();
  };
};

/**
 * Middleware de Aislamiento Multi-Tenant:
 * Valida que el usuario tenga permiso sobre la sede (venue_id) solicitada.
 * El 'superadmin' tiene pase total a cualquier sede.
 */
const requireVenueAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
  }

  // Superadmin tiene acceso a todas las sedes
  if (req.user.role === 'superadmin') {
    return next();
  }

  const requestedVenueId = req.params.venueId || req.body.venue_id || req.query.venue_id;
  
  if (requestedVenueId && req.user.venue_id && req.user.venue_id !== requestedVenueId) {
    return res.status(403).json({
      success: false,
      error: 'Violación de seguridad Multi-Tenant: No tienes permisos para gestionar esta sede.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireRoles,
  requireVenueAccess
};
