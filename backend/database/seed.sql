-- ============================================================
-- CANCHA PRO — DATOS SEMILLA (SEED DATA)
-- Incluye Superadmin, Sedes, Canchas, Reglas de Precios, POS e Inventario
-- ============================================================

-- 1. Sedes Deportivas (Multi-tenant)
INSERT INTO venues (id, slug, name, nit_rut, phone, email, address, city, open_time, close_time, slot_duration_minutes, deposit_percentage, hold_timeout_minutes, rules_and_conditions)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'la-bernabeu',
    'Complejo Deportivo La Bernabéu',
    '901456789-1',
    '3006799595',
    'contacto@labernabeu.co',
    'Dg al CC San Fernando, detrás del Totumazo Cartagenero',
    'Cartagena',
    '06:00:00',
    '23:00:00',
    60,
    50.00,
    10,
    'Uso obligatorio de calzado tipo turf (guayos de goma sintética). No se permiten taches de aluminio. Llegar 15 minutos antes. Para cancelar y reprogramar se requiere mínimo 6 horas de anticipación.'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'camp-nou-arena',
    'Camp Nou Arena VIP',
    '900987654-3',
    '3158889900',
    'info@campnouarena.co',
    'Calle 127 # 45-20, Autopista Norte',
    'Bogotá',
    '06:00:00',
    '23:00:00',
    60,
    50.00,
    10,
    'Presentar documento de identidad al ingreso. Vestuarios y duchas incluidas. Tolerancia de espera: 10 minutos.'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Usuarios del Sistema (Superadmin, Tenant Admin, Staff, Cliente)
-- Hash para demo: bcrypt de 'admin123' o 'cliente123'
INSERT INTO users (id, venue_id, role, name, email, phone, document_id, password_hash)
VALUES
-- SUPERADMIN DE LA PLATAFORMA (El dueño del SaaS / Alejandro)
(
    'u0000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin',
    'Alejandro SuperAdmin',
    'superadmin@canchapro.com',
    '3000000001',
    '1047499888',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- admin123
),
-- ADMIN DE SEDE LA BERNABÉU
(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'tenant_admin',
    'Don Mario Administrador',
    'admin@bernabeu.com',
    '3006799595',
    '73123456',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- admin123
),
-- CANCHERO / EMPLEADO EN LA BERNABÉU
(
    'u0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'staff',
    'Carlos Canchero & POS',
    'canchero@bernabeu.com',
    '3104567890',
    '1047200300',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- admin123
),
-- CLIENTE JUGADOR
(
    'u0000000-0000-0000-0000-000000000004',
    NULL,
    'cliente',
    'Mateo Jugador',
    'mateo@gmail.com',
    '3012345678',
    '1143322110',
    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW' -- admin123
)
ON CONFLICT (email) DO NOTHING;

-- 3. Canchas de La Bernabéu
INSERT INTO fields (id, venue_id, name, sport_type, surface_type, default_price_per_hour, peak_price_per_hour, open_time, close_time, iot_relay_channel, iot_device_id, description)
VALUES
(
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Cancha 1: La Bernabéu Principal (Fútbol 5)',
    'futbol_5',
    'sintetica_monofilamento',
    110000.00,
    130000.00,
    '06:00:00',
    '23:00:00',
    1,
    'ESP32_RELAY_SEDELABERNABEU_01',
    'Cancha sintética profesional 5v5 con iluminación LED de alta potencia y cerramiento perimetral nuevo.'
),
(
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Cancha 2: Maracaná Express (Fútbol 7)',
    'futbol_7',
    'sintetica_monofilamento',
    160000.00,
    190000.00,
    '06:00:00',
    '23:00:00',
    2,
    'ESP32_RELAY_SEDELABERNABEU_01',
    'Cancha para fútbol 7 con zona de gradería cubierta y tableros electrónicos.'
),
(
    'f0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Cancha 3: Pádel Pro Glass',
    'padel',
    'vidrio_padel',
    90000.00,
    120000.00,
    '06:00:00',
    '23:00:00',
    3,
    'ESP32_RELAY_SEDELABERNABEU_01',
    'Pista de pádel panorámica con césped texturizado azul y cristal templado de 12mm.'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Categorías y Productos de Cafetería / Inventario
INSERT INTO pos_categories (id, venue_id, name, icon)
VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Bebidas e Hidratación', 'glass'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cervezas y Licores', 'beer'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Snacks y Comida Rápida', 'fastfood'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Alquiler y Deporte', 'sports')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pos_products (venue_id, category_id, name, cost_price, sale_price, stock_quantity, min_stock_alert)
VALUES
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Gatorade 500ml (Varios Sabores)', 3500.00, 6000.00, 48, 10),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Agua Cristal 600ml', 1200.00, 2500.00, 72, 12),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Cerveza Corona Extra 355ml', 4500.00, 8500.00, 96, 15),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Cerveza Club Colombia Dorada', 3200.00, 6500.00, 80, 15),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Empanada de Carne / Pollo', 2000.00, 4000.00, 30, 5),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Alquiler Petos (Juego x 10)', 2000.00, 10000.00, 10, 2),
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Alquiler Balón Golty Profesional', 3000.00, 12000.00, 8, 2);
