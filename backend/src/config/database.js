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
      primary_color: '#1e3a8a',
      secondary_color: '#facc15',
      logo_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=120&h=120&fit=crop',
      iot_broker_url: 'mqtt://broker.hivemq.com:1883',
      is_active: true,
      saas_plan: 'pro',
      saas_plan_name: 'Plan Pro (Hasta 5 Canchas)',
      saas_status: 'al_dia', // 'al_dia', 'por_vencer', 'en_mora'
      saas_monthly_fee: 299000,
      saas_next_billing: '2026-11-30',
      saas_last_payment: '2026-10-30',
      payment_methods: {
        nequi_number: '3006799595',
        nequi_holder: 'Mario Mendoza (La Bernabéu)',
        daviplata_number: '3006799595',
        daviplata_holder: 'Mario Mendoza',
        bancolombia_type: 'Ahorros',
        bancolombia_number: '245-000123-45',
        bre_b_code: 'BREB-LABERNABEU-01',
        cash_accepted: true,
        wompi_enabled: true,
        wompi_public_key: 'pub_prod_wompi_bernabeu_live',
        deposit_percentage: 50
      },
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
      saas_plan: 'basic',
      saas_plan_name: 'Plan Básico (Hasta 2 Canchas)',
      saas_status: 'por_vencer',
      saas_monthly_fee: 149000,
      saas_next_billing: '2026-11-20',
      saas_last_payment: '2026-10-20',
      payment_methods: {
        nequi_number: '3158889900',
        nequi_holder: 'Gerencia Camp Nou VIP',
        daviplata_number: '3158889900',
        daviplata_holder: 'Gerencia Camp Nou VIP',
        bancolombia_type: 'Corriente',
        bancolombia_number: '101-998877-22',
        bre_b_code: 'BREB-CAMPNOU-VIP',
        cash_accepted: true,
        wompi_enabled: false,
        deposit_percentage: 50
      },
      created_at: new Date().toISOString()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      slug: 'la-favela',
      name: 'Complejo Deportivo La Favela',
      nit_rut: '901765432-8',
      phone: '3201234567',
      email: 'contacto@lafavela.co',
      address: 'Cra 43A # 1-50, El Poblado',
      city: 'Medellín',
      open_time: '06:00',
      close_time: '23:00',
      slot_duration_minutes: 60,
      deposit_percentage: 50,
      hold_timeout_minutes: 10,
      cancellation_hours_notice: 6,
      rules_and_conditions: 'Uso obligatorio de calzado deportivo turf. No taches de aluminio.',
      iot_broker_url: 'mqtt://broker.hivemq.com:1883',
      is_active: true,
      saas_plan: 'enterprise',
      saas_plan_name: 'Plan Enterprise (Canchas Ilimitadas)',
      saas_status: 'al_dia',
      saas_monthly_fee: 499000,
      saas_next_billing: '2026-12-15',
      saas_last_payment: '2026-11-15',
      payment_methods: {
        nequi_number: '3201234567',
        nequi_holder: 'Admin La Favela Medellín',
        daviplata_number: '3201234567',
        daviplata_holder: 'Admin La Favela Medellín',
        bancolombia_type: 'Ahorros',
        bancolombia_number: '312-554433-10',
        bre_b_code: 'BREB-LAFAVELA-MED',
        cash_accepted: true,
        wompi_enabled: false,
        deposit_percentage: 50
      },
      created_at: new Date().toISOString()
    }
  ],

  users: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
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
      id: 'b0000000-0000-0000-0000-000000000002',
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
      id: 'b0000000-0000-0000-0000-000000000003',
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
      id: 'b0000000-0000-0000-0000-000000000004',
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
    },
    {
      id: 'f0000000-0000-0000-0000-000000000004',
      venue_id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Cancha Camp Nou Central (Fútbol 5)',
      sport_type: 'futbol_5',
      surface_type: 'sintetica_monofilamento',
      default_price_per_hour: 140000,
      peak_price_per_hour: 160000,
      weekend_price_per_hour: 150000,
      weekend_peak_price_per_hour: 180000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Cancha techada con iluminación profesional y vestuarios VIP.'
    },
    {
      id: 'f0000000-0000-0000-0000-000000000005',
      venue_id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Cancha 1: La Favela Maracaná (Fútbol 5)',
      sport_type: 'futbol_5',
      surface_type: 'sintetica_monofilamento',
      default_price_per_hour: 130000,
      peak_price_per_hour: 150000,
      weekend_price_per_hour: 140000,
      weekend_peak_price_per_hour: 170000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Grama sintética monofilamento de alta densidad y enmallado perimetral.'
    },
    {
      id: 'f0000000-0000-0000-0000-000000000006',
      venue_id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Cancha 2: La Favela San Siro (Fútbol 7)',
      sport_type: 'futbol_7',
      surface_type: 'sintetica_monofilamento',
      default_price_per_hour: 170000,
      peak_price_per_hour: 200000,
      weekend_price_per_hour: 190000,
      weekend_peak_price_per_hour: 230000,
      open_time: '06:00',
      close_time: '23:00',
      is_active: true,
      description: 'Cancha reglamentaria 7v7 para torneos y partidos con alta exigencia.'
    }
  ],

  reservations: [
    {
      id: 'res-demo-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      field_id: 'f0000000-0000-0000-0000-000000000001',
      field_name: 'Cancha 1: La Bernabéu Principal (Fútbol 5)',
      user_id: 'b0000000-0000-0000-0000-000000000004',
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
    },
    {
      id: 'res-demo-002',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      field_id: 'f0000000-0000-0000-0000-000000000002',
      field_name: 'Cancha 2: Maracaná Express (Fútbol 7)',
      user_id: 'b0000000-0000-0000-0000-000000000005',
      client_name: 'Carlos Rodríguez',
      client_phone: '3109876543',
      client_email: 'carlos@gmail.com',
      booking_date: new Date().toISOString().split('T')[0],
      start_time: '20:00',
      end_time: '21:00',
      status: 'confirmed',
      payment_status: 'paid',
      payment_mode: 'full',
      total_amount: 190000,
      deposit_required: 95000,
      deposit_paid: 190000,
      remaining_balance: 0,
      held_until: null,
      accepted_terms: true,
      notes: 'Pago total por Wompi',
      created_at: new Date(Date.now() - 7200000).toISOString()
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

  pos_orders: [
    {
      id: 'pos-ord-demo-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      reservation_id: 'res-demo-001',
      staff_user_id: 'b0000000-0000-0000-0000-000000000003',
      total_amount: 25500,
      status: 'open',
      payment_method: 'charged_to_field',
      paid_at: null,
      items: [
        { product_id: 'p1', name: 'Gatorade 500ml (Mora / Mandarina)', quantity: 2, unit_price: 6000, subtotal: 12000 },
        { product_id: 'p2', name: 'Agua Cristal 600ml', quantity: 2, unit_price: 2500, subtotal: 5000 },
        { product_id: 'p3', name: 'Cerveza Corona Extra 355ml', quantity: 1, unit_price: 8500, subtotal: 8500 }
      ],
      notes: 'Cargado a la cuenta de Cancha 1 (Mateo Jugador)',
      created_at: new Date().toISOString()
    }
  ],
  cash_shifts: [
    {
      id: 'shift-001',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      staff_user_id: 'b0000000-0000-0000-0000-000000000003',
      staff_name: 'Carlos Canchero & POS',
      opened_at: new Date(Date.now() - 28800000).toISOString(),
      closed_at: null,
      initial_cash: 100000,
      expected_cash: 165000,
      actual_cash: null,
      difference: 0,
      court_sales: 65000,
      cafeteria_sales: 0,
      total_electronic_sales: 120000,
      is_closed: false
    },
    {
      id: 'shift-000-prev',
      venue_id: 'a0000000-0000-0000-0000-000000000001',
      staff_user_id: 'b0000000-0000-0000-0000-000000000003',
      staff_name: 'Carlos Canchero & POS',
      opened_at: new Date(Date.now() - 86400000).toISOString(),
      closed_at: new Date(Date.now() - 57600000).toISOString(),
      initial_cash: 100000,
      expected_cash: 480000,
      actual_cash: 480000,
      difference: 0,
      court_sales: 260000,
      cafeteria_sales: 120000,
      total_electronic_sales: 310000,
      notes: 'Turno de tarde sin novedades. Cuadre exacto.',
      is_closed: true
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
    { id: 'tt-1', tournament_id: 't-001', team_name: 'Los Galácticos FC', captain_name: 'David Beckham', captain_phone: '3001112233', points: 9, matches_played: 3, played: 3, matches_won: 3, won: 3, matches_drawn: 0, drawn: 0, matches_lost: 0, lost: 0, goals_for: 14, goals_against: 4, goal_difference: 10 },
    { id: 'tt-2', tournament_id: 't-001', team_name: 'San Fernando City', captain_name: 'Carlos Bacca', captain_phone: '3004445566', points: 6, matches_played: 3, played: 3, matches_won: 2, won: 2, matches_drawn: 0, drawn: 0, matches_lost: 1, lost: 1, goals_for: 10, goals_against: 6, goal_difference: 4 },
    { id: 'tt-3', tournament_id: 't-001', team_name: 'Cartagena United', captain_name: 'Wilmar Barrios', captain_phone: '3007778899', points: 3, matches_played: 3, played: 3, matches_won: 1, won: 1, matches_drawn: 0, drawn: 0, matches_lost: 2, lost: 2, goals_for: 7, goals_against: 9, goal_difference: -2 },
    { id: 'tt-4', tournament_id: 't-001', team_name: 'Totumazo Stars', captain_name: 'Teófilo Gutiérrez', captain_phone: '3009990011', points: 0, matches_played: 3, played: 3, matches_won: 0, won: 0, matches_drawn: 0, drawn: 0, matches_lost: 3, lost: 3, goals_for: 3, goals_against: 15, goal_difference: -12 }
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
      duration_hours: 1,
      total_weeks: 4,
      weeks_count: 4,
      weeks_remaining: 3,
      price_per_match: 130000,
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
      block_date: new Date().toISOString().split('T')[0],
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
      amount_credit: 65000,
      amount: 65000,
      reason: 'Cancelación por tormenta eléctrica en Cancha 1',
      is_redeemed: false,
      status: 'available',
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
      match_date: new Date().toISOString().split('T')[0],
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: '21:00',
      end_time: '22:00',
      scheduled_time: '21:00 - 22:00',
      home_score: 4,
      away_score: 2,
      referee_fee: 50000,
      arbitration_fee: 50000,
      arbitration_paid: true,
      referee_name: 'Wilmar Roldán Jr.',
      yellow_cards: 3,
      red_cards: 0,
      status: 'completed',
      is_finished: true
    }
  ],

  // 5. Módulo SaaS: Planes y Facturación
  saas_plans: [
    {
      id: 'basic',
      name: 'Plan Básico',
      max_fields: 2,
      monthly_price: 149000,
      badge: 'Emprendedor',
      features: ['Hasta 2 Canchas', 'Parrilla Horaria y Reservas Web', 'Control de Abonos 50%', 'Soporte Estándar']
    },
    {
      id: 'pro',
      name: 'Plan Pro',
      max_fields: 5,
      monthly_price: 299000,
      badge: 'Más Popular',
      features: ['Hasta 5 Canchas', 'La Vaca Digital (Split)', 'POS Cafetería & Inventario', 'Torneos y Ligas Nocturnas', 'Soporte WhatsApp']
    },
    {
      id: 'enterprise',
      name: 'Plan Enterprise',
      max_fields: 99,
      monthly_price: 499000,
      badge: 'Complejos Grandes',
      features: ['Canchas Ilimitadas', 'Todas las funciones Pro', 'Soporte VIP Prioritario 24/7', 'Dominio Propio y Marca Blanca', 'Múltiples Cajeros']
    }
  ]
};

// Objeto de base de datos con métodos normalizados
const db = {
  store: inMemoryStore,

  // Helper para generar UUIDs
  generateId: () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`,

  // Venues
  findVenues: async (includeInactive = false) => {
    let result = [];
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('venues').select('*');
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query.order('name');
        if (!error && data) {
          result = [...data];
        }
      } catch (err) {
        // Fallback a memoria
      }
    }
    // Mergear con inMemoryStore para no perder sedes creadas/modificadas localmente
    const localVenues = inMemoryStore.venues.filter(v => includeInactive || v.is_active);
    for (const lv of localVenues) {
      const idx = result.findIndex(r => r.id === lv.id || r.slug === lv.slug);
      if (idx >= 0) {
        result[idx] = { ...result[idx], ...lv };
      } else {
        result.push(lv);
      }
    }
    return result;
  },
  findVenueById: async (id) => {
    const local = inMemoryStore.venues.find(v => v.id === id || v.slug === id);
    const sb = getSupabase();
    if (sb) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const query = isUuid ? sb.from('venues').select('*').eq('id', id) : sb.from('venues').select('*').eq('slug', id);
        const { data, error } = await query.maybeSingle();
        if (!error && data) return local ? { ...data, ...local } : data;
      } catch (err) {
        // Fallback a memoria
      }
    }
    return local;
  },
  createVenue: async (data) => {
    const venue = {
      id: data.id || db.generateId(),
      slug: data.slug || data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.venues.push(venue);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('venues').insert([{
          id: venue.id,
          slug: venue.slug,
          name: venue.name,
          nit_rut: venue.nit_rut || null,
          phone: venue.phone,
          email: venue.email || null,
          address: venue.address,
          city: venue.city || 'Cartagena',
          open_time: venue.open_time || '06:00:00',
          close_time: venue.close_time || '23:00:00',
          slot_duration_minutes: venue.slot_duration_minutes || 60,
          deposit_percentage: venue.deposit_percentage || 50,
          hold_timeout_minutes: venue.hold_timeout_minutes || 10,
          cancellation_hours_notice: venue.cancellation_hours_notice || 6,
          rules_and_conditions: venue.rules_and_conditions || null,
          is_active: venue.is_active
        }]);
      } catch (e) {
        console.warn('[DB] Supabase createVenue insert error:', e.message);
      }
    }
    return venue;
  },
  updateVenue: async (id, data) => {
    let target = inMemoryStore.venues.find(v => v.id === id || v.slug === id);
    if (target) {
      Object.assign(target, data, { updated_at: new Date().toISOString() });
    }
    const sb = getSupabase();
    if (sb) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const targetId = target ? target.id : (isUuid ? id : null);
        let query;
        if (targetId) {
          query = sb.from('venues').update(data).eq('id', targetId);
        } else {
          query = sb.from('venues').update(data).eq('slug', id);
        }
        const { data: updatedData, error } = await query.select().maybeSingle();
        if (!error && updatedData) {
          if (target) {
            Object.assign(target, updatedData);
          } else {
            inMemoryStore.venues.push(updatedData);
          }
          return updatedData;
        }
      } catch (e) {
        console.warn('[DB] Supabase updateVenue update error:', e.message);
      }
    }
    return target;
  },

  // Users
  findUserByEmail: async (email) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*').ilike('email', cleanEmail).maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }
    return inMemoryStore.users.find(u => u.email.toLowerCase() === cleanEmail);
  },
  findUserById: async (id) => {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }
    return inMemoryStore.users.find(u => u.id === id);
  },
  findUsersByVenue: async (venueId) => {
    let result = [];
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('users').select('*').eq('venue_id', venueId);
        if (!error && data) result = [...data];
      } catch (e) {}
    }
    const localUsers = inMemoryStore.users.filter(u => u.venue_id === venueId);
    for (const lu of localUsers) {
      const idx = result.findIndex(r => r.id === lu.id || r.email.toLowerCase() === lu.email.toLowerCase());
      if (idx >= 0) {
        result[idx] = { ...result[idx], ...lu };
      } else {
        result.push(lu);
      }
    }
    return result;
  },
  createUser: async (data) => {
    const user = {
      id: data.id || db.generateId(),
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    };
    inMemoryStore.users.push(user);
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('users').insert([{
          id: user.id,
          venue_id: user.venue_id || null,
          role: user.role || 'cliente',
          name: user.name,
          email: user.email.toLowerCase(),
          phone: user.phone || '',
          document_id: user.document_id || null,
          password_hash: user.password_hash || '$2b$10$hashedadmin123',
          is_active: user.is_active
        }]);
      } catch (e) {
        console.warn('[DB] Supabase createUser insert error:', e.message);
      }
    }
    return user;
  },
  updateUser: async (id, data) => {
    const idx = inMemoryStore.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      inMemoryStore.users[idx] = { ...inMemoryStore.users[idx], ...data, updated_at: new Date().toISOString() };
    }
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('users').update(data).eq('id', id);
      } catch (e) {
        console.warn('[DB] Supabase updateUser update error:', e.message);
      }
    }
    return idx !== -1 ? inMemoryStore.users[idx] : null;
  },

  // Fields
  findFieldsByVenue: async (venueId, includeInactive = false) => {
    let result = [];
    const sb = getSupabase();
    if (sb) {
      try {
        let query = sb.from('fields').select('*').eq('venue_id', venueId);
        if (!includeInactive) query = query.eq('is_active', true);
        const { data, error } = await query;
        if (!error && data) {
          result = [...data];
        }
      } catch (err) {}
    }
    const localFields = inMemoryStore.fields.filter(f => f.venue_id === venueId && (includeInactive || f.is_active));
    for (const lf of localFields) {
      const idx = result.findIndex(r => r.id === lf.id);
      if (idx >= 0) {
        result[idx] = { ...result[idx], ...lf };
      } else {
        result.push(lf);
      }
    }
    return result;
  },
  findAllFields: async () => {
    let result = [];
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb.from('fields').select('*');
        if (!error && data) {
          result = [...data];
        }
      } catch (err) {}
    }
    for (const lf of inMemoryStore.fields) {
      const idx = result.findIndex(r => r.id === lf.id);
      if (idx >= 0) {
        result[idx] = { ...result[idx], ...lf };
      } else {
        result.push(lf);
      }
    }
    return result;
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
    if (!inMemoryStore.iot_relay_logs) inMemoryStore.iot_relay_logs = [];
    inMemoryStore.iot_relay_logs.push(log);
    return log;
  },

  // ============================================================
  // CUENTA / FOLIO POR RESERVA (CANCHA + 50% ABONO + CAFETERÍA)
  // ============================================================
  getFolio: async (reservationId) => {
    const r = inMemoryStore.reservations.find(res => res.id === reservationId);
    if (!r) return null;

    const f = inMemoryStore.fields.find(field => field.id === r.field_id);
    const v = inMemoryStore.venues.find(venue => venue.id === r.venue_id);

    // Órdenes de cafetería cargadas a esta reserva
    const orders = inMemoryStore.pos_orders.filter(o => o.reservation_id === reservationId && o.status !== 'cancelled');
    
    // Lista detallada producto por producto
    const posItems = [];
    let posTotal = 0;
    let posPendingTotal = 0;

    orders.forEach(order => {
      const items = order.items || [];
      items.forEach((it, idx) => {
        const subtotal = Number(it.subtotal || (it.unit_price * it.quantity) || 0);
        posTotal += subtotal;
        if (order.status === 'open') {
          posPendingTotal += subtotal;
        }
        posItems.push({
          id: `${order.id}-item-${idx}`,
          order_id: order.id,
          product_id: it.product_id,
          name: it.name || 'Consumo Cafetería',
          quantity: Number(it.quantity || 1),
          unit_price: Number(it.unit_price || subtotal),
          subtotal: subtotal,
          status: order.status,
          created_at: order.created_at
        });
      });
    });

    const courtValue = Number(r.total_amount || 0);
    const depositPaid = Number(r.deposit_paid || 0);
    const courtPending = Math.max(0, courtValue - depositPaid);
    const totalNetDue = courtPending + posPendingTotal;

    return {
      reservation_id: r.id,
      client_name: r.client_name,
      client_phone: r.client_phone,
      client_email: r.client_email,
      field_id: r.field_id,
      field_name: f ? f.name : (r.field_name || 'Cancha'),
      venue_id: r.venue_id,
      venue_name: v ? v.name : 'Complejo Deportivo',
      booking_date: r.booking_date,
      start_time: r.start_time,
      end_time: r.end_time,
      status: r.status,
      payment_status: r.payment_status,
      payment_mode: r.payment_mode,
      receipt_url: r.receipt_url || null,
      court_value: courtValue,
      court_price: courtValue,
      deposit_paid: depositPaid,
      court_deposit_paid: depositPaid,
      court_pending: courtPending,
      court_pending_balance: courtPending,
      pos_items: posItems,
      cafeteria_items: posItems.map(p => ({
        product_name: p.name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        subtotal: p.subtotal
      })),
      pos_total: posTotal,
      cafeteria_total: posTotal,
      total_net_due: totalNetDue,
      grand_total_due: totalNetDue,
      notes: r.notes || ''
    };
  },

  settleFolio: async (reservationId, settlementData = {}) => {
    const idx = inMemoryStore.reservations.findIndex(r => r.id === reservationId);
    if (idx === -1) return null;

    const r = inMemoryStore.reservations[idx];
    const folio = await db.getFolio(reservationId);
    if (!folio) return null;

    const cashPaid = Number(settlementData.cash_amount || 0);
    const electronicPaid = Number(settlementData.electronic_amount || 0);
    const totalReceived = cashPaid + electronicPaid;

    // Actualizar la reserva
    r.deposit_paid = r.total_amount;
    r.remaining_balance = 0;
    r.payment_status = 'paid';
    r.status = 'completed';
    r.updated_at = new Date().toISOString();

    // Actualizar órdenes de POS asociadas a 'paid'
    inMemoryStore.pos_orders.forEach(o => {
      if (o.reservation_id === reservationId && o.status === 'open') {
        o.status = 'paid';
        o.paid_at = new Date().toISOString();
        o.payment_method = settlementData.payment_method || (electronicPaid > 0 && cashPaid === 0 ? 'electronic' : 'cash');
      }
    });

    // Impactar arqueo de caja de la sede si hay turno abierto
    const shift = inMemoryStore.cash_shifts.find(s => s.venue_id === r.venue_id && !s.is_closed);
    if (shift) {
      if (cashPaid > 0) {
        shift.expected_cash = (shift.expected_cash || 0) + cashPaid;
      }
      if (electronicPaid > 0) {
        shift.total_electronic_sales = (shift.total_electronic_sales || 0) + electronicPaid;
      }
      shift.court_sales = (shift.court_sales || 0) + folio.court_pending;
      shift.cafeteria_sales = (shift.cafeteria_sales || 0) + folio.pos_total;
    }

    return {
      success: true,
      reservation: r,
      total_settled: folio.total_net_due,
      total_received: totalReceived,
      change: Math.max(0, totalReceived - folio.total_net_due),
      folio: await db.getFolio(reservationId)
    };
  },

  // ============================================================
  // MEDIOS DE PAGO POR SEDE (ADMIN SEDE)
  // ============================================================
  findVenuePaymentMethods: async (venueId) => {
    const v = inMemoryStore.venues.find(ven => ven.id === venueId || ven.slug === venueId);
    if (!v) return null;
    const raw = v.payment_methods || {};
    const nequiPhone = raw.nequi?.phone_number || raw.nequi_number || v.phone || '3006799595';
    const nequiHolder = raw.nequi?.account_name || raw.nequi_holder || v.admin_name || v.name;
    const daviPhone = raw.daviplata?.phone_number || raw.daviplata_number || v.phone || '3006799595';
    const daviHolder = raw.daviplata?.account_name || raw.daviplata_holder || v.admin_name || v.name;
    const bancoType = raw.bancolombia?.account_type || raw.bancolombia_type || 'Ahorros';
    const bancoNum = raw.bancolombia?.account_number || raw.bancolombia_number || '245-000123-45';
    const bancoHolder = raw.bancolombia?.account_name || raw.bancolombia_holder || v.name;
    const breB = raw.bancolombia?.bre_b_key || raw.bre_b_code || 'BREB-01';

    return {
      ...raw,
      nequi_number: nequiPhone,
      nequi_holder: nequiHolder,
      daviplata_number: daviPhone,
      daviplata_holder: daviHolder,
      bancolombia_type: bancoType,
      bancolombia_number: bancoNum,
      bancolombia_holder: bancoHolder,
      bre_b_code: breB,
      cash_accepted: raw.cash_accepted ?? raw.cash_on_arrival ?? true,
      wompi_enabled: raw.wompi_enabled ?? raw.wompi?.is_active ?? true,
      deposit_percentage: v.deposit_percentage || 50,
      nequi: {
        phone_number: nequiPhone,
        account_name: nequiHolder,
        qr_code_url: raw.nequi?.qr_code_url || null,
        is_active: raw.nequi?.is_active ?? true
      },
      daviplata: {
        phone_number: daviPhone,
        account_name: daviHolder,
        is_active: raw.daviplata?.is_active ?? true
      },
      bancolombia: {
        account_type: bancoType,
        account_number: bancoNum,
        account_name: bancoHolder,
        bre_b_key: breB,
        is_active: raw.bancolombia?.is_active ?? true
      },
      wompi: {
        public_key: raw.wompi?.public_key || raw.wompi_public_key || 'pub_prod_wompi_demo',
        is_active: raw.wompi?.is_active ?? raw.wompi_enabled ?? true
      },
      cash_on_arrival: raw.cash_on_arrival ?? raw.cash_accepted ?? true
    };
  },

  updateVenuePaymentMethods: async (venueId, methods) => {
    const v = inMemoryStore.venues.find(ven => ven.id === venueId || ven.slug === venueId);
    if (!v) return null;
    v.payment_methods = { ...(v.payment_methods || {}), ...methods };
    if (methods.deposit_percentage) {
      v.deposit_percentage = Number(methods.deposit_percentage);
    }
    v.updated_at = new Date().toISOString();
    return db.findVenuePaymentMethods(venueId);
  },

  // ============================================================
  // FACTURACIÓN SAAS & PLANES (SUPERADMIN)
  // ============================================================
  getSaasBillingOverview: async () => {
    const plans = inMemoryStore.saas_plans || [];
    const venues = inMemoryStore.venues.map(v => {
      const plan = plans.find(p => p.id === v.saas_plan) || plans[0];
      const fields = inMemoryStore.fields.filter(f => f.venue_id === v.id);
      return {
        venue_id: v.id,
        venue_name: v.name,
        slug: v.slug,
        city: v.city,
        phone: v.phone,
        email: v.email,
        is_active: v.is_active,
        fields_count: fields.length,
        saas_plan: v.saas_plan || 'pro',
        saas_plan_name: plan ? plan.name : (v.saas_plan_name || 'Plan Pro'),
        saas_monthly_fee: Number(v.saas_monthly_fee || (plan ? plan.monthly_price : 299000)),
        saas_status: v.saas_status || (v.is_active ? 'al_dia' : 'en_mora'),
        saas_next_billing: v.saas_next_billing || '2026-11-30',
        saas_last_payment: v.saas_last_payment || '2026-10-30'
      };
    });

    const activeVenues = venues.filter(v => v.is_active);
    const mrr = activeVenues.reduce((sum, v) => sum + v.saas_monthly_fee, 0);

    return {
      plans,
      venues,
      summary: {
        total_venues: venues.length,
        active_venues: activeVenues.length,
        suspended_venues: venues.filter(v => !v.is_active).length,
        al_dia_count: venues.filter(v => v.saas_status === 'al_dia').length,
        por_vencer_count: venues.filter(v => v.saas_status === 'por_vencer').length,
        en_mora_count: venues.filter(v => v.saas_status === 'en_mora').length,
        total_mrr: mrr
      }
    };
  },

  recordSaasPayment: async (venueId, amount = null) => {
    const v = inMemoryStore.venues.find(ven => ven.id === venueId || ven.slug === venueId);
    if (!v) return null;
    v.saas_status = 'al_dia';
    v.saas_last_payment = new Date().toISOString().split('T')[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);
    v.saas_next_billing = nextDate.toISOString().split('T')[0];
    v.is_active = true;
    v.updated_at = new Date().toISOString();
    return v;
  },

  // ============================================================
  // CLIENTES Y CUENTAS POR COBRAR (ADMIN SEDE)
  // ============================================================
  getVenueClients: async (venueId) => {
    const reservations = inMemoryStore.reservations.filter(r => !venueId || r.venue_id === venueId);
    const clientMap = new Map();

    for (const r of reservations) {
      const key = r.client_phone || r.client_name;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: r.client_name,
          phone: r.client_phone,
          email: r.client_email,
          total_bookings: 0,
          total_court_pending: 0,
          total_pos_pending: 0,
          total_debt: 0,
          last_booking_date: r.booking_date,
          reservations_ids: []
        });
      }

      const client = clientMap.get(key);
      client.total_bookings += 1;
      client.reservations_ids.push(r.id);

      // Calcular deuda pendiente de cancha
      const courtPending = Math.max(0, Number(r.total_amount || 0) - Number(r.deposit_paid || 0));
      client.total_court_pending += courtPending;

      // Calcular órdenes de cafetería abiertas
      const openOrders = inMemoryStore.pos_orders.filter(o => o.reservation_id === r.id && o.status === 'open');
      const posPending = openOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      client.total_pos_pending += posPending;

      client.total_debt = client.total_court_pending + client.total_pos_pending;

      if (r.booking_date > client.last_booking_date) {
        client.last_booking_date = r.booking_date;
      }
    }

    return Array.from(clientMap.values()).sort((a, b) => b.total_debt - a.total_debt);
  },

  // ============================================================
  // HISTORIAL DE CIERRES DE CAJA Y REPORTES (ADMIN SEDE)
  // ============================================================
  getShiftHistory: async (venueId) => {
    const shifts = inMemoryStore.cash_shifts.filter(s => !venueId || s.venue_id === venueId);
    return shifts.map(s => {
      const courtsIncome = Number(s.court_sales || Math.round(Number(s.expected_cash || 0) * 0.7));
      const cafeteriaIncome = Number(s.cafeteria_sales || Math.round(Number(s.expected_cash || 0) * 0.3));
      const totalCollected = Number(s.total_sales || (courtsIncome + cafeteriaIncome));
      return {
        ...s,
        court_sales: courtsIncome,
        courts_income: courtsIncome,
        cafeteria_sales: cafeteriaIncome,
        cafeteria_income: cafeteriaIncome,
        total_sales: totalCollected,
        total_collected: totalCollected,
        cash_collected: Number(s.actual_cash || s.expected_cash || 0),
        electronic_collected: Number(s.total_electronic_sales || 0),
        cashier_name: s.staff_name || 'Carlos Canchero & POS',
        date: s.opened_at ? s.opened_at.split('T')[0] : '2026-11-14',
        start_time: s.opened_at ? s.opened_at.split('T')[1].slice(0, 5) : '08:00',
        end_time: s.closed_at ? s.closed_at.split('T')[1].slice(0, 5) : '16:00'
      };
    }).sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at));
  }
};

module.exports = db;
