-- ============================================================
-- CANCHA PRO — ESQUEMA COMPLETO PARA SUPABASE POSTGRESQL
-- Plataforma SaaS de Gestión de Canchas Sintéticas
-- Incluye: Tablas, Extensiones GiST Anti-Double Booking,
-- Políticas RLS y Datos Semilla Iniciales
-- ============================================================

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Sedes / Complejos Deportivos
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    nit_rut VARCHAR(50),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(300) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Cartagena',
    open_time TIME NOT NULL DEFAULT '06:00:00',
    close_time TIME NOT NULL DEFAULT '23:00:00',
    slot_duration_minutes INT NOT NULL DEFAULT 60,
    deposit_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    hold_timeout_minutes INT NOT NULL DEFAULT 10,
    cancellation_hours_notice INT NOT NULL DEFAULT 6,
    rules_and_conditions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Usuarios y Roles (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'cliente', -- 'superadmin', 'tenant_admin', 'staff', 'cliente'
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    document_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_venue_role ON users(venue_id, role);

-- 4. Canchas / Instalaciones Deportivas
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    sport_type VARCHAR(50) NOT NULL DEFAULT 'futbol_5', -- 'futbol_5', 'futbol_7', 'futbol_9', 'padel'
    surface_type VARCHAR(50) NOT NULL DEFAULT 'sintetica_monofilamento',
    default_price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 130000.00,
    peak_price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 150000.00,
    open_time TIME NOT NULL DEFAULT '06:00:00',
    close_time TIME NOT NULL DEFAULT '23:00:00',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fields_venue ON fields(venue_id);

-- 5. Reservas con Exclusión Anti-Double Booking
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(30) NOT NULL,
    client_email VARCHAR(150) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'held', -- 'held', 'confirmed', 'in_progress', 'completed', 'cancelled', 'expired'
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'refunded'
    payment_mode VARCHAR(30) NOT NULL DEFAULT 'deposit_50', -- 'full', 'deposit_50', 'vaca_split'
    total_amount NUMERIC(12,2) NOT NULL,
    deposit_required NUMERIC(12,2) NOT NULL,
    deposit_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(12,2) NOT NULL,
    held_until TIMESTAMPTZ NOT NULL, -- Expiración de 10 min
    accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    receipt_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT no_overlapping_reservations
    EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status NOT IN ('cancelled', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_reservations_venue_date ON reservations(venue_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status_held ON reservations(status, held_until);

-- 6. "La Vaca Digital" (Pagos Divididos)
CREATE TABLE IF NOT EXISTS vaca_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    player_phone VARCHAR(30),
    share_amount NUMERIC(12,2) NOT NULL,
    payment_token VARCHAR(64) NOT NULL UNIQUE,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vaca_splits_res ON vaca_splits(reservation_id);
CREATE INDEX IF NOT EXISTS idx_vaca_splits_token ON vaca_splits(payment_token);

-- 7. POS Cafetería e Inventario
CREATE TABLE IF NOT EXISTS pos_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'coffee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pos_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    category_id UUID REFERENCES pos_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    barcode VARCHAR(50),
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12,2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL, -- Cuenta a la cancha
    staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'open', -- 'open', 'paid', 'cancelled'
    payment_method VARCHAR(50), -- 'cash', 'nequi', 'daviplata', 'card', 'charged_to_field'
    paid_at TIMESTAMPTZ,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Cierre de Caja (Arqueo por Turno)
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    staff_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(12,2),
    difference NUMERIC(12,2),
    total_electronic_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

-- 9. Torneos y Equipos
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sport_type VARCHAR(50) NOT NULL DEFAULT 'futbol_5',
    format VARCHAR(50) NOT NULL DEFAULT 'round_robin',
    start_date DATE NOT NULL,
    end_date DATE,
    inscription_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    max_teams INT NOT NULL DEFAULT 8,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    team_name VARCHAR(150) NOT NULL,
    captain_name VARCHAR(150) NOT NULL,
    captain_phone VARCHAR(30) NOT NULL,
    points INT NOT NULL DEFAULT 0,
    matches_played INT NOT NULL DEFAULT 0,
    matches_won INT NOT NULL DEFAULT 0,
    matches_drawn INT NOT NULL DEFAULT 0,
    matches_lost INT NOT NULL DEFAULT 0,
    goals_for INT NOT NULL DEFAULT 0,
    goals_against INT NOT NULL DEFAULT 0,
    goal_difference INT NOT NULL DEFAULT 0
);

-- 10. Función para Expirar Reservas Retenidas
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS INT AS $$
DECLARE
    affected_rows INT;
BEGIN
    UPDATE reservations
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE status = 'held'
      AND held_until < CURRENT_TIMESTAMP;
      
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaca_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_teams ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública para anon / clientes
CREATE POLICY "Public Read Venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public Read Fields" ON fields FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON pos_categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON pos_products FOR SELECT USING (true);
CREATE POLICY "Public Read Tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Public Read Teams" ON tournament_teams FOR SELECT USING (true);
CREATE POLICY "Public Read Reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Public Read Vaca" ON vaca_splits FOR SELECT USING (true);

-- Políticas de inserción y modificación para servicio autenticado
CREATE POLICY "Public Insert Reservations" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Reservations" ON reservations FOR UPDATE USING (true);
CREATE POLICY "Public Insert Vaca" ON vaca_splits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Vaca" ON vaca_splits FOR UPDATE USING (true);
CREATE POLICY "Public Full Access Fields" ON fields FOR ALL USING (true);
CREATE POLICY "Public Full Access Orders" ON pos_orders FOR ALL USING (true);

-- 12. DATOS SEMILLA INICIALES (La Bernabéu Cartagena y Camp Nou Arena Bogotá)
INSERT INTO venues (id, slug, name, nit_rut, phone, email, address, city, open_time, close_time, slot_duration_minutes, deposit_percentage, hold_timeout_minutes, cancellation_hours_notice, rules_and_conditions)
VALUES 
('a0000000-0000-0000-0000-000000000001', 'la-bernabeu', 'Complejo Deportivo La Bernabéu', '901456789-1', '3006799595', 'contacto@labernabeu.co', 'Dg al CC San Fernando, detrás del Totumazo Cartagenero', 'Cartagena', '06:00:00', '23:00:00', 60, 50.00, 10, 6, 'Uso obligatorio de tenis turf. Prohibido taches de aluminio.'),
('a0000000-0000-0000-0000-000000000002', 'camp-nou-arena', 'Camp Nou Arena VIP', '900987654-3', '3158889900', 'info@campnouarena.co', 'Calle 127 # 45-20, Autopista Norte', 'Bogotá', '06:00:00', '23:00:00', 60, 50.00, 10, 6, 'Presentar documento de identidad al ingreso.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, venue_id, role, name, email, phone, document_id, password_hash)
VALUES 
('u0000000-0000-0000-0000-000000000001', NULL, 'superadmin', 'Alejandro SuperAdmin', 'superadmin@canchapro.com', '3000000001', '1047499888', '$2b$10$hashedadmin123'),
('u0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'tenant_admin', 'Carlos Mendoza', 'admin@labernabeu.co', '3006799595', '73111222', '$2b$10$hashedmendoza123'),
('u0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'staff', 'Javier Canchero', 'javier@labernabeu.co', '3109998877', '92333444', '$2b$10$hashedjavier123')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fields (id, venue_id, name, sport_type, surface_type, default_price_per_hour, peak_price_per_hour, open_time, close_time, is_active, description)
VALUES 
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cancha 1 — Santiago Bernabéu (5v5)', 'futbol_5', 'sintetica_monofilamento', 130000.00, 150000.00, '06:00:00', '23:00:00', true, 'Grama sintética monofilamento de 50mm con caucho criogénico'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cancha 2 — San Siro (5v5)', 'futbol_5', 'sintetica_monofilamento', 120000.00, 140000.00, '06:00:00', '23:00:00', true, 'Excelente amortiguación, enmallado completo y graderías cubiertas'),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Cancha 3 — La Bombonera (7v7)', 'futbol_7', 'sintetica_fibrilada', 180000.00, 220000.00, '06:00:00', '23:00:00', true, 'Medidas reglamentarias para fútbol 7'),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Cancha Camp Nou Central (5v5)', 'futbol_5', 'sintetica_monofilamento', 140000.00, 160000.00, '06:00:00', '23:00:00', true, 'Cancha techada con iluminación profesional')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pos_categories (id, venue_id, name, icon)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Hidratación & Bebidas', 'cup-straw'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Snacks & Comida', 'cookie'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Equipamiento & Alquiler', 'shield')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pos_products (id, venue_id, category_id, name, barcode, cost_price, sale_price, stock_quantity, min_stock_alert)
VALUES 
('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Gatorade 500ml (Varios Sabores)', '7701234567890', 3200.00, 5000.00, 48, 10),
('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Agua Cristal 600ml sin gas', '7701234567891', 1200.00, 2500.00, 80, 15),
('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Cerveza Águila / Club Colombia Lata', '7701234567892', 2800.00, 5000.00, 72, 12),
('p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'Papas Margarita Pollo / Natural', '7701234567893', 1800.00, 3000.00, 35, 8),
('p0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Alquiler Set de Petos (10 u.)', 'ALQ-PETOS-01', 0.00, 10000.00, 10, 2),
('p0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'Alquiler Balón Golty Profesional N° 4/5', 'ALQ-BALON-01', 0.00, 8000.00, 6, 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournaments (id, venue_id, name, sport_type, format, start_date, end_date, inscription_fee, max_teams, is_active)
VALUES 
('t0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Copa Nocturna La Bernabéu 2026', 'futbol_5', 'round_robin', '2026-11-15', '2026-12-20', 350000.00, 8, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tournament_teams (id, tournament_id, team_name, captain_name, captain_phone, points, matches_played, matches_won, matches_drawn, matches_lost, goals_for, goals_against, goal_difference)
VALUES 
('tt000000-0000-0000-0000-000000000001', 't0000000-0000-0000-0000-000000000001', 'Los Galácticos FC', 'David Beckham', '3001112233', 9, 3, 3, 0, 0, 14, 4, 10),
('tt000000-0000-0000-0000-000000000002', 't0000000-0000-0000-0000-000000000001', 'San Fernando City', 'Carlos Bacca', '3004445566', 6, 3, 2, 0, 1, 10, 6, 4),
('tt000000-0000-0000-0000-000000000003', 't0000000-0000-0000-0000-000000000001', 'Cartagena United', 'Wilmar Barrios', '3007778899', 3, 3, 1, 0, 2, 7, 9, -2),
('tt000000-0000-0000-0000-000000000004', 't0000000-0000-0000-0000-000000000001', 'Totumazo Stars', 'Teófilo Gutiérrez', '3009990011', 0, 3, 0, 0, 3, 3, 15, -12)
ON CONFLICT (id) DO NOTHING;
