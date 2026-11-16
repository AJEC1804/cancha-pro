const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '../public/dashboard.html');
let html = fs.readFileSync(dashPath, 'utf8');

// 1. Bug de barra superior: Limpiar clase activa hardcodeada en roleBtnTenant
const oldRoleTenant = `<button onclick="switchActiveRole('tenant_admin')" id="roleBtnTenant" class="px-3 py-1 rounded-xl font-bold bg-emerald-500 text-slate-950 transition">🏢 Admin Sede</button>`;
const newRoleTenant = `<button onclick="switchActiveRole('tenant_admin')" id="roleBtnTenant" class="px-3 py-1 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">🏢 Admin Sede</button>`;

if (html.includes(oldRoleTenant)) {
  html = html.replace(oldRoleTenant, newRoleTenant);
  console.log('✓ Bug barra superior corregido: roleBtnTenant ahora es neutral por defecto');
}

// 2. Arqueo de Caja completo en Canchero/POS (Separar Efectivo vs Pagos Digitales)
const oldShiftSection = `      <!-- ARQUEO DE CAJA POR TURNO -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none transition max-w-xl">
        <div class="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <i data-feather="dollar-sign" class="w-5 h-5 text-emerald-500"></i>
          <h3 class="font-bold text-slate-900 dark:text-white text-sm">Cierre de Turno y Arqueo de Caja</h3>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Efectivo Inicial de Caja:</span>
            <span class="font-bold text-slate-900 dark:text-white">$100.000 COP</span>
          </div>
          <div class="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Ventas en Efectivo Registradas:</span>
            <span id="shiftSystemCashLabel" class="font-bold text-emerald-600 dark:text-emerald-400">$100.000 COP</span>
          </div>
          <div class="pt-2">
            <label class="block text-slate-700 dark:text-slate-300 font-bold mb-1">Efectivo Físico Contado en Caja:</label>
            <input type="number" id="shiftActualCashInput" placeholder="Ej. 100000" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
          </div>
          <button onclick="submitCloseShift()" class="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 transition">
            Efectuar Cierre de Caja
          </button>
        </div>
      </div>`;

const newShiftSection = `      <!-- ARQUEO DE CAJA COMPLETO POR TURNO (EFECTIVO + PAGOS DIGITALES) -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none transition max-w-xl">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <i data-feather="dollar-sign" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-sm">Cierre de Turno & Arqueo de Caja</h3>
              <p class="text-[10px] text-slate-400">Cuadre de efectivo físico vs pagos digitales (Nequi / PSE / Wompi)</p>
            </div>
          </div>
          <button onclick="loadActiveShiftForStaff()" title="Refrescar turno" class="text-xs text-slate-400 hover:text-emerald-500">
            <i data-feather="refresh-cw" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <!-- Desglose de Fuentes de Ingreso -->
          <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">💵 Efectivo Esperado en Caja</span>
              <span id="shiftExpectedCashLabel" class="text-base font-black text-emerald-600 dark:text-emerald-400">$165.000 COP</span>
              <span class="text-[9px] text-slate-500 block">Base ($100k) + Ventas ($65k)</span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">💳 Pagos Digitales (Nequi/PSE)</span>
              <span id="shiftElectronicSalesLabel" class="text-base font-black text-blue-600 dark:text-blue-400">$120.000 COP</span>
              <span class="text-[9px] text-slate-500 block">Recibido en cuentas sede</span>
            </div>
          </div>

          <div class="flex justify-between items-center text-slate-600 dark:text-slate-300 px-1">
            <span>Total General Recaudado en Turno:</span>
            <span id="shiftTotalCollectedLabel" class="font-black text-slate-900 dark:text-white">$185.000 COP</span>
          </div>

          <div class="pt-2">
            <div class="flex justify-between items-center mb-1">
              <label class="block text-slate-700 dark:text-slate-300 font-bold">Efectivo Físico Contado en Caja:</label>
              <span id="shiftDifferenceBadge" class="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Cuadre exacto</span>
            </div>
            <input type="number" id="shiftActualCashInput" oninput="onActualCashInputChanged()" placeholder="Ej. 165000" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold">
          </div>

          <button onclick="submitCloseShift()" class="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black py-2.5 rounded-xl border border-slate-700 transition shadow-sm">
            Efectuar Cierre de Caja y Guardar Arqueo
          </button>
        </div>
      </div>`;

if (html.includes(oldShiftSection)) {
  html = html.replace(oldShiftSection, newShiftSection);
  console.log('✓ Arqueo de Caja actualizado con separación de efectivo vs digitales');
}

// 3. Portal del Jugador completo y autocontenido (#viewCliente) con 2 pestañas
const oldViewClienteStart = html.indexOf('<!-- ================= VISTA 4: CLIENTE JUGADOR ================= -->');
const oldViewClienteEnd = html.indexOf('<!-- ================= MODALES AUXILIARES ================= -->');

const newViewClienteHtml = `<!-- ================= VISTA 4: CLIENTE JUGADOR ================= -->
    <div id="viewCliente" class="hidden space-y-6">
      
      <!-- Sub-navegación interna del Portal del Jugador -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-3">
          <div class="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <i data-feather="user" class="w-6 h-6"></i>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">Portal del Jugador</span>
              <h3 class="text-base font-black text-slate-900 dark:text-white" id="clientPortalGreeting">Bienvenido, Mateo Jugador</h3>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5" id="clientPortalVenueLabel">Sede Asignada: <strong class="text-slate-900 dark:text-white">Complejo Deportivo La Bernabéu (Cartagena)</strong></p>
          </div>
        </div>

        <!-- Dos Pestañas Internas Claras -->
        <div class="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs self-start sm:self-auto">
          <button type="button" onclick="switchClientPortalTab('reservas')" id="clientTabBtn_reservas" class="px-4 py-2 rounded-xl font-black bg-blue-600 text-white transition flex items-center space-x-1.5 shadow-sm">
            <i data-feather="file-text" class="w-3.5 h-3.5"></i>
            <span>📋 Mis Reservas y Pagos</span>
          </button>
          <button type="button" onclick="switchClientPortalTab('nueva')" id="clientTabBtn_nueva" class="px-4 py-2 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1.5">
            <i data-feather="calendar" class="w-3.5 h-3.5"></i>
            <span>⚽ Nueva Reserva en mi Sede</span>
          </button>
        </div>
      </div>

      <!-- PESTAÑA 1: MIS RESERVAS Y PAGOS (Consulta Real por customer_id / user_id) -->
      <div id="clientTabPane_reservas" class="space-y-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h4 class="text-base font-black text-slate-900 dark:text-white">Mis Partidos Reservados y Cuentas de Cobro</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Historial de turnos, abonos pagados (50% / 100%), saldo pendiente de cancha, consumos de bar y comprobantes.</p>
            </div>
            <button onclick="switchClientPortalTab('nueva')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center space-x-2 transition shadow-md shadow-emerald-500/20">
              <i data-feather="plus-circle" class="w-4 h-4"></i>
              <span>⚽ Reservar Turno en mi Sede</span>
            </button>
          </div>

          <div id="clientReservationsList" class="space-y-3">
            <!-- Renderizado dinámico de reservas del cliente -->
          </div>
        </div>
      </div>

      <!-- PESTAÑA 2: NUEVA RESERVA EN MI SEDE (Parrilla Horaria y La Vaca Filtradas por Sede) -->
      <div id="clientTabPane_nueva" class="hidden space-y-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm dark:shadow-none">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">Reserva Directa</span>
              <h4 class="text-lg font-black text-slate-900 dark:text-white mt-1">Disponibilidad en mi Sede Asignada</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">Selecciona tu sub-cancha, fecha y franja horaria para reservar en 1 solo paso con Abono o La Vaca.</p>
            </div>
            <!-- Controles de Fecha -->
            <div class="flex items-center space-x-2 text-xs">
              <button onclick="setClientPortalDate('today')" id="btnClientDateToday" class="px-3 py-1.5 rounded-xl font-black bg-emerald-500 text-slate-950 transition">Hoy</button>
              <button onclick="setClientPortalDate('tomorrow')" id="btnClientDateTomorrow" class="px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition">Mañana</button>
              <input type="date" id="clientPortalDatePicker" onchange="onClientPortalDateChanged()" class="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 font-bold">
            </div>
          </div>

          <!-- Selector de Sub-Canchas de la Sede -->
          <div id="clientPortalCourtTabs" class="flex items-center space-x-2 overflow-x-auto pb-2">
            <!-- Renderizado dinámico de canchas de la sede -->
          </div>

          <!-- Banner de Tarifas Consistentes de la Cancha -->
          <div id="clientPortalCourtInfoBanner" class="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <!-- Renderizado dinámico de tarifas -->
          </div>

          <!-- Grilla de Horarios Disponibles -->
          <div id="clientPortalSlotsGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <!-- Renderizado de slots de la sede -->
          </div>
        </div>
      </div>

    </div>\n\n  </main>\n\n  `;

if (oldViewClienteStart !== -1 && oldViewClienteEnd !== -1) {
  html = html.slice(0, oldViewClienteStart) + newViewClienteHtml + html.slice(oldViewClienteEnd);
  console.log('✓ Portal del Jugador (#viewCliente) actualizado con 2 pestañas y parrilla autocontenida');
}

// 4. Reemplazar modales duplicados de liquidación con <UnifiedFolioModal> y agregar modal de checkout 1-paso
const oldFolioSectionStart = html.indexOf('<!-- Modal Liquidación Unificada Final (POS + 50% Saldo Cancha + Devolución Implementos + Pago Mixto) -->');
const oldFolioSectionEnd = html.indexOf('<!-- Modal Autenticación y Acceso RBAC (Supabase Auth) -->');

const newUnifiedFolioAndCheckoutModals = `<!-- ================= MODAL FOLIO UNIFICADO (CANCHERO/POS = ADMIN SEDE = JUGADOR) ================= -->
  <div id="modalUnifiedFolio" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition">
      
      <!-- Header del Folio Unificado -->
      <div class="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <i data-feather="file-text" class="w-5 h-5"></i>
          </div>
          <div>
            <span class="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Folio Unificado de Liquidación</span>
            <h3 id="folioModalTitle" class="text-sm font-black text-slate-900 dark:text-white">Reserva #res-demo-001</h3>
          </div>
        </div>
        <button onclick="closeUnifiedFolioModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-white"><i data-feather="x" class="w-5 h-5"></i></button>
      </div>

      <!-- Cuerpo del Folio con Desglose Idéntico (Canchero = Admin) -->
      <div class="p-6 space-y-4 overflow-y-auto text-xs" id="folioModalContent">
        <!-- Renderizado dinámico del Folio -->
      </div>

      <!-- Selector de Medio de Pago y Liquidación -->
      <div class="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <!-- Selector de Medio de Pago (Efectivo, Nequi/QR, Wompi/PSE, Pago Mixto) -->
        <div class="space-y-1.5" id="folioPaymentSelectorSection">
          <label class="block text-slate-700 dark:text-slate-300 font-bold text-[11px]">Medio de Pago para Liquidación:</label>
          <div class="grid grid-cols-4 gap-1.5 text-center font-bold text-[11px]">
            <button type="button" onclick="setFolioPaymentMethod('cash')" id="btnFolioPay_cash" class="p-2 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition font-black">💵 Efectivo</button>
            <button type="button" onclick="setFolioPaymentMethod('nequi')" id="btnFolioPay_nequi" class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition">🟣 Nequi / QR</button>
            <button type="button" onclick="setFolioPaymentMethod('wompi')" id="btnFolioPay_wompi" class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition">💳 Wompi / PSE</button>
            <button type="button" onclick="setFolioPaymentMethod('mixed')" id="btnFolioPay_mixed" class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition">⚖️ Mixto</button>
          </div>
        </div>

        <!-- División Pago Mixto si está seleccionado -->
        <div id="folioMixedPaymentBox" class="hidden space-y-2 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div class="flex justify-between items-center text-[10px]">
            <span class="font-bold text-slate-600 dark:text-slate-400">División Efectivo vs Electrónico:</span>
            <span id="folioMixedMatchBadge" class="font-black text-emerald-600 dark:text-emerald-400">✓ Cuadre exacto</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-slate-400 block">Efectivo (Cash)</span>
              <input type="number" id="folioMixedCashInput" oninput="recalcFolioMixed()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-bold text-xs">
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block">Electrónico (Nequi/Wompi)</span>
              <input type="number" id="folioMixedElecInput" oninput="recalcFolioMixed()" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-900 dark:text-white font-bold text-xs">
            </div>
          </div>
        </div>

        <!-- Check Control Anti-Pérdidas de Implementos -->
        <div class="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
          <input type="checkbox" id="folioEquipmentCheck" checked class="accent-emerald-500 rounded">
          <label for="folioEquipmentCheck" class="font-semibold cursor-pointer">
            ✓ Devolución verificada de balones y petos prestados a la cancha
          </label>
        </div>

        <div class="flex items-center justify-between pt-1">
          <button onclick="closeUnifiedFolioModal()" class="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl">Cerrar</button>
          <button onclick="submitUnifiedFolioSettlement()" id="btnSubmitUnifiedFolio" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition flex items-center space-x-1.5">
            <i data-feather="check-circle" class="w-4 h-4"></i>
            <span>Liquidar Folio y Cerrar Cuenta</span>
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- ================= MODAL CHECKOUT UNIFICADO DE RESERVA EN 1 SOLO PASO ================= -->
  <div id="modalUnifiedBookingCheckout" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition">
      
      <!-- Header -->
      <div class="bg-emerald-500/10 dark:bg-emerald-500/15 p-5 border-b border-emerald-500/20 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Checkout Unificado (1 Solo Paso)</span>
          <h3 id="checkoutCourtTitle" class="text-base font-black text-slate-900 dark:text-white">Cancha 1: La Bernabéu Principal</h3>
        </div>
        <button onclick="closeUnifiedBookingCheckout()" class="text-slate-400 hover:text-slate-700 dark:hover:text-white"><i data-feather="x" class="w-5 h-5"></i></button>
      </div>

      <!-- Formulario 1 Paso: Modalidad + Medios de Pago + Voucher -->
      <form onsubmit="handleUnifiedBookingSubmit(event)" class="p-6 space-y-4 overflow-y-auto text-xs">
        
        <!-- Resumen del Partido -->
        <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Fecha y Turno</span>
            <span id="checkoutDateTimeSummary" class="font-black text-slate-900 dark:text-white text-sm">2026-11-15 | 19:00 - 20:00</span>
          </div>
          <div class="text-right">
            <span class="text-slate-400 block text-[10px] uppercase font-bold">Valor Total Cancha</span>
            <span id="checkoutTotalAmountSummary" class="font-black text-emerald-600 dark:text-emerald-400 text-base">$130.000 COP</span>
          </div>
        </div>

        <!-- 1. Modalidad de Pago (Se pregunta UNA SOLA VEZ) -->
        <div class="space-y-1.5">
          <label class="block font-bold text-slate-700 dark:text-slate-300">Selecciona Modalidad de Reserva:</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" onclick="setBookingModalModality('deposit_50')" id="bmBtn_deposit50" class="p-3 rounded-2xl border text-center font-black border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition">
              <span class="block text-xs">Abono 50%</span>
              <span id="bmDepositAmountLabel" class="text-sm font-black block mt-0.5">$65.000</span>
              <span class="text-[9px] font-normal text-slate-500 block">Saldo al jugar</span>
            </button>
            <button type="button" onclick="setBookingModalModality('full')" id="bmBtn_full" class="p-3 rounded-2xl border text-center font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
              <span class="block text-xs">Pago 100%</span>
              <span id="bmFullAmountLabel" class="text-sm font-black block mt-0.5">$130.000</span>
              <span class="text-[9px] font-normal text-slate-500 block">Total cancelado</span>
            </button>
            <button type="button" onclick="setBookingModalModality('vaca_split')" id="bmBtn_vaca" class="p-3 rounded-2xl border text-center font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 transition">
              <span class="block text-xs">🐄 La Vaca</span>
              <span id="bmVacaQuotaLabel" class="text-sm font-black block mt-0.5">$13.000 c/u</span>
              <span class="text-[9px] font-normal text-slate-500 block">Dividir cuotas</span>
            </button>
          </div>
        </div>

        <!-- Caja de Configuración de La Vaca si está elegida -->
        <div id="bookingVacaConfigBox" class="hidden bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-3">
          <div class="flex justify-between items-center">
            <span class="font-bold text-amber-700 dark:text-amber-400 text-xs">Dividir Cuota entre Amigos:</span>
            <span id="bmVacaPlayersCountLabel" class="font-black text-amber-600 dark:text-amber-300 text-xs">10 jugadores</span>
          </div>
          <input type="range" id="bmVacaPlayersRange" min="4" max="14" value="10" step="1" oninput="onBookingVacaRangeChanged()" class="w-full accent-amber-500 cursor-pointer">
          <p class="text-[10px] text-slate-500">Se generará un enlace único para que cada amigo pague su cuota exacta directamente por Nequi o Daviplata.</p>
        </div>

        <!-- 2. Medios de Pago Dinámicos de la Sede (Wompi, Efectivo, Nequi, Daviplata, Bancolombia) -->
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <label class="block font-bold text-slate-700 dark:text-slate-300">Medios de Pago Habilitados por esta Sede:</label>
            <span id="checkoutAmountToPayLabel" class="font-black text-emerald-600 dark:text-emerald-400 text-xs">Pagar Ahora: $65.000 COP</span>
          </div>
          <div id="unifiedCheckoutPaymentMethodsContainer" class="space-y-2">
            <!-- Renderizado dinámico de Wompi, Efectivo, Nequi, Daviplata, Bancolombia -->
          </div>
        </div>

        <!-- 3. Comprobante / Referencia -->
        <div class="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <label class="block font-bold text-slate-900 dark:text-white">Número de Referencia o Comprobante (Transferencia):</label>
          <input type="text" id="bmPaymentRefInput" placeholder="Ej. NEQUI-849201 o REF Bancolombia" class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono text-xs">
          <div class="flex items-center space-x-2 pt-1">
            <input type="file" id="bmReceiptFileInput" accept="image/*,.pdf" onchange="handleBookingReceiptFile(event)" class="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 cursor-pointer">
            <span id="bmReceiptFileName" class="text-[10px] text-emerald-600 font-bold hidden">✓ Adjunto</span>
          </div>
        </div>

        <div class="flex space-x-2 pt-2">
          <button type="button" onclick="closeUnifiedBookingCheckout()" class="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl transition">
            Cancelar
          </button>
          <button type="submit" id="btnSubmitUnifiedBooking" class="w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5">
            <i data-feather="check-circle" class="w-4 h-4"></i>
            <span>Confirmar y Apartar Cancha</span>
          </button>
        </div>

      </form>
    </div>
  </div>

  <!-- ================= MODAL SUBIR COMPROBANTE / PAGAR SALDO (DESDE PORTAL JUGADOR) ================= -->
  <div id="modalUploadReceipt" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 transition">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <span class="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">Validación de Abono</span>
          <h3 id="receiptModalReservationTitle" class="text-sm font-black text-slate-900 dark:text-white">Subir Comprobante de Pago</h3>
        </div>
        <button onclick="closeUploadReceiptModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-white"><i data-feather="x" class="w-5 h-5"></i></button>
      </div>

      <form onsubmit="handlePortalReceiptSubmit(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Referencia de Pago / Transacción</label>
          <input type="text" id="portalReceiptRefInput" required placeholder="Ej: NEQ-849201 o Bre-B" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold">
        </div>
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Adjuntar Imagen o PDF del Recibo</label>
          <input type="file" id="portalReceiptFileInput" accept="image/*,.pdf" class="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20 cursor-pointer">
        </div>
        <p class="text-[10px] text-slate-400">El comprobante pasará a estado de verificación inmediata por el administrador de la sede.</p>
        <button type="submit" id="btnSubmitPortalReceipt" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl transition shadow-md shadow-blue-500/20">
          Enviar Comprobante
        </button>
      </form>
    </div>
  </div>\n\n  `;

if (oldFolioSectionStart !== -1 && oldFolioSectionEnd !== -1) {
  html = html.slice(0, oldFolioSectionStart) + newUnifiedFolioAndCheckoutModals + html.slice(oldFolioSectionEnd);
  console.log('✓ Modales de Folio Unificado y Checkout 1-Paso reemplazaron con éxito los modales duplicados');
}

fs.writeFileSync(dashPath, html, 'utf8');
const frontendDashPath = path.join(__dirname, '../frontend/dashboard.html');
fs.writeFileSync(frontendDashPath, html, 'utf8');
console.log('✓ Successfully written public/dashboard.html and frontend/dashboard.html');
