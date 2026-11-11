// ============================================================
// CANCHA PRO — Venue & Fields Controller (Multi-Tenancy & Config)
// ============================================================
const db = require('../config/database');

// Listar todas las sedes activas (público / clientes / superadmin)
const listVenues = async (req, res, next) => {
  try {
    const venues = await db.findVenues();
    // Adjuntar canchas (activas e inactivas con su bandera de estado) de cada sede
    const result = await Promise.all(
      venues.map(async (v) => {
        const fields = await db.findFieldsByVenue(v.id, true);
        return {
          ...v,
          fields_count: fields.length,
          fields
        };
      })
    );
    res.json({ success: true, venues: result });
  } catch (err) {
    next(err);
  }
};

// Detalle de una sede
const getVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venue = await db.findVenueById(id);
    if (!venue) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada.' });
    }
    const fields = await db.findFieldsByVenue(venue.id, true);
    res.json({ success: true, venue: { ...venue, fields } });
  } catch (err) {
    next(err);
  }
};

// Crear nueva sede (SOLO SUPERADMIN)
const createVenue = async (req, res, next) => {
  try {
    const {
      name, slug, nit_rut, phone, email, address, city,
      open_time, close_time, slot_duration_minutes, deposit_percentage,
      cancellation_hours_notice, rules_and_conditions, iot_broker_url
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, error: 'Nombre, teléfono y dirección son obligatorios.' });
    }

    const newVenue = await db.createVenue({
      name,
      slug: slug || name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-'),
      nit_rut,
      phone,
      email,
      address,
      city: city || 'Cartagena',
      open_time: open_time || '06:00',
      close_time: close_time || '23:00',
      slot_duration_minutes: slot_duration_minutes || 60,
      deposit_percentage: deposit_percentage || 50,
      hold_timeout_minutes: 10,
      cancellation_hours_notice: cancellation_hours_notice || 6,
      rules_and_conditions: rules_and_conditions || 'Uso obligatorio de calzado deportivo.',
      iot_broker_url: iot_broker_url || 'mqtt://broker.hivemq.com:1883'
    });

    res.status(201).json({ success: true, venue: newVenue });
  } catch (err) {
    next(err);
  }
};

// Actualizar configuración de la sede (SUPERADMIN o TENANT_ADMIN de la sede)
const updateVenue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const venue = await db.findVenueById(id);
    if (!venue) {
      return res.status(404).json({ success: false, error: 'Sede no encontrada.' });
    }

    // Validación multi-tenant: si es tenant_admin solo puede modificar su sede
    if (req.user.role === 'tenant_admin' && req.user.venue_id !== venue.id) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para modificar esta sede.' });
    }

    const updated = await db.updateVenue(venue.id, req.body);
    res.json({ success: true, venue: updated });
  } catch (err) {
    next(err);
  }
};

// Crear empleado / canchero para la sede (TENANT_ADMIN o SUPERADMIN)
const createStaff = async (req, res, next) => {
  try {
    const { venueId } = req.params;
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, correo y contraseña son obligatorios.' });
    }

    const targetVenueId = venueId || req.user.venue_id;
    if (!targetVenueId) {
      return res.status(400).json({ success: false, error: 'Debe especificarse la sede.' });
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe un usuario con este correo.' });
    }

    const newStaff = await db.createUser({
      venue_id: targetVenueId,
      name,
      email,
      phone: phone || '',
      password_hash: password,
      role: role === 'tenant_admin' ? 'tenant_admin' : 'staff', // no puede crear superadmins
    });

    res.status(201).json({ success: true, staff: newStaff });
  } catch (err) {
    next(err);
  }
};

// Listar empleados de la sede
const listStaff = async (req, res, next) => {
  try {
    const venueId = req.params.venueId || req.user.venue_id;
    const users = await db.findUsersByVenue(venueId);
    res.json({ success: true, staff: users });
  } catch (err) {
    next(err);
  }
};

// Listar todas las canchas para Superadmin y Tenant Admin (incluye activas e inactivas)
const listAllFields = async (req, res, next) => {
  try {
    const venueId = req.query.venue_id;
    let fields = [];
    if (venueId) {
      fields = await db.findFieldsByVenue(venueId, true);
    } else {
      fields = await db.findAllFields();
    }

    // Adjuntar nombre de la sede a cada cancha
    const enriched = await Promise.all(
      fields.map(async f => {
        const v = await db.findVenueById(f.venue_id);
        return {
          ...f,
          venue_name: v ? v.name : 'Sede desconocida',
          venue_city: v ? v.city : ''
        };
      })
    );

    res.json({ success: true, fields: enriched });
  } catch (err) {
    next(err);
  }
};

// Crear Cancha dentro de la sede (TENANT_ADMIN o SUPERADMIN)
const createField = async (req, res, next) => {
  try {
    const {
      venue_id, name, sport_type, surface_type,
      default_price_per_hour, peak_price_per_hour,
      open_time, close_time, description
    } = req.body;

    const targetVenueId = venue_id || req.user.venue_id;
    if (!targetVenueId || !name || !default_price_per_hour) {
      return res.status(400).json({ success: false, error: 'Sede, nombre y precio por hora son requeridos.' });
    }

    const newField = await db.createField({
      venue_id: targetVenueId,
      name,
      sport_type: sport_type || 'futbol_5',
      surface_type: surface_type || 'sintetica_monofilamento',
      default_price_per_hour: Number(default_price_per_hour),
      peak_price_per_hour: Number(peak_price_per_hour || default_price_per_hour),
      weekend_price_per_hour: Number(req.body.weekend_price_per_hour || 130000),
      weekend_peak_price_per_hour: Number(req.body.weekend_peak_price_per_hour || 160000),
      open_time: open_time || '06:00',
      close_time: close_time || '23:00',
      is_active: true,
      description: description || ''
    });

    res.status(201).json({ success: true, field: newField });
  } catch (err) {
    next(err);
  }
};

// Actualizar cancha (SUPERADMIN o TENANT_ADMIN)
const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const field = await db.findFieldById(id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Cancha no encontrada.' });
    }

    // BLOQUEO ESTRICTO SI LA CANCHA ESTÁ SUSPENDIDA
    if (!field.is_active && req.body.is_active === undefined && (!req.user || req.user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        suspended: true,
        error: 'Esta cancha se encuentra actualmente suspendida. La gestión está bloqueada. Por favor, comunícate con el administrador del sistema.'
      });
    }

    const updated = await db.updateField(id, req.body);
    res.json({ success: true, field: updated });
  } catch (err) {
    next(err);
  }
};

// Activar / Desactivar Cancha (SUPERADMIN o TENANT_ADMIN)
const toggleFieldStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const field = await db.findFieldById(id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Cancha no encontrada.' });
    }

    const newStatus = !field.is_active;
    const updated = await db.updateField(id, { is_active: newStatus });

    res.json({
      success: true,
      message: `Cancha "${field.name}" ${newStatus ? 'ACTIVADA' : 'DESACTIVADA'} con éxito.`,
      field: updated
    });
  } catch (err) {
    next(err);
  }
};

// Eliminar Cancha (SUPERADMIN)
const deleteField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const field = await db.findFieldById(id);
    if (!field) {
      return res.status(404).json({ success: false, error: 'Cancha no encontrada.' });
    }

    await db.deleteField(id);
    res.json({ success: true, message: `Cancha "${field.name}" eliminada correctamente.` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listVenues,
  getVenue,
  createVenue,
  updateVenue,
  createStaff,
  listStaff,
  listAllFields,
  createField,
  updateField,
  toggleFieldStatus,
  deleteField
};
