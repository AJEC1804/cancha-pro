-- ============================================================
-- CANCHA PRO — SISTEMA INTEGRAL DE GESTIÓN DE CANCHAS SINTÉTICAS
-- Arquitectura Multi-Tenant, Prevención Anti-Double Booking (GiST)
-- Motor de Reservas, La Vaca Digital, POS Cafetería e IoT
-- Versión 1.0 (PostgreSQL 14+)
-- ============================================================

-- Habilitar extensiones requeridas para UUIDs y exclusiones de rangos temporales
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ── 1. SEDES / COMPLEJOS DEPORTIVOS (MULTI-TENANCY) ──────────────
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    iot_broker_url VARCHAR(255),
    iot_api_token VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. USUARIOS Y CONTROL DE ACCESO (RBAC) ────────────────────────
-- Roles:
-- 'superadmin'   : Dueño del SaaS. Administra todas las sedes, crea nuevos complejos.
-- 'tenant_admin' : Dueño/Administrador de una sede específica. Ajusta precios, horarios, personal.
-- 'staff'        : Empleado / Canchero. Atiende reservas en mostrador y POS de cafetería.
-- 'cliente'      : Jugador. Consulta disponibilidad, reserva, participa en La Vaca.
CREATE TYPE user_role_enum AS ENUM ('superadmin', 'tenant_admin', 'staff', 'cliente');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL, -- NULL para superadmin y clientes globales
    role user_role_enum NOT NULL DEFAULT 'cliente',
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    document_id VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_email UNIQUE (email)
);

CREATE INDEX idx_users_venue_role ON users(venue_id, role);
CREATE INDEX idx_users_phone ON users(phone);

-- ── 3. CANCHAS / INSTALACIONES DEPORTIVAS ────────────────────────
CREATE TYPE sport_type_enum AS ENUM ('futbol_5', 'futbol_7', 'futbol_9', 'padel', 'tenis', 'voleibol');
CREATE TYPE surface_type_enum AS ENUM ('sintetica_monofilamento', 'sintetica_fibrilada', 'grama_natural', 'vidrio_padel', 'concreto_pulido');

CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    sport_type sport_type_enum NOT NULL DEFAULT 'futbol_5',
    surface_type surface_type_enum NOT NULL DEFAULT 'sintetica_monofilamento',
    default_price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 130000.00,
    peak_price_per_hour NUMERIC(12,2) NOT NULL DEFAULT 150000.00,
    open_time TIME NOT NULL DEFAULT '06:00:00',
    close_time TIME NOT NULL DEFAULT '23:00:00',
    iot_relay_channel INT, -- Canal de relé para iluminación (ej. 1, 2, 3...)
    iot_device_id VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fields_venue ON fields(venue_id);

-- ── 4. REGLAS DE PRECIOS DINÁMICOS POR FRANJA Y DÍA ──────────────
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price_per_hour NUMERIC(12,2) NOT NULL,
    is_peak_hour BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 5. MOTOR DE RESERVAS CON EXCLUSION ANTI-DOUBLE BOOKING ────────
CREATE TYPE reservation_status_enum AS ENUM (
    'held',         -- Bloqueo temporal de 10 minutos esperando pago
    'confirmed',    -- Confirmada con abono o pago total
    'in_progress',  -- Partido en curso
    'completed',    -- Partido terminado
    'cancelled',    -- Cancelada por el cliente o admin
    'expired'       -- Expiró el temporizador de 10 min sin pago
);

CREATE TYPE payment_status_enum AS ENUM (
    'pending',      -- Sin pago
    'partial',      -- Abono del 50% recibido
    'paid',         -- 100% de la cancha pagado
    'refunded'      -- Reembolsado
);

CREATE TYPE payment_mode_enum AS ENUM (
    'full',         -- Pago 100% por un solo cliente
    'deposit_50',   -- Abono inicial del 50%
    'vaca_split'    -- "La Vaca Digital" (pago dividido entre varios jugadores)
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(30) NOT NULL,
    client_email VARCHAR(150) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status reservation_status_enum NOT NULL DEFAULT 'held',
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_mode payment_mode_enum NOT NULL DEFAULT 'deposit_50',
    total_amount NUMERIC(12,2) NOT NULL,
    deposit_required NUMERIC(12,2) NOT NULL,
    deposit_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(12,2) NOT NULL,
    held_until TIMESTAMPTZ NOT NULL, -- Timestamp exacto de expiración (10 min)
    accepted_terms BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    receipt_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RESTRICCIÓN DE EXCLUSIÓN A NIVEL DE MOTOR POSTGRESQL (Anti-Double Booking estricto)
    -- Impide físicamente cualquier solapamiento de rangos de tiempo para una misma cancha,
    -- a menos que la reserva esté cancelada o expirada.
    CONSTRAINT no_overlapping_reservations
    EXCLUDE USING gist (
        field_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status NOT IN ('cancelled', 'expired'))
);

CREATE INDEX idx_reservations_venue_date ON reservations(venue_id, booking_date);
CREATE INDEX idx_reservations_status_held ON reservations(status, held_until);

-- ── 6. "LA VACA DIGITAL" (PAGOS DIVIDIDOS ENTRE JUGADORES) ───────
CREATE TABLE IF NOT EXISTS vaca_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    player_name VARCHAR(120) NOT NULL,
    player_phone VARCHAR(30),
    share_amount NUMERIC(12,2) NOT NULL,
    payment_token VARCHAR(64) NOT NULL UNIQUE,
    payment_status payment_status_enum NOT NULL DEFAULT 'pending',
    payment_reference VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vaca_splits_res ON vaca_splits(reservation_id);
CREATE INDEX idx_vaca_splits_token ON vaca_splits(payment_token);

-- ── 7. PUNTO DE VENTA (POS) Y CONTROL DE INVENTARIO ───────────────
CREATE TABLE IF NOT EXISTS pos_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'coffee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pos_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX idx_pos_products_venue ON pos_products(venue_id);

-- Órdenes de Cafetería / Tienda (Permite "Cargar a Cancha X")
CREATE TYPE order_status_enum AS ENUM ('open', 'paid', 'cancelled');
CREATE TYPE order_pay_method_enum AS ENUM ('cash', 'nequi', 'daviplata', 'card', 'charged_to_field');

CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL, -- Enlace para cuenta abierta en cancha
    staff_user_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status order_status_enum NOT NULL DEFAULT 'open',
    payment_method order_pay_method_enum,
    paid_at TIMESTAMPTZ,
    notes VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pos_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES pos_products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
);

-- ── 8. CIERRE DE CAJA Y ARQUEO POR TURNO ──────────────────────────
CREATE TABLE IF NOT EXISTS cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    staff_user_id UUID NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    initial_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(12,2),
    difference NUMERIC(12,2), -- Descuadre (sobrante o faltante)
    total_electronic_sales NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- Nequi, PSE, Tarjetas
    notes TEXT,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── 9. GESTIÓN DE TORNEOS Y CAMPEONATOS ───────────────────────────
CREATE TYPE tournament_format_enum AS ENUM ('round_robin', 'single_elimination', 'group_and_playoff');

CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    sport_type sport_type_enum NOT NULL DEFAULT 'futbol_5',
    format tournament_format_enum NOT NULL DEFAULT 'round_robin',
    start_date DATE NOT NULL,
    end_date DATE,
    inscription_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    max_teams INT NOT NULL DEFAULT 8,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TABLE IF NOT EXISTS tournament_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    home_team_id UUID NOT NULL REFERENCES tournament_teams(id),
    away_team_id UUID NOT NULL REFERENCES tournament_teams(id),
    field_id UUID REFERENCES fields(id),
    scheduled_time TIMESTAMPTZ,
    home_score INT,
    away_score INT,
    is_finished BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── 10. AUTOMATIZACIÓN IoT (RELÉS Y SENSORES) ─────────────────────
CREATE TABLE IF NOT EXISTS iot_relay_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'TURN_ON', 'TURN_OFF', 'COURTESY_MODE'
    trigger_source VARCHAR(50) NOT NULL, -- 'AUTO_SCHEDULER', 'MANUAL_OVERRIDE'
    device_id VARCHAR(100),
    relay_channel INT,
    payload JSONB,
    status_response VARCHAR(100),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 11. PROCEDIMIENTO AUTOMÁTICO DE LIMPIEZA DE RESERVAS EXPIRADAS ─
-- Se ejecuta periódicamente para liberar reservas en estado 'held' que superaron los 10 min
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
