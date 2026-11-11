// ============================================================
// CANCHA PRO — Database Layer (PostgreSQL with Fallback Data Store)
// ============================================================
const crypto = require('crypto');
const { getSupabase } = require('./supabaseClient');

// Memoria inicial precargada con datos semilla reales de La Bernabéu y Camp Nou Arena
const inMemoryStore = {
  venues: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      slug: 'la-bernabeu',
      name: 'Complejo Deportivo La Bernabéu',
      nit_rut: '901456789-1',
      phone: '3006799595',
      email: 'contacto@labernabeu.co',
      address: 'Dg al CC San Fernando, detrás del Totumazo Cartagenero',
      city: 'Cartagena',
      open_time: '06:00',
      close_time: '23:00',
      slot_duration_minutes: 60,
      deposit_percentage: 50,
      hold_timeout_minutes: 10,
      cancellation_hours_notice: 6,
      rules_and_conditions: 'Uso obligatorio de tenis o guayos de goma sintética (turf). No taches de aluminio. Llegar 15 minutos antes.',
      iot_broker_url: 'mqtt://broker.hivemq.com:1883',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      slug: 'camp-nou-arena',
      name: 'Camp Nou Arena VIP',
      nit_rut: '900987654-3',
      phone: '3158889900',
      email: 'info@campnouarena.co',
      address: 'Calle 127 # 45-20, Autopista Norte',
      city: 'Bogotá',
      open_time: '06:00',
      close_time: '23:00',
      slot_duration_minutes: 60,
      deposit_percentage: 50,
      hold_timeout_minutes: 10,
      cancellation_hours_notice: 6,
      rules_and_conditions: 'Presentar documento de identidad al ingreso. Vestuarios y duchas incluidas.',
      iot_broker_url: 'mqtt://broker.hivemq.com:1883',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],

  users: [
    {
      id: 'u0000000-0000-0000-0000-000000000001',
      venue_id: null, // Acceso global a todas las canchas
      role: 'superadmin',
      name: 'Alejandro SuperAdmin',
      email: 'superadmin@canchapro.com',
      phone: '3000000001',
      document_id: '1047499888',
      password_hash: 'admin123', // Demo simplified
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'u0000000-0000-0000-0000-000000000002',
      venue_id: 'a0000000-0000-0000-0000-000000000001', // Admin La Bernabéu
      role: 'tenant_admin',
      name: 'Don Mario Administrador',
      email: 'admin@bernabeu.com',
      phone: '3006799595',
      document_id: '73123456',
      password_hash: 'admin123',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'u0000000-0000-0000-0000-000000000003',
      venue_id: 'a0000000-0000-0000-0000-000000000001', // Canchero / POS Staff
      role: 'staff',
      name: 'Carlos Canchero & POS',
      email: 'canchero@bernabeu.com',
      phone: '3104567890',
      document_id: '1047200300',
      password_hash: 'admin123',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'u0000000-0000-0000-0000-000000000004',
      venue_id: null,
      role: 'cliente',
      name: 'Mateo Jugador',
      email: 'mateo@gmail.com',
      phone: '3012345678',
      document_id: '1143322110',
      password_hash: 'cliente123',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],

  fields: [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Cancha 1: La Bernabéu Principal (Fútbol 5)',
      sport_type: 'futbol_5',
      surface_type: 'sintetica_monofilamento',
      default_price_per_hour: 110000,
      peak_price_per_hour: 130000,
      weekend_price_per_hour: 130000,
      weekend_peak_price_per_hour: 160000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Grama sintética monofilamento de 50mm con iluminación LED de alta potencia para partidos nocturnos.'
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Cancha 2: Maracaná Express (Fútbol 7)',
      sport_type: 'futbol_7',
      surface_type: 'sintetica_monofilamento',
      default_price_per_hour: 160000,
      peak_price_per_hour: 190000,
      weekend_price_per_hour: 180000,
      weekend_peak_price_per_hour: 220000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Ideal para torneos de empresas y partidos 7v7, con gradería cubierta.'
    },
    {
      id: 'f0000000-0000-0000-0000-000000000003',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Cancha 3: Pádel Pro Glass',
      sport_type: 'padel',
      surface_type: 'vidrio_padel',
      default_price_per_hour: 90000,
      peak_price_per_hour: 120000,
      weekend_price_per_hour: 110000,
      weekend_peak_price_per_hour: 140000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Pista de pádel de cristal panorámica con iluminación antideslumbrante.'
    }
  ],

  reservations: [
    {
      id: 'res-demo-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      field_id: 'f0000000-0000-0000-0000-000000000001',
      field_name: 'Cancha 1: La Bernabéu Principal (Fútbol 5)',
      user_id: 'u0000000-0000-0000-0000-000000000004',
      client_name: 'Mateo Jugador',
      client_phone: '3012345678',
      client_email: 'mateo@gmail.com',
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
      payment_status: 'partial',
      payment_mode: 'deposit_50',
      total_amount: 130000,
      deposit_required: 65000,
      deposit_paid: 65000,
      remaining_balance: 65000,
      held_until: null,
      accepted_terms: true,
      notes: 'Piden balones listos',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],

  vaca_splits: [],

  pos_categories: [
    { id: 'c1', venue_id: 'a0000000-0000-0000-0000-000000000001', name: 'Bebidas e Hidratación', icon: 'cup-straw' },
    { id: 'c2', venue_id: 'a0000000-0000-0000-0000-000000000001', name: 'Cervezas y Licores', icon: 'beer' },
    { id: 'c3', venue_id: 'a0000000-0000-0000-0000-000000000001', name: 'Snacks y Alimentos', icon: 'cookie' },
    { id: 'c4', venue_id: 'a0000000-0000-0000-0000-000000000001', name: 'Implementos Deportivos', icon: 'shield' }
  ],

  pos_products: [
    {
      id: 'p1',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      category_id: 'c1',
      name: 'Gatorade 500ml (Mora / Mandarina / Blue)',
      cost_price: 3500,
      sale_price: 6000,
      stock_quantity: 48,
      min_stock_alert: 10,
      is_active: true
    },
    {
      id: 'p2',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      category_id: 'c1',
      name: 'Agua Cristal 600ml',
      cost_price: 1200,
      sale_price: 2500,
      stock_quantity: 60,
      min_stock_alert: 12,
      is_active: true
    },
    {
      id: 'p3',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      category_id: 'c2',
      name: 'Cerveza Corona Extra 355ml',
      cost_price: 4500,
      sale_price: 8500,
      stock_quantity: 96,
      min_stock_alert: 15,
      is_active: true
    },
    {
      id: 'p4',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      category_id: 'c4',
      name: 'Alquiler Petos x 10',
      cost_price: 2000,
      sale_price: 10000,
      stock_quantity: 10,
      min_stock_alert: 2,
      is_active: true
    },
    {
      id: 'p5',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      category_id: 'c4',
      name: 'Alquiler Balón Golty Profesional',
      cost_price: 3000,
      sale_price: 12000,
      stock_quantity: 8,
      min_stock_alert: 2,
      is_active: true
    }
  ],

  pos_orders: [],
  cash_shifts: [
    {
      id: 'shift-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      staff_user_id: 'u0000000-0000-0000-0000-000000000003',
      staff_name: 'Carlos Canchero & POS',
      opened_at: new Date().toISOString(),
      closed_at: null,
      initial_cash: 100000,
      expected_cash: 100000,
      actual_cash: null,
      difference: 0,
      total_electronic_sales: 0,
      is_closed: false
    }
  ],

  tournaments: [
    {
      id: 't-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Copa Nocturna La Bernabéu 2026',
      sport_type: 'futbol_5',
      format: 'round_robin',
      start_date: '2026-11-20',
      inscription_fee: 350000,
      max_teams: 8,
      is_active: true
    }
  ],

  tournament_teams: [
    { id: 'tt-1', tournament_id: 't-001', team_name: 'Los Galácticos FC', captain_name: 'David Beckham', captain_phone: '3001112233', points: 9, matches_played: 3, matches_won: 3, matches_drawn: 0, matches_lost: 0, goals_for: 14, goals_against: 4, goal_difference: 10 },
    { id: 'tt-2', tournament_id: 't-001', team_name: 'San Fernando City', captain_name: 'Carlos Bacca', captain_phone: '3004445566', points: 6, matches_played: 3, matches_won: 2, matches_drawn: 0, matches_lost: 1, goals_for: 10, goals_against: 6, goal_difference: 4 },
    { id: 'tt-3', tournament_id: 't-001', team_name: 'Cartagena United', captain_name: 'Wilmar Barrios', captain_phone: '3007778899', points: 3, matches_played: 3, matches_won: 1, matches_drawn: 0, matches_lost: 2, goals_for: 7, goals_against: 9, goal_difference: -2 },
    { id: 'tt-4', tournament_id: 't-001', team_name: 'Totumazo Stars', captain_name: 'Teófilo Gutiérrez', captain_phone: '3009990011', points: 0, matches_played: 3, matches_won: 0, matches_drawn: 0, matches_lost: 3, goals_for: 3, goals_against: 15, goal_difference: -12 }
  ],

  // 1. Suscripciones y Clientes Fijos Semanales
  recurring_subscriptions: [
    {
      id: 'sub-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      field_id: 'f0000000-0000-0000-0000-000000000001',
      field_name: 'Cancha 1: La Bernabéu Principal (Fútbol 5)',
      client_name: 'Club Amigos de San Fernando',
      client_phone: '3007778899',
      client_email: 'amigos.sanfernando@gmail.com',
      day_of_week: 2, // Martes
      day_name: 'Martes',
      start_time: '20:00',
      end_time: '21:00',
      weeks_count: 4,
      total_amount: 520000,
      monthly_discount_pct: 10,
      amount_paid: 468000,
      payment_status: 'paid',
      status: 'active',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      created_at: new Date().toISOString()
    }
  ],

  // 2. Bloqueos Operativos (Mantenimiento, Lluvia, Escuelas)
  operational_blocks: [
    {
      id: 'block-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      field_id: 'f0000000-0000-0000-0000-000000000002',
      field_name: 'Cancha 2: Maracaná Express (Fútbol 7)',
      date: new Date().toISOString().split('T')[0],
      start_time: '14:00',
      end_time: '16:00',
      block_type: 'maintenance', // 'maintenance', 'rain_storm', 'academy'
      reason: 'Cepillado y descompactación de caucho sintético',
      notes: 'Mantenimiento preventivo quincenal programado',
      created_at: new Date().toISOString()
    }
  ],

  // 3. Bonos de Reprogramación por Lluvia
  reprogramming_vouchers: [
    {
      id: 'vouch-001',
      code: 'BONO-LLUVIA-8492',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      client_name: 'David Ospina',
      client_phone: '3157778899',
      amount: 65000,
      reason: 'Cancelación por tormenta eléctrica en Cancha 1',
      is_redeemed: false,
      redeemed_at: null,
      created_at: new Date().toISOString(),
      expires_at: '2026-12-31'
    }
  ],

  // 4. Partidos de Torneos vinculados a la Parrilla Horaria
  tournament_matches: [
    {
      id: 'm-001',
      tournament_id: 't-001',
      round_number: 1,
      home_team_id: 'tt-1',
      home_team_name: 'Los Galácticos FC',
      away_team_id: 'tt-2',
      away_team_name: 'San Fernando City',
      field_id: 'f0000000-0000-0000-0000-000000000001',
      field_name: 'Cancha 1: La Bernabéu Principal (Fútbol 5)',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '21:00 - 22:00',
      home_score: 4,
      away_score: 2,
      arbitration_fee: 50000,
      arbitration_paid: true,
      referee_name: 'Wilmar Roldán Jr.',
      yellow_cards: 3,
      red_cards: 0,
      is_finished: true
    }
  ]
};

// Objeto de base de datos con métodos normalizados
const db = {
  store: inMemoryStore,

  // Helper para generar UUIDs
  generateId: () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

  // Venues
  findVenues: async () => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('venues').select('*').eq('is_active', true);
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        // Fallback a memoria
      }
    }
    return inMemoryStore.venues.filter(v => v.is_active);
  },
  findVenueById: async (id) => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('venues').select('*').or(`id.eq.${id},slug.eq.${id}`).single();
        if (!error && data) return data;
      } catch (err) {
        // Fallback a memoria
      }
    }
    return inMemoryStore.venues.find(v => v.id === id || v.slug === id);
  },
  createVenue: async (data) => {
    const venue = {
      id: db.generateId(),
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      is_active: true,
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.venues.push(venue);
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('venues').insert([venue]); } catch (e) {}
    }
    return venue;
  },
  updateVenue: async (id, data) => {
    const idx = inMemoryStore.venues.findIndex(v => v.id === id);
    if (idx === -1) return null;
    inMemoryStore.venues[idx] = { ...inMemoryStore.venues[idx], ...data, updated_at: new Date().toISOString() };
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('venues').update(data).eq('id', id); } catch (e) {}
    }
    return inMemoryStore.venues[idx];
  },

  // Users
  findUserByEmail: async (email) => inMemoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  findUserById: async (id) => inMemoryStore.users.find(u => u.id === id),
  findUsersByVenue: async (venueId) => inMemoryStore.users.filter(u => u.venue_id === venueId),
  createUser: async (data) => {
    const user = {
      id: db.generateId(),
      is_active: true,
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.users.push(user);
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('users').insert([user]); } catch (e) {}
    }
    return user;
  },

  // Fields
  findFieldsByVenue: async (venueId, includeInactive = false) => {
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('fields').select('*').eq('venue_id', venueId);
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {}
    }
    return inMemoryStore.fields.filter(f => f.venue_id === venueId && (includeInactive || f.is_active));
  },
  findAllFields: async () => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('fields').select('*');
        if (!error && data && data.length > 0) return data;
      } catch (err) {}
    }
    return inMemoryStore.fields;
  },
  findFieldById: async (id) => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('fields').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {}
    }
    return inMemoryStore.fields.find(f => f.id === id);
  },
  createField: async (data) => {
    const field = {
      id: db.generateId(),
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.fields.push(field);
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('fields').insert([field]); } catch (e) {}
    }
    return field;
  },
  updateField: async (id, data) => {
    const idx = inMemoryStore.fields.findIndex(f => f.id === id);
    if (idx !== -1) {
      inMemoryStore.fields[idx] = { ...inMemoryStore.fields[idx], ...data, updated_at: new Date().toISOString() };
    }
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('fields').update(data).eq('id', id); } catch (e) {}
    }
    return idx !== -1 ? inMemoryStore.fields[idx] : null;
  },
  deleteField: async (id) => {
    const idx = inMemoryStore.fields.findIndex(f => f.id === id);
    if (idx !== -1) {
      inMemoryStore.fields.splice(idx, 1);
    }
    const sb = getSupabase();
    if (sb) {
      try { await sb.from('fields').delete().eq('id', id); } catch (e) {}
    }
    return idx !== -1;
  },

  // Reservations & Concurrency Anti-Double Booking
  findReservations: async (query = {}) => {
    return inMemoryStore.reservations.filter(r => {
      if (query.venue_id && r.venue_id !== query.venue_id) return false;
      if (query.field_id && r.field_id !== query.field_id) return false;
      if (query.booking_date && r.booking_date !== query.booking_date) return false;
      if (query.user_id && r.user_id !== query.user_id) return false;
      if (query.status && r.status !== query.status) return false;
      return true;
    });
  },

  findReservationById: async (id) => inMemoryStore.reservations.find(r => r.id === id),

  // Algoritmo Atómico de Verificación de Conflicto de Horario
  checkConflict: async (fieldId, bookingDate, startTime, endTime, excludeResId = null) => {
    const now = new Date();
    // Limpia reservas 'held' expiradas primero
    inMemoryStore.reservations.forEach(r => {
      if (r.status === 'held' && r.held_until && new Date(r.held_until) < now) {
        r.status = 'expired';
      }
    });

    const activeReservations = inMemoryStore.reservations.filter(r => {
      if (excludeResId && r.id === excludeResId) return false;
      if (r.field_id !== fieldId || r.booking_date !== bookingDate) return false;
      if (['cancelled', 'expired'].includes(r.status)) return false;

      // Conflicto si los intervalos se solapan:
      // (startA < endB) && (endA > startB)
      const overlap = (startTime < r.end_time) && (endTime > r.start_time);
      return overlap;
    });

    return activeReservations.length > 0 ? activeReservations[0] : null;
  },

  createReservation: async (data) => {
    const res = {
      id: db.generateId(),
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.reservations.push(res);
    return res;
  },

  updateReservation: async (id, data) => {
    const idx = inMemoryStore.reservations.findIndex(r => r.id === id);
    if (idx === -1) return null;
    inMemoryStore.reservations[idx] = { ...inMemoryStore.reservations[idx], ...data, updated_at: new Date().toISOString() };
    return inMemoryStore.reservations[idx];
  },

  // "La Vaca Digital" splits
  createVacaSplit: async (data) => {
    const split = {
      id: db.generateId(),
      payment_token: crypto.randomBytes ? crypto.randomBytes(16).toString('hex') : `vaca-${Date.now()}-${Math.random()}`,
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.vaca_splits.push(split);
    return split;
  },

  findVacaSplitsByReservation: async (resId) => inMemoryStore.vaca_splits.filter(s => s.reservation_id === resId),
  findVacaSplitByToken: async (token) => inMemoryStore.vaca_splits.find(s => s.payment_token === token),
  updateVacaSplit: async (id, data) => {
    const idx = inMemoryStore.vaca_splits.findIndex(s => s.id === id);
    if (idx === -1) return null;
    inMemoryStore.vaca_splits[idx] = { ...inMemoryStore.vaca_splits[idx], ...data };
    return inMemoryStore.vaca_splits[idx];
  },

  // POS & Inventario
  findPosProducts: async (venueId) => inMemoryStore.pos_products.filter(p => p.venue_id === venueId && p.is_active),
  findPosProductById: async (id) => inMemoryStore.pos_products.find(p => p.id === id),
  findPosCategories: async (venueId) => inMemoryStore.pos_categories.filter(c => c.venue_id === venueId && c.is_active),
  createPosOrder: async (data) => {
    const order = {
      id: db.generateId(),
      created_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.pos_orders.push(order);
    return order;
  },
  findPosOrders: async (query = {}) => {
    return inMemoryStore.pos_orders.filter(o => {
      if (query.venue_id && o.venue_id !== query.venue_id) return false;
      if (query.reservation_id && o.reservation_id !== query.reservation_id) return false;
      return true;
    });
  },

  // Arqueo de caja
  findActiveShift: async (venueId) => inMemoryStore.cash_shifts.find(s => s.venue_id === venueId && !s.is_closed),
  createShift: async (data) => {
    const shift = { id: db.generateId(), opened_at: new Date().toISOString(), is_closed: false, ...data };
    inMemoryStore.cash_shifts.push(shift);
    return shift;
  },
  closeShift: async (id, data) => {
    const idx = inMemoryStore.cash_shifts.findIndex(s => s.id === id);
    if (idx === -1) return null;
    inMemoryStore.cash_shifts[idx] = {
      ...inMemoryStore.cash_shifts[idx],
      ...data,
      closed_at: new Date().toISOString(),
      is_closed: true
    };
    return inMemoryStore.cash_shifts[idx];
  },

  // Torneos
  findTournaments: async (venueId) => inMemoryStore.tournaments.filter(t => t.venue_id === venueId && t.is_active),
  findTournamentTeams: async (tourId) => inMemoryStore.tournament_teams.filter(tt => tt.tournament_id === tourId),
  findTournamentMatches: async (tourId) => inMemoryStore.tournament_matches.filter(m => m.tournament_id === tourId),
  createTournamentMatch: async (data) => {
    const match = { id: db.generateId(), is_finished: false, created_at: new Date().toISOString(), ...data };
    inMemoryStore.tournament_matches.push(match);
    return match;
  },
  updateTournamentMatch: async (id, data) => {
    const idx = inMemoryStore.tournament_matches.findIndex(m => m.id === id);
    if (idx === -1) return null;
    inMemoryStore.tournament_matches[idx] = { ...inMemoryStore.tournament_matches[idx], ...data };
    return inMemoryStore.tournament_matches[idx];
  },

  // 1. Suscripciones Semanales (Clientes Fijos)
  findSubscriptions: async (venueId) => inMemoryStore.recurring_subscriptions.filter(s => !venueId || s.venue_id === venueId),
  createSubscription: async (data) => {
    const sub = { id: db.generateId(), status: 'active', created_at: new Date().toISOString(), ...data };
    inMemoryStore.recurring_subscriptions.push(sub);
    return sub;
  },

  // 2. Bloqueos Operativos (Mantenimiento, Lluvia, Escuelas)
  findOperationalBlocks: async (venueId, date) => {
    return inMemoryStore.operational_blocks.filter(b => {
      if (venueId && b.venue_id !== venueId) return false;
      if (date && b.date !== date) return false;
      return true;
    });
  },
  createOperationalBlock: async (data) => {
    const block = { id: db.generateId(), created_at: new Date().toISOString(), ...data };
    inMemoryStore.operational_blocks.push(block);
    return block;
  },
  deleteOperationalBlock: async (id) => {
    const idx = inMemoryStore.operational_blocks.findIndex(b => b.id === id);
    if (idx === -1) return false;
    inMemoryStore.operational_blocks.splice(idx, 1);
    return true;
  },

  // 3. Bonos de Reprogramación por Lluvia
  findVouchers: async (venueId) => inMemoryStore.reprogramming_vouchers.filter(v => !venueId || v.venue_id === venueId),
  createVoucher: async (data) => {
    const voucher = {
      id: db.generateId(),
      code: `BONO-LLUVIA-${Math.floor(1000 + Math.random() * 9000)}`,
      is_redeemed: false,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0], // 60 días
      ...data
    };
    inMemoryStore.reprogramming_vouchers.push(voucher);
    return voucher;
  },
  findVoucherByCode: async (code) => inMemoryStore.reprogramming_vouchers.find(v => v.code === code && !v.is_redeemed),
  redeemVoucher: async (code) => {
    const v = inMemoryStore.reprogramming_vouchers.find(v => v.code === code);
    if (!v || v.is_redeemed) return null;
    v.is_redeemed = true;
    v.redeemed_at = new Date().toISOString();
    return v;
  },

  // IoT Relays
  logIotAction: async (data) => {
    const log = { id: db.generateId(), executed_at: new Date().toISOString(), ...data };
    inMemoryStore.iot_relay_logs.push(log);
    return log;
  }
};

module.exports = db;
