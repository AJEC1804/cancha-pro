# ⚽ CANCHA PRO — Plataforma Integral de Gestión para Canchas Sintéticas

Sistema integral para administración de complejos deportivos y canchas sintéticas. Diseñado específicamente para resolver los problemas críticos del negocio: la **"cancha vacía" (no-shows)**, el **desorden de reservas**, el **descontrol en cafetería e inventario**, la **ineficiencia energética** y los **procesos de cobro manuales**.

Basado en la experiencia operativa y requerimientos reales de **La Bernabéu** (Cartagena de Indias).

---

## 🚀 Arquitectura y Stack Tecnológico

- **Frontend**: HTML5, CSS3 con Tailwind CSS (Paleta deportiva oficial: `#0B0F19` Fondo, `#10B981` Verde Césped, `#1E293B` Gris Pizarra, `#F59E0B` Alertas). Totalmente responsivo para móvil y escritorio.
- **Backend**: Node.js con Express, arquitectura modular, temporizador asíncrono para bloqueo temporal (10 min TTL), soporte para Server-Sent Events / WebSockets y despacho de eventos IoT.
- **Base de Datos**: PostgreSQL (con extensiones `uuid-ossp` y `btree_gist` para **Exclusion Constraints** a nivel de motor contra Race Conditions y doble reserva). Incluye capa de persistencia reactiva out-of-the-box para ejecución inmediata sin dependencias externas.
- **Automatización e Integraciones**:
  - Relés de iluminación LED vía MQTT y HTTP Webhooks (Sonoff / Shelly / ESP32).
  - Pasarelas locales: Nequi, Daviplata, PSE (Wompi / MercadoPago).
  - Mensajes preformateados para WhatsApp con links directos a **La Vaca Digital**.

---

## 👥 Jerarquía de Usuarios y Control de Acceso (RBAC)

1. **👑 SuperUsuario (Plataforma Global - Alejandro)**:
   - Administra todas las sedes del país (multi-tenancy).
   - Puede agregar nuevos complejos deportivos / negocios al sistema.
   - Acceso a métricas consolidadas (ingresos globales, comisión de plataforma).
   - *Credenciales demo:* `superadmin@canchapro.com` / `admin123`

2. **🏢 Administrador de Sede (Dueño del Negocio - Don Mario)**:
   - Administra su propia sede (ej. *Complejo La Bernabéu*).
   - Ajusta horarios de apertura y cierre (ej. 06:00 a 23:00) y tiempo mínimo de preaviso para cancelaciones (6h).
   - Configura tarifas dinámicas por franja horaria: **Hora Valle** vs **Hora Pico** (a partir de las 17:00).
   - Crea usuarios y credenciales para sus empleados / cancheros.
   - *Credenciales demo:* `admin@bernabeu.com` / `admin123`

3. **⚡ Canchero / Staff de Mostrador (Carlos)**:
   - Consulta la parrilla horaria en tiempo real y realiza check-in de jugadores al llegar.
   - **Punto de Venta Cafetería (POS)** con botón **"Cargar a Cancha X"** (acumula consumos al saldo del partido).
   - **Arqueo y Cierre de Caja por Turno**: Detecta descuadres (sobrante/faltante) entre ventas y efectivo físico.
   - **Control de Iluminación IoT**: Interruptores digitales para encender/apagar focos LED o activar modo cortesía de 5 minutos.
   - *Credenciales demo:* `canchero@bernabeu.com` / `admin123`

4. **⚽ Cliente / Jugador (Mateo)**:
   - Consulta disponibilidad interactiva hora por hora en la landing.
   - Retiene su turno temporalmente por 10 minutos para pagar el 50% o el 100%.
   - Inicia **"La Vaca Digital"**: divide el valor entre N amigos, genera link único y mensaje para grupos de WhatsApp.
   - *Credenciales demo:* `mateo@gmail.com` / `cliente123`

---

## 📦 Estructura del Proyecto

```
CANCHA_PRO/
├── backend/
│   ├── database/
│   │   ├── schema.sql           # DDL PostgreSQL con GiST Anti-Double Booking
│   │   └── seed.sql             # Datos semilla (La Bernabéu, Canchas, POS)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js      # Capa de datos con fallback reactivo
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── venueController.js
│   │   │   ├── reservationController.js
│   │   │   ├── vacaController.js
│   │   │   ├── posController.js
│   │   │   ├── tournamentController.js
│   │   │   └── iotController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT & RBAC Multi-Tenant
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── venueRoutes.js
│   │   │   ├── reservationRoutes.js
│   │   │   ├── vacaRoutes.js
│   │   │   ├── posRoutes.js
│   │   │   ├── tournamentRoutes.js
│   │   │   └── iotRoutes.js
│   │   ├── services/
│   │   │   ├── lockTimerService.js   # Motor de 10 min TTL y auto-liberación
│   │   │   └── iotService.js         # Disparo de relés de iluminación
│   │   └── app.js
│   ├── server.js                # Entrypoint servidor HTTP
│   └── package.json
├── frontend/
│   ├── index.html               # Landing de Alto Impacto + Parrilla Interactiva + La Vaca
│   ├── dashboard.html           # Panel unificado multi-rol (Superadmin, Admin Sede, Staff POS, Cliente)
│   ├── css/
│   │   └── custom.css           # Token system deportivo
│   └── js/
│       └── app.js               # Lógica reactiva de reservas, timers y POS
└── README.md
```

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Iniciar el Servidor Backend:
```bash
cd backend
npm install
npm start
```

El servidor quedará disponible en:
- 🌐 **Landing y Parrilla en Vivo**: [http://localhost:5000](http://localhost:5000)
- 📊 **Panel de Control Multi-Rol**: [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html)
- ⚡ **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Pruebas de Endpoints (Postman / cURL)

### 1. Consultar Parrilla de Disponibilidad
```http
GET /api/reservations/grid?venue_id=a0000000-0000-0000-0000-000000000001&field_id=f0000000-0000-0000-0000-000000000001&date=2026-11-10
```

### 2. Bloquear Turno por 10 Minutos (Anti No-Shows)
```http
POST /api/reservations/hold
Content-Type: application/json

{
  "venue_id": "a0000000-0000-0000-0000-000000000001",
  "field_id": "f0000000-0000-0000-0000-000000000001",
  "booking_date": "2026-11-10",
  "start_time": "21:00",
  "end_time": "22:00",
  "client_name": "Carlos Andrés",
  "client_phone": "3007779988",
  "client_email": "carlos@gmail.com",
  "payment_mode": "vaca_split"
}
```

### 3. Crear "La Vaca Digital" (Split de Tarifa)
```http
POST /api/vaca/initialize
Content-Type: application/json

{
  "reservation_id": "1c468885-5cde-4dee-93c7-242f6d2ee495",
  "total_players": 10
}
```

### 4. Cargar Consumos de Cafetería a la Cancha X
```http
POST /api/pos/orders
Authorization: Bearer <TOKEN_STAFF>
Content-Type: application/json

{
  "venue_id": "a0000000-0000-0000-0000-000000000001",
  "reservation_id": "res-demo-001",
  "payment_method": "charged_to_field",
  "items": [
    { "product_id": "p1", "quantity": 2 },
    { "product_id": "p5", "quantity": 1 }
  ]
}
```

### 5. Encender Luces LED Cancha vía IoT
```http
POST /api/iot/lighting/switch
Authorization: Bearer <TOKEN_STAFF>
Content-Type: application/json

{
  "field_id": "f0000000-0000-0000-0000-000000000001",
  "action": "TURN_ON"
}
```
