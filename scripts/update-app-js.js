const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '../public/js/app.js');
let code = fs.readFileSync(appJsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Reemplazar updateCourtInfoBanner con cálculo consistente de fin de semana y valle/pico
const oldUpdateCourtBanner = `function updateCourtInfoBanner() {
  const field = state.fields.find(f => f.id === state.selectedFieldId);
  if (!field) return;

  const titleEl = document.getElementById('currentCourtTitle');
  const descEl = document.getElementById('currentCourtDesc');
  const valleyEl = document.getElementById('courtPriceValley');
  const peakEl = document.getElementById('courtPricePeak');

  if (titleEl) {
    if (!field.is_active) {
      titleEl.innerHTML = \`<span class="line-through opacity-70">\${field.name}</span> <span class="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase ml-2">Suspendida</span>\`;
    } else {
      titleEl.innerText = field.name;
    }
  }

  if (descEl) {
    if (!field.is_active) {
      descEl.innerHTML = \`<strong class="text-red-500 font-bold">⚠️ CANCHA TEMPORALMENTE SUSPENDIDA.</strong> Comunícate con el administrador del sistema para más información.\`;
    } else {
      descEl.innerText = field.description || 'Grama sintética profesional con iluminación de alta potencia';
    }
  }

  if (valleyEl) valleyEl.innerText = \`$\${Number(field.default_price_per_hour).toLocaleString('es-CO')} COP\`;
  if (peakEl) peakEl.innerText = \`$\${Number(field.peak_price_per_hour).toLocaleString('es-CO')} COP\`;
}`;

const newUpdateCourtBanner = `function updateCourtInfoBanner() {
  const field = state.fields.find(f => f.id === state.selectedFieldId);
  if (!field) return;

  const titleEl = document.getElementById('currentCourtTitle');
  const descEl = document.getElementById('currentCourtDesc');
  const valleyEl = document.getElementById('courtPriceValley');
  const peakEl = document.getElementById('courtPricePeak');
  const weekendEl = document.getElementById('courtPriceWeekendDisplay');

  if (titleEl) {
    if (!field.is_active) {
      titleEl.innerHTML = \`<span class="line-through opacity-70">\${field.name}</span> <span class="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase ml-2">Suspendida</span>\`;
    } else {
      titleEl.innerText = field.name;
    }
  }

  if (descEl) {
    if (!field.is_active) {
      descEl.innerHTML = \`<strong class="text-red-500 font-bold">⚠️ CANCHA TEMPORALMENTE SUSPENDIDA.</strong> Comunícate con el administrador del sistema para más información.\`;
    } else {
      descEl.innerText = field.description || 'Grama sintética monofilamento con iluminación LED de alta potencia';
    }
  }

  // Detección de Fin de Semana Unificada para concordancia 100% entre Banner y Tarjetas
  const d = new Date((state.selectedDate || getBogotaDate()) + 'T00:00:00');
  const isWeekend = (d.getDay() === 0 || d.getDay() === 6);

  const displayValley = isWeekend
    ? (field.weekend_price_per_hour || field.default_price_per_hour)
    : field.default_price_per_hour;

  const displayPeak = isWeekend
    ? (field.weekend_peak_price_per_hour || field.peak_price_per_hour)
    : field.peak_price_per_hour;

  if (valleyEl) valleyEl.innerText = \`$\${Number(displayValley).toLocaleString('es-CO')} COP\`;
  if (peakEl) peakEl.innerText = \`$\${Number(displayPeak).toLocaleString('es-CO')} COP\`;
  if (weekendEl) {
    weekendEl.innerText = \`$\${Number(field.weekend_price_per_hour || field.default_price_per_hour).toLocaleString('es-CO')} / $\${Number(field.weekend_peak_price_per_hour || field.peak_price_per_hour).toLocaleString('es-CO')} COP\`;
  }
}`;

if (code.includes(oldUpdateCourtBanner)) {
  code = code.replace(oldUpdateCourtBanner, () => newUpdateCourtBanner);
  console.log('✓ updateCourtInfoBanner actualizado con tarifas consistentes');
}

// 2. Reemplazar openBookingModal en la grilla pública para bloquear reservas anónimas
const oldSlotClick = `<div onclick="openBookingModal('\${slot.start_time}', '\${slot.end_time}', \${slot.price})"`;
const newSlotClick = `<div onclick="handlePublicSlotClick('\${slot.start_time}', '\${slot.end_time}', \${slot.price}, '\${state.selectedFieldId}')"`;

if (code.includes(oldSlotClick)) {
  code = code.replaceAll(oldSlotClick, () => newSlotClick);
  console.log('✓ Bloqueo de reservas anónimas en grilla pública activo');
}

// 3. Reemplazar initDashboard y switchActiveRole con soporte de rol en URL y credenciales RBAC sincronizadas
const oldInitAndSwitch = `function initDashboard() {
  initTheme();
  checkAuthConfig();
  const savedRole = localStorage.getItem('canchapro_role') || 'superadmin';
  switchActiveRole(savedRole);
  loadDashboardData();
  checkSupabaseStatus();
}

function switchActiveRole(role) {
  state.activeRole = role;

  const btnSuper = document.getElementById('roleBtnSuperadmin');
  const btnTenant = document.getElementById('roleBtnTenant');
  const btnStaff = document.getElementById('roleBtnStaff');
  const btnCliente = document.getElementById('roleBtnCliente');

  const vSuper = document.getElementById('viewSuperadmin');
  const vTenant = document.getElementById('viewTenantAdmin');
  const vStaff = document.getElementById('viewStaff');
  const vCliente = document.getElementById('viewCliente');

  [btnSuper, btnTenant, btnStaff, btnCliente].forEach(b => {
    if (b) b.className = 'px-3 py-1 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition';
  });

  if (vSuper) vSuper.classList.add('hidden');
  if (vTenant) vTenant.classList.add('hidden');
  if (vStaff) vStaff.classList.add('hidden');
  if (vCliente) vCliente.classList.add('hidden');

  const bannerTitle = document.getElementById('bannerRoleTitle');
  const bannerDesc = document.getElementById('bannerRoleDesc');
  const bannerBadge = document.getElementById('bannerRoleBadge');
  const topUserName = document.getElementById('topbarUserName');
  const topUserRole = document.getElementById('topbarUserRole');

  if (role === 'superadmin') {
    if (btnSuper) btnSuper.className = 'px-3 py-1 rounded-xl font-black bg-purple-600 text-white transition';
    if (vSuper) vSuper.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Panel de Control SuperAdmin (Alejandro)';
    if (bannerDesc) bannerDesc.innerText = 'Supervisión multi-tenant: Alta de complejos, vinculación de administradores y activación/suspensión de sedes.';
    if (bannerBadge) { bannerBadge.innerText = 'SuperAdmin'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-purple-600 text-white uppercase'; }
    if (topUserName) topUserName.innerText = 'Alejandro SuperAdmin';
    if (topUserRole) topUserRole.innerText = 'SuperAdmin • Control Global Multi-Tenant';
    loadSuperadminVenues();
  } else if (role === 'tenant_admin') {
    if (btnTenant) btnTenant.className = 'px-3 py-1 rounded-xl font-black bg-emerald-500 text-slate-950 transition';
    if (vTenant) vTenant.classList.remove('hidden');
    
    const curV = state.venues.find(v => v.id === state.currentVenueId) || state.venues[0];
    const venueName = curV ? curV.name : 'Complejo Deportivo';
    const adminName = curV && curV.admin_name ? curV.admin_name : 'Admin Sede';

    if (bannerTitle) bannerTitle.innerText = \`Panel de Gestión: \${venueName}\`;
    if (bannerDesc) bannerDesc.innerText = 'Autogestión de tus sub-canchas (Cancha 1, 2, 3), formatos de fútbol, tarifas Valle/Pico y personal.';
    if (bannerBadge) { bannerBadge.innerText = 'Admin Sede'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = adminName;
    if (topUserRole) topUserRole.innerText = \`Admin • \${venueName}\`;

    loadTenantAdminFields();
    loadPricingCourts();
    loadStaffList();
    loadSubscriptions();
    loadOperationalBlocks();
    loadTournamentsDashboard();
    populateModalFieldSelects();
    switchTenantTab(state.tenantActiveTab || 'canchas');
  } else if (role === 'staff') {
    if (btnStaff) btnStaff.className = 'px-3 py-1 rounded-xl font-black bg-amber-500 text-slate-950 transition';
    if (vStaff) vStaff.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Terminal Operativa de Canchero & POS Cafetería';
    if (bannerDesc) bannerDesc.innerText = 'Carga consumos a las cuentas de cancha y realiza el arqueo de caja del turno.';
    if (bannerBadge) { bannerBadge.innerText = 'Canchero & POS'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = 'Carlos Canchero & POS';
    if (topUserRole) topUserRole.innerText = 'Operaciones • La Bernabéu';
    loadPosProducts();
    loadActiveReservationsForStaff();
  } else {
    if (btnCliente) btnCliente.className = 'px-3 py-1 rounded-xl font-black bg-blue-500 text-white transition';
    if (vCliente) vCliente.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Portal del Jugador / Cliente';
    if (bannerDesc) bannerDesc.innerText = 'Historial de turnos reservados, comprobantes de pago y estado de tus vacas activas.';
    if (bannerBadge) { bannerBadge.innerText = 'Jugador'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-500 text-white uppercase'; }
    if (topUserName) topUserName.innerText = 'Mateo Jugador';
    if (topUserRole) topUserRole.innerText = 'Cliente Registrado';
    loadClientReservations();
  }

  if (window.feather) feather.replace();
}`;

const newInitAndSwitch = `function initDashboard() {
  initTheme();
  checkAuthConfig();

  const urlParams = new URLSearchParams(window.location.search);
  const path = window.location.pathname;

  let initialRole = urlParams.get('role');
  if (!initialRole) {
    if (path.includes('/portal') || path.endsWith('/portal')) {
      initialRole = 'cliente';
    } else {
      initialRole = localStorage.getItem('canchapro_role') || 'superadmin';
    }
  }

  switchActiveRole(initialRole);
  loadDashboardData();
  checkSupabaseStatus();

  if (urlParams.get('auth') === '1') {
    openAuthModal();
  }

  const initialTab = urlParams.get('tab');
  if (initialTab && initialRole === 'cliente') {
    switchClientPortalTab(initialTab === 'nueva_reserva' || initialTab === 'nueva' ? 'nueva' : 'reservas');
  }
}

function switchActiveRole(role) {
  state.activeRole = role;
  localStorage.setItem('canchapro_role', role);

  const demoUsers = {
    superadmin: { id: 'b0000000-0000-0000-0000-000000000001', name: 'Alejandro SuperAdmin', role: 'superadmin', venue_id: null },
    tenant_admin: { id: 'b0000000-0000-0000-0000-000000000002', name: 'Mario Admin Sede', role: 'tenant_admin', venue_id: state.currentVenueId },
    staff: { id: 'b0000000-0000-0000-0000-000000000003', name: 'Carlos Canchero & POS', role: 'staff', venue_id: state.currentVenueId },
    cliente: { id: 'b0000000-0000-0000-0000-000000000004', name: 'Mateo Jugador', role: 'cliente', venue_id: state.currentVenueId }
  };

  const activeUser = demoUsers[role] || demoUsers.superadmin;
  state.currentUser = activeUser;
  state.authToken = \`demo-user-\${activeUser.id}\`;
  localStorage.setItem('canchapro_token', state.authToken);

  const btnSuper = document.getElementById('roleBtnSuperadmin');
  const btnTenant = document.getElementById('roleBtnTenant');
  const btnStaff = document.getElementById('roleBtnStaff');
  const btnCliente = document.getElementById('roleBtnCliente');

  const vSuper = document.getElementById('viewSuperadmin');
  const vTenant = document.getElementById('viewTenantAdmin');
  const vStaff = document.getElementById('viewStaff');
  const vCliente = document.getElementById('viewCliente');

  [btnSuper, btnTenant, btnStaff, btnCliente].forEach(b => {
    if (b) b.className = 'px-3 py-1 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition';
  });

  if (vSuper) vSuper.classList.add('hidden');
  if (vTenant) vTenant.classList.add('hidden');
  if (vStaff) vStaff.classList.add('hidden');
  if (vCliente) vCliente.classList.add('hidden');

  const bannerTitle = document.getElementById('bannerRoleTitle');
  const bannerDesc = document.getElementById('bannerRoleDesc');
  const bannerBadge = document.getElementById('bannerRoleBadge');
  const topUserName = document.getElementById('topbarUserName');
  const topUserRole = document.getElementById('topbarUserRole');

  if (role === 'superadmin') {
    if (btnSuper) btnSuper.className = 'px-3 py-1 rounded-xl font-black bg-purple-600 text-white transition';
    if (vSuper) vSuper.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Panel de Control SuperAdmin (Alejandro)';
    if (bannerDesc) bannerDesc.innerText = 'Supervisión multi-tenant: Alta de complejos, vinculación de administradores y cobros SaaS.';
    if (bannerBadge) { bannerBadge.innerText = 'SuperAdmin'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-purple-600 text-white uppercase'; }
    if (topUserName) topUserName.innerText = 'Alejandro SuperAdmin';
    if (topUserRole) topUserRole.innerText = 'SuperAdmin • Control Global Multi-Tenant';
    loadSuperadminVenues();
  } else if (role === 'tenant_admin') {
    if (btnTenant) btnTenant.className = 'px-3 py-1 rounded-xl font-black bg-emerald-500 text-slate-950 transition';
    if (vTenant) vTenant.classList.remove('hidden');
    
    const curV = state.venues.find(v => v.id === state.currentVenueId) || state.venues[0];
    const venueName = curV ? curV.name : 'Complejo Deportivo La Bernabéu';
    const adminName = 'Mario Admin Sede';

    if (bannerTitle) bannerTitle.innerText = \`Panel de Gestión: \${venueName}\`;
    if (bannerDesc) bannerDesc.innerText = 'Autogestión de tus sub-canchas, tarifas Valle/Pico, clientes & cartera y cierres de caja.';
    if (bannerBadge) { bannerBadge.innerText = 'Admin Sede'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = adminName;
    if (topUserRole) topUserRole.innerText = \`Admin • \${venueName}\`;

    loadTenantAdminFields();
    loadPricingCourts();
    loadStaffList();
    loadSubscriptions();
    loadOperationalBlocks();
    loadTournamentsDashboard();
    populateModalFieldSelects();
    switchTenantTab(state.tenantActiveTab || 'canchas');
  } else if (role === 'staff') {
    if (btnStaff) btnStaff.className = 'px-3 py-1 rounded-xl font-black bg-amber-500 text-slate-950 transition';
    if (vStaff) vStaff.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Terminal Operativa de Canchero & POS Cafetería';
    if (bannerDesc) bannerDesc.innerText = 'Carga consumos a las cuentas de cancha, liquida folios y realiza el arqueo de caja del turno.';
    if (bannerBadge) { bannerBadge.innerText = 'Canchero & POS'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = 'Carlos Canchero & POS';
    if (topUserRole) topUserRole.innerText = 'Operaciones • La Bernabéu';
    loadPosProducts();
    loadActiveReservationsForStaff();
    loadActiveShiftForStaff();
  } else {
    if (btnCliente) btnCliente.className = 'px-3 py-1 rounded-xl font-black bg-blue-500 text-white transition';
    if (vCliente) vCliente.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Portal del Jugador / Cliente';
    if (bannerDesc) bannerDesc.innerText = 'Historial de turnos reservados, comprobantes de pago, cuentas de bar y nueva reserva.';
    if (bannerBadge) { bannerBadge.innerText = 'Jugador'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-blue-500 text-white uppercase'; }
    if (topUserName) topUserName.innerText = 'Mateo Jugador';
    if (topUserRole) topUserRole.innerText = 'Cliente Registrado';
    initClientPortal();
  }

  if (window.feather) feather.replace();
}`;

if (code.includes(oldInitAndSwitch)) {
  code = code.replace(oldInitAndSwitch, () => newInitAndSwitch);
  console.log('✓ initDashboard y switchActiveRole actualizados con RBAC y role styling exacto');
}

// 4. Actualizar loadTenantClients con manejo de error, estado vacío y eliminación de spinner infinito
const oldLoadTenantClients = `async function loadTenantClients() {
  const container = document.getElementById('tenantClientsTableContainer');
  if (!container) return;

  container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs"><span class="inline-block animate-spin mr-2">⏳</span> Cargando directorio de clientes...</div>';

  try {
    const res = await fetch(\`\${API_BASE}/venues/\${state.currentVenueId}/clients\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken}\` }
    });
    const data = await res.json();
    if (data.success && data.clients) {
      state.tenantClients = data.clients;
      
      const totalCount = document.getElementById('tenantClientsTotalCount');
      if (totalCount) totalCount.innerText = \`\${data.clients.length} Jugadores\`;

      const totalDebt = data.clients.reduce((acc, c) => acc + (c.total_debt || 0), 0);
      const totalDebtEl = document.getElementById('tenantClientsTotalDebt');
      if (totalDebtEl) totalDebtEl.innerText = \`$\${totalDebt.toLocaleString('es-CO')} COP\`;

      const upToDate = data.clients.filter(c => c.total_debt === 0).length;
      const upToDateEl = document.getElementById('tenantClientsUpToDateCount');
      if (upToDateEl) upToDateEl.innerText = \`\${upToDate} al día\`;

      container.innerHTML = \`
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-2.5 px-3">Cliente</th>
              <th class="py-2.5 px-3">WhatsApp / Celular</th>
              <th class="py-2.5 px-2 text-center">Partidos</th>
              <th class="py-2.5 px-3 text-right">Deuda Cancha</th>
              <th class="py-2.5 px-3 text-right">Deuda Bar</th>
              <th class="py-2.5 px-3 text-right font-black">Total Deuda</th>
              <th class="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            \${data.clients.map(c => \`
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                  <span>\${c.name}</span>
                  <span class="text-[10px] text-slate-400 block">\${c.email}</span>
                </td>
                <td class="py-2.5 px-3">
                  <a href="https://wa.me/57\${c.phone?.replace(/\\D/g, '')}" target="_blank" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1">
                    <span>\${c.phone}</span>
                  </a>
                </td>
                <td class="py-2.5 px-2 text-center font-bold">\${c.bookings_count}</td>
                <td class="py-2.5 px-3 text-right text-slate-900 dark:text-white">$\${Number(c.court_debt || 0).toLocaleString('es-CO')}</td>
                <td class="py-2.5 px-3 text-right text-amber-500">$\${Number(c.cafeteria_debt || 0).toLocaleString('es-CO')}</td>
                <td class="py-2.5 px-3 text-right font-black \${c.total_debt > 0 ? 'text-red-500' : 'text-emerald-500'}">
                  $\${Number(c.total_debt || 0).toLocaleString('es-CO')}
                </td>
                <td class="py-2.5 px-3 text-right">
                  <button onclick="openFolioModal('\${c.reservations_ids && c.reservations_ids[0] ? c.reservations_ids[0] : 'res-demo-001'}')" class="bg-blue-600 hover:bg-blue-500 text-white font-black px-2.5 py-1 rounded-xl text-[10px] transition shadow-sm">
                    Ver Folio / Cobrar
                  </button>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }
}`;

const newLoadTenantClients = `async function loadTenantClients() {
  const container = document.getElementById('tenantClientsTableContainer');
  if (!container) return;

  container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs"><span class="inline-block animate-spin mr-2">⏳</span> Cargando directorio de clientes...</div>';

  try {
    const res = await fetch(\`\${API_BASE}/venues/\${state.currentVenueId}/clients\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken}\` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      container.innerHTML = \`
        <div class="p-6 text-center text-xs text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
          <p class="font-bold">Error al consultar clientes: \${data.error || 'Permisos insuficientes o fallo de red.'}</p>
          <button onclick="loadTenantClients()" class="mt-2 text-xs font-black text-red-600 underline">Reintentar</button>
        </div>
      \`;
      return;
    }

    const clients = data.clients || [];
    state.tenantClients = clients;
    
    const totalCount = document.getElementById('tenantClientsTotalCount');
    if (totalCount) totalCount.innerText = \`\${clients.length} Jugadores\`;

    const totalDebt = clients.reduce((acc, c) => acc + (c.total_debt || 0), 0);
    const totalDebtEl = document.getElementById('tenantClientsTotalDebt');
    if (totalDebtEl) totalDebtEl.innerText = \`$\${totalDebt.toLocaleString('es-CO')} COP\`;

    const upToDate = clients.filter(c => (c.total_debt || 0) === 0).length;
    const upToDateEl = document.getElementById('tenantClientsUpToDateCount');
    if (upToDateEl) upToDateEl.innerText = \`\${upToDate} al día\`;

    if (clients.length === 0) {
      container.innerHTML = \`
        <div class="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p class="text-xs text-slate-400">No hay clientes con historial o reservas en esta sede aún.</p>
        </div>
      \`;
      return;
    }

    container.innerHTML = \`
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="py-2.5 px-3">Cliente</th>
            <th class="py-2.5 px-3">WhatsApp / Celular</th>
            <th class="py-2.5 px-2 text-center">Partidos</th>
            <th class="py-2.5 px-3 text-right">Deuda Cancha</th>
            <th class="py-2.5 px-3 text-right">Deuda Bar</th>
            <th class="py-2.5 px-3 text-right font-black">Total Deuda</th>
            <th class="py-2.5 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          \${clients.map(c => \`
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
              <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                <span>\${c.name}</span>
                <span class="text-[10px] text-slate-400 block">\${c.email || ''}</span>
              </td>
              <td class="py-2.5 px-3">
                <a href="https://wa.me/57\${c.phone?.replace(/\\D/g, '')}" target="_blank" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1">
                  <span>\${c.phone}</span>
                </a>
              </td>
              <td class="py-2.5 px-2 text-center font-bold">\${c.total_bookings || c.bookings_count || 1}</td>
              <td class="py-2.5 px-3 text-right text-slate-900 dark:text-white">$\${Number(c.total_court_pending || c.court_debt || 0).toLocaleString('es-CO')}</td>
              <td class="py-2.5 px-3 text-right text-amber-500">$\${Number(c.total_pos_pending || c.cafeteria_debt || 0).toLocaleString('es-CO')}</td>
              <td class="py-2.5 px-3 text-right font-black \${(c.total_debt || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}">
                $\${Number(c.total_debt || 0).toLocaleString('es-CO')}
              </td>
              <td class="py-2.5 px-3 text-right">
                <button onclick="openUnifiedFolioModal('\${c.reservations_ids && c.reservations_ids[0] ? c.reservations_ids[0] : 'res-demo-001'}')" class="bg-blue-600 hover:bg-blue-500 text-white font-black px-2.5 py-1 rounded-xl text-[10px] transition shadow-sm">
                  Ver Folio / Cobrar
                </button>
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;
  } catch (err) {
    console.error('Error cargando clientes:', err);
    container.innerHTML = \`
      <div class="p-6 text-center text-xs text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
        <p class="font-bold">Error de red al consultar clientes.</p>
        <button onclick="loadTenantClients()" class="mt-2 text-xs font-black text-red-600 underline">Reintentar</button>
      </div>
    \`;
  }
}`;

if (code.includes(oldLoadTenantClients)) {
  code = code.replace(oldLoadTenantClients, () => newLoadTenantClients);
  console.log('✓ loadTenantClients actualizado con manejo de error y estado vacío');
}

// 5. Actualizar loadTenantShiftsHistory con manejo de error, estado vacío y eliminación de spinner infinito
const oldLoadTenantShifts = `async function loadTenantShiftsHistory() {
  const container = document.getElementById('tenantShiftsHistoryContainer');
  if (!container) return;

  container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs"><span class="inline-block animate-spin mr-2">⏳</span> Cargando historial de caja...</div>';

  try {
    const res = await fetch(\`\${API_BASE}/venues/\${state.currentVenueId}/shifts/history\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken}\` }
    });
    const data = await res.json();
    if (data.success && data.shifts) {
      state.shiftsHistory = data.shifts;
      container.innerHTML = \`
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-2.5 px-3">Fecha & Turno</th>
              <th class="py-2.5 px-3">Cajero</th>
              <th class="py-2.5 px-3 text-right">Ingresos Canchas</th>
              <th class="py-2.5 px-3 text-right">Ingresos Cafetería</th>
              <th class="py-2.5 px-3 text-right font-black">Total Turno</th>
              <th class="py-2.5 px-3 text-right">Efectivo vs Digital</th>
              <th class="py-2.5 px-2 text-center">Cuadre</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            \${data.shifts.map(s => \`
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                  <span>\${s.date}</span>
                  <span class="text-[10px] text-slate-400 block font-normal">\${s.start_time} - \${s.end_time}</span>
                </td>
                <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">\${s.cashier_name}</td>
                <td class="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">$\${s.courts_income.toLocaleString('es-CO')}</td>
                <td class="py-2.5 px-3 text-right text-amber-500 font-bold">$\${s.cafeteria_income.toLocaleString('es-CO')}</td>
                <td class="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">$\${s.total_collected.toLocaleString('es-CO')}</td>
                <td class="py-2.5 px-3 text-right text-[11px] text-slate-500">
                  <span>💵 $\${s.cash_collected.toLocaleString('es-CO')}</span> /
                  <span>💳 $\${s.electronic_collected.toLocaleString('es-CO')}</span>
                </td>
                <td class="py-2.5 px-2 text-center">
                  <span class="font-bold text-[10px] px-2 py-0.5 rounded-full \${s.difference === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                    \${s.difference === 0 ? '✓ Exacto' : '$' + s.difference}
                  </span>
                </td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      \`;
    }
  } catch (err) {
    container.innerHTML = '<div class="p-6 text-center text-xs text-red-500">Error al cargar historial de caja.</div>';
  }
}`;

const newLoadTenantShifts = `async function loadTenantShiftsHistory() {
  const container = document.getElementById('tenantShiftsHistoryContainer');
  if (!container) return;

  container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs"><span class="inline-block animate-spin mr-2">⏳</span> Cargando historial de caja...</div>';

  try {
    const res = await fetch(\`\${API_BASE}/venues/\${state.currentVenueId}/shifts/history\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken}\` }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      container.innerHTML = \`
        <div class="p-6 text-center text-xs text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
          <p class="font-bold">Error al consultar cierres: \${data.error || 'Permisos insuficientes o fallo de red.'}</p>
          <button onclick="loadTenantShiftsHistory()" class="mt-2 text-xs font-black text-red-600 underline">Reintentar</button>
        </div>
      \`;
      return;
    }

    const shifts = data.shifts || [];
    state.shiftsHistory = shifts;

    if (shifts.length === 0) {
      container.innerHTML = \`
        <div class="p-8 text-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p class="text-xs text-slate-400">No hay historial de turnos de caja registrados en esta sede aún.</p>
        </div>
      \`;
      return;
    }

    container.innerHTML = \`
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th class="py-2.5 px-3">Fecha & Turno</th>
            <th class="py-2.5 px-3">Cajero</th>
            <th class="py-2.5 px-3 text-right">Ingresos Canchas</th>
            <th class="py-2.5 px-3 text-right">Ingresos Cafetería</th>
            <th class="py-2.5 px-3 text-right font-black">Total Turno</th>
            <th class="py-2.5 px-3 text-right">Efectivo vs Digital</th>
            <th class="py-2.5 px-2 text-center">Cuadre</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
          \${shifts.map(s => \`
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
              <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                <span>\${s.date}</span>
                <span class="text-[10px] text-slate-400 block font-normal">\${s.start_time} - \${s.end_time}</span>
              </td>
              <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">\${s.cashier_name}</td>
              <td class="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">$\${Number(s.courts_income || s.court_sales || 0).toLocaleString('es-CO')}</td>
              <td class="py-2.5 px-3 text-right text-amber-500 font-bold">$\${Number(s.cafeteria_income || s.cafeteria_sales || 0).toLocaleString('es-CO')}</td>
              <td class="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">$\${Number(s.total_collected || s.total_sales || 0).toLocaleString('es-CO')}</td>
              <td class="py-2.5 px-3 text-right text-[11px] text-slate-500">
                <span>💵 $\${Number(s.cash_collected || s.actual_cash || s.expected_cash || 0).toLocaleString('es-CO')}</span> /
                <span>💳 $\${Number(s.electronic_collected || s.total_electronic_sales || 0).toLocaleString('es-CO')}</span>
              </td>
              <td class="py-2.5 px-2 text-center">
                <span class="font-bold text-[10px] px-2 py-0.5 rounded-full \${s.difference === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}">
                  \${s.difference === 0 ? '✓ Exacto' : '$' + s.difference}
                </span>
              </td>
            </tr>
          \`).join('')}
        </tbody>
      </table>
    \`;
  } catch (err) {
    container.innerHTML = \`
      <div class="p-6 text-center text-xs text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20">
        <p class="font-bold">Error al cargar historial de caja.</p>
        <button onclick="loadTenantShiftsHistory()" class="mt-2 text-xs font-black text-red-600 underline">Reintentar</button>
      </div>
    \`;
  }
}`;

if (code.includes(oldLoadTenantShifts)) {
  code = code.replace(oldLoadTenantShifts, () => newLoadTenantShifts);
  console.log('✓ loadTenantShiftsHistory actualizado con manejo de error y estado vacío');
}

// 6. Actualizar loadSaasBillingOverview para asegurar el token de SuperAdmin
const oldLoadSaasOverview = `async function loadSaasBillingOverview() {
  const plansGrid = document.getElementById('saasPlansGrid');
  const tableContainer = document.getElementById('saasBillingTableContainer');
  const mrrEl = document.getElementById('superadminSaasMrr');
  const statusEl = document.getElementById('superadminSaasStatusSummary');

  try {
    const res = await fetch(\`\${API_BASE}/venues/saas/billing\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken}\` }
    });
    const data = await res.json();
    if (data.success && data.overview) {`;

const newLoadSaasOverview = `async function loadSaasBillingOverview() {
  const plansGrid = document.getElementById('saasPlansGrid');
  const tableContainer = document.getElementById('saasBillingTableContainer');
  const mrrEl = document.getElementById('superadminSaasMrr');
  const statusEl = document.getElementById('superadminSaasStatusSummary');

  try {
    // Garantizar que la solicitud a billing lleve token de SuperAdmin
    const superAdminToken = 'demo-user-b0000000-0000-0000-0000-000000000001';
    const res = await fetch(\`\${API_BASE}/venues/saas/billing\`, {
      headers: { 'Authorization': \`Bearer \${state.authToken || superAdminToken}\` }
    });
    const data = await res.json();
    if (data.success && data.overview) {`;

if (code.includes(oldLoadSaasOverview)) {
  code = code.replace(oldLoadSaasOverview, () => newLoadSaasOverview);
  console.log('✓ loadSaasBillingOverview actualizado con autorización asegurada');
}

// 7. Implementar el Portal del Jugador, Folio Unificado, Checkout 1-Paso y Arqueo al final de app.js
const additionalEngineLogic = `
// ============================================================
// SISTEMA DESTABRADO: FOLIO UNIFICADO, PORTAL JUGADOR Y 1-PASO
// ============================================================

let currentUnifiedFolioData = null;
let currentFolioPaymentMethod = 'cash';
let currentBookingModality = 'deposit_50';
let currentActiveBookingSlot = null;

// Control de Acceso y Bloqueo de Anónimos en la Grilla Pública
function handlePublicSlotClick(startTime, endTime, price, fieldId) {
  const isAuth = !!localStorage.getItem('canchapro_token');
  if (isAuth) {
    window.location.href = \`dashboard.html?role=cliente&tab=nueva&field=\${fieldId}&date=\${state.selectedDate}&time=\${startTime}&price=\${price}\`;
  } else {
    state.pendingPublicBooking = { startTime, endTime, price, fieldId, date: state.selectedDate };
    openAuthModal();
    showToast('Inicia sesión o regístrate para apartar este turno en tu portal.', 'warning');
  }
}

function switchAuthTab(tab) {
  const btnLogin = document.getElementById('authTabBtn_login');
  const btnReg = document.getElementById('authTabBtn_register');
  const formLogin = document.getElementById('authLoginForm');
  const formReg = document.getElementById('authRegisterForm');

  if (tab === 'login') {
    if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-xl font-black bg-blue-600 text-white transition shadow-sm';
    if (btnReg) btnReg.className = 'flex-1 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition';
    if (formLogin) formLogin.classList.remove('hidden');
    if (formReg) formReg.classList.add('hidden');
  } else {
    if (btnReg) btnReg.className = 'flex-1 py-2 rounded-xl font-black bg-blue-600 text-white transition shadow-sm';
    if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition';
    if (formReg) formReg.classList.remove('hidden');
    if (formLogin) formLogin.classList.add('hidden');
  }
}

async function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('authRegisterName')?.value || 'Nuevo Jugador';
  const email = document.getElementById('authRegisterEmail')?.value || 'jugador@canchapro.com';
  const phone = document.getElementById('authRegisterPhone')?.value || '3001234567';

  state.currentUser = {
    id: 'b0000000-0000-0000-0000-000000000004',
    name,
    email,
    phone,
    role: 'cliente',
    venue_id: state.currentVenueId
  };
  state.authToken = \`demo-user-\${state.currentUser.id}\`;
  localStorage.setItem('canchapro_token', state.authToken);
  localStorage.setItem('canchapro_role', 'cliente');

  showToast(\`¡Cuenta creada con éxito! Bienvenido, \${name}.\`, 'success');
  closeAuthModal();

  if (window.location.pathname.includes('dashboard')) {
    switchActiveRole('cliente');
  } else {
    window.location.href = 'dashboard.html?role=cliente&tab=nueva';
  }
}

// ------------------------------------------------------------
// PORTAL DEL JUGADOR: 2 PESTAÑAS (MIS RESERVAS vs NUEVA RESERVA)
// ------------------------------------------------------------

function initClientPortal() {
  const currentVenue = state.venues.find(v => v.id === state.currentVenueId) || state.venues[0];
  const greetingEl = document.getElementById('clientPortalGreeting');
  const venueLabel = document.getElementById('clientPortalVenueLabel');

  if (greetingEl) greetingEl.innerText = \`Bienvenido, \${state.currentUser?.name || 'Mateo Jugador'}\`;
  if (venueLabel && currentVenue) {
    venueLabel.innerHTML = \`Sede Asignada: <strong class="text-slate-900 dark:text-white">\${currentVenue.name} (\${currentVenue.city})</strong>\`;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get('tab') || 'reservas';
  switchClientPortalTab(requestedTab === 'nueva' || requestedTab === 'nueva_reserva' ? 'nueva' : 'reservas');
}

function switchClientPortalTab(tabName) {
  state.clientActiveTab = tabName;
  const btnRes = document.getElementById('clientTabBtn_reservas');
  const btnNueva = document.getElementById('clientTabBtn_nueva');
  const paneRes = document.getElementById('clientTabPane_reservas');
  const paneNueva = document.getElementById('clientTabPane_nueva');

  if (tabName === 'nueva') {
    if (btnNueva) btnNueva.className = 'px-4 py-2 rounded-xl font-black bg-blue-600 text-white transition flex items-center space-x-1.5 shadow-sm';
    if (btnRes) btnRes.className = 'px-4 py-2 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1.5';
    if (paneNueva) paneNueva.classList.remove('hidden');
    if (paneRes) paneRes.classList.add('hidden');
    loadClientPortalBookingGrid();
  } else {
    if (btnRes) btnRes.className = 'px-4 py-2 rounded-xl font-black bg-blue-600 text-white transition flex items-center space-x-1.5 shadow-sm';
    if (btnNueva) btnNueva.className = 'px-4 py-2 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1.5';
    if (paneRes) paneRes.classList.remove('hidden');
    if (paneNueva) paneNueva.classList.add('hidden');
    loadClientReservations();
  }

  if (window.feather) feather.replace();
}

function setClientPortalDate(type) {
  const dateInput = document.getElementById('clientPortalDatePicker');
  const btnToday = document.getElementById('btnClientDateToday');
  const btnTomorrow = document.getElementById('btnClientDateTomorrow');

  let targetDate = getBogotaDate();
  if (type === 'tomorrow') {
    targetDate = getBogotaDate(1);
    if (btnTomorrow) btnTomorrow.className = 'px-3 py-1.5 rounded-xl font-black bg-emerald-500 text-slate-950 transition';
    if (btnToday) btnToday.className = 'px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition';
  } else {
    if (btnToday) btnToday.className = 'px-3 py-1.5 rounded-xl font-black bg-emerald-500 text-slate-950 transition';
    if (btnTomorrow) btnTomorrow.className = 'px-3 py-1.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition';
  }

  if (dateInput) dateInput.value = targetDate;
  state.selectedDate = targetDate;
  loadClientPortalBookingGrid();
}

function onClientPortalDateChanged() {
  const dateInput = document.getElementById('clientPortalDatePicker');
  if (dateInput && dateInput.value) {
    state.selectedDate = dateInput.value;
    loadClientPortalBookingGrid();
  }
}

function selectClientPortalCourt(fieldId) {
  state.selectedFieldId = fieldId;
  loadClientPortalBookingGrid();
}

// ------------------------------------------------------------
// CHECKOUT UNIFICADO DE RESERVA EN 1 SOLO PASO
// ------------------------------------------------------------

function openUnifiedBookingCheckout(slotData) {
  currentActiveBookingSlot = slotData;
  const modal = document.getElementById('modalUnifiedBookingCheckout');
  const title = document.getElementById('checkoutCourtTitle');
  const dtSummary = document.getElementById('checkoutDateTimeSummary');
  const totalSummary = document.getElementById('checkoutTotalAmountSummary');

  if (modal) modal.classList.remove('hidden');
  if (title) title.innerText = slotData.fieldName || 'Cancha Principal';
  if (dtSummary) dtSummary.innerText = \`\${slotData.date} | \${slotData.startTime} - \${slotData.endTime}\`;
  if (totalSummary) totalSummary.innerText = \`$\${slotData.price.toLocaleString('es-CO')} COP\`;

  setBookingModalModality('deposit_50');
  renderUnifiedCheckoutPaymentMethods();

  if (window.feather) feather.replace();
}

function closeUnifiedBookingCheckout() {
  const modal = document.getElementById('modalUnifiedBookingCheckout');
  if (modal) modal.classList.add('hidden');
}

function setBookingModalModality(modality) {
  currentBookingModality = modality;
  const b50 = document.getElementById('bmBtn_deposit50');
  const bFull = document.getElementById('bmBtn_full');
  const bVaca = document.getElementById('bmBtn_vaca');
  const vacaBox = document.getElementById('bookingVacaConfigBox');
  const payLabel = document.getElementById('checkoutAmountToPayLabel');

  [b50, bFull, bVaca].forEach(b => {
    if (b) b.className = 'p-3 rounded-2xl border text-center font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition';
  });

  const price = currentActiveBookingSlot ? currentActiveBookingSlot.price : 130000;
  const depAmount = Math.round(price * 0.5);

  const depLabel = document.getElementById('bmDepositAmountLabel');
  const fullLabel = document.getElementById('bmFullAmountLabel');
  const vacaQuota = document.getElementById('bmVacaQuotaLabel');

  if (depLabel) depLabel.innerText = \`$\${depAmount.toLocaleString('es-CO')}\`;
  if (fullLabel) fullLabel.innerText = \`$\${price.toLocaleString('es-CO')}\`;
  if (vacaQuota) vacaQuota.innerText = \`$\${Math.ceil(price / 10).toLocaleString('es-CO')} c/u\`;

  if (modality === 'deposit_50') {
    if (b50) b50.className = 'p-3 rounded-2xl border text-center font-black border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition';
    if (vacaBox) vacaBox.classList.add('hidden');
    if (payLabel) payLabel.innerText = \`Pagar Ahora (Abono 50%): $\${depAmount.toLocaleString('es-CO')} COP\`;
  } else if (modality === 'full') {
    if (bFull) bFull.className = 'p-3 rounded-2xl border text-center font-black border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition';
    if (vacaBox) vacaBox.classList.add('hidden');
    if (payLabel) payLabel.innerText = \`Pagar Ahora (Total 100%): $\${price.toLocaleString('es-CO')} COP\`;
  } else {
    if (bVaca) bVaca.className = 'p-3 rounded-2xl border text-center font-black border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition';
    if (vacaBox) vacaBox.classList.remove('hidden');
    onBookingVacaRangeChanged();
  }
}

function onBookingVacaRangeChanged() {
  const range = document.getElementById('bmVacaPlayersRange');
  const label = document.getElementById('bmVacaPlayersCountLabel');
  const payLabel = document.getElementById('checkoutAmountToPayLabel');
  const quotaLabel = document.getElementById('bmVacaQuotaLabel');
  if (!range) return;

  const count = parseInt(range.value, 10);
  if (label) label.innerText = \`\${count} jugadores\`;

  const total = currentActiveBookingSlot ? currentActiveBookingSlot.price : 130000;
  const quota = Math.ceil(total / count);
  if (quotaLabel) quotaLabel.innerText = \`$\${quota.toLocaleString('es-CO')} c/u\`;
  if (payLabel) payLabel.innerText = \`Tu Cuota Capitán: $\${quota.toLocaleString('es-CO')} COP\`;
}

async function renderUnifiedCheckoutPaymentMethods() {
  const container = document.getElementById('unifiedCheckoutPaymentMethodsContainer');
  if (!container) return;

  const slot = currentActiveBookingSlot;
  const total = slot ? slot.price : 130000;
  const amountToPay = currentBookingModality === 'full' ? total : Math.round(total * 0.5);

  container.innerHTML = '<div class="p-3 text-center text-slate-400 text-xs"><span class="inline-block animate-spin mr-2">⏳</span> Consultando medios de pago...</div>';

  try {
    const res = await fetch(\`\${API_BASE}/venues/\${state.currentVenueId}/payment-methods\`);
    const data = await res.json();
    if (data.success && data.payment_methods) {
      const pm = data.payment_methods;
      let html = '';

      if (pm.wompi_enabled || (pm.wompi && pm.wompi.is_active)) {
        html += \`
          <div class="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">⚡</span>
              <div>
                <span class="font-black text-slate-900 dark:text-white block text-xs">Pasarela Digital Wompi (PSE / Tarjetas)</span>
                <span class="text-[10px] text-slate-500">Confirmación automática instantánea</span>
              </div>
            </div>
            <button type="button" onclick="showToast('💳 Abriendo checkout Wompi por $\${amountToPay.toLocaleString('es-CO')}', 'success')" class="bg-emerald-500 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl hover:bg-emerald-400 transition">Pagar Online</button>
          </div>
        \`;
      }

      if (pm.cash_accepted || pm.cash_on_arrival) {
        html += \`
          <div class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-slate-700 text-white font-black flex items-center justify-center text-xs">💵</span>
              <div>
                <span class="font-black text-slate-900 dark:text-white block text-xs">Efectivo en Mostrador</span>
                <span class="text-[10px] text-slate-500">Cancela el valor al llegar a la sede deportiva</span>
              </div>
            </div>
            <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Habilitado</span>
          </div>
        \`;
      }

      if (pm.nequi && pm.nequi.is_active) {
        html += \`
          <div class="bg-purple-500/10 border border-purple-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-purple-600 text-white font-black flex items-center justify-center text-xs">N</span>
              <div>
                <span class="font-black text-slate-900 dark:text-white block text-xs">Nequi: \${pm.nequi.phone_number}</span>
                <span class="text-[10px] text-slate-500">Titular: \${pm.nequi.account_name}</span>
              </div>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('\${pm.nequi.phone_number}'); showToast('📋 Número Nequi copiado', 'success');" class="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline">Copiar</button>
          </div>
        \`;
      }

      if (pm.daviplata && pm.daviplata.is_active) {
        html += \`
          <div class="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-xs">D</span>
              <div>
                <span class="font-black text-slate-900 dark:text-white block text-xs">Daviplata: \${pm.daviplata.phone_number}</span>
                <span class="text-[10px] text-slate-500">Titular: \${pm.daviplata.account_name}</span>
              </div>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('\${pm.daviplata.phone_number}'); showToast('📋 Número Daviplata copiado', 'success');" class="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline">Copiar</button>
          </div>
        \`;
      }

      if (pm.bancolombia && pm.bancolombia.is_active) {
        html += \`
          <div class="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">B</span>
              <div>
                <span class="font-black text-slate-900 dark:text-white block text-xs">Bancolombia \${pm.bancolombia.account_type}: \${pm.bancolombia.account_number}</span>
                <span class="text-[10px] text-slate-500">\${pm.bancolombia.account_name} \${pm.bancolombia.bre_b_key ? '• Bre-B: ' + pm.bancolombia.bre_b_key : ''}</span>
              </div>
            </div>
            <button type="button" onclick="navigator.clipboard.writeText('\${pm.bancolombia.account_number}'); showToast('📋 Cuenta Bancolombia copiada', 'success');" class="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">Copiar</button>
          </div>
        \`;
      }

      container.innerHTML = html || '<p class="text-xs text-slate-400">Paga en efectivo al llegar a la cancha.</p>';
    }
  } catch (e) {
    container.innerHTML = '<p class="text-xs text-slate-400">Paga en taquilla al ingresar a la sede.</p>';
  }
}

function handleBookingReceiptFile(e) {
  const file = e.target.files[0];
  const nameEl = document.getElementById('bmReceiptFileName');
  if (file && nameEl) {
    nameEl.innerText = \`✓ \${file.name}\`;
    nameEl.classList.remove('hidden');
  }
}

async function handleUnifiedBookingSubmit(e) {
  e.preventDefault();
  if (!currentActiveBookingSlot) return;

  const btn = document.getElementById('btnSubmitUnifiedBooking');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span> Apartando turno...';
  }

  const slot = currentActiveBookingSlot;
  const user = state.currentUser || { name: 'Mateo Jugador', email: 'mateo@gmail.com', phone: '3012345678' };
  const ref = document.getElementById('bmPaymentRefInput')?.value || 'TRANSFERENCIA-DIRECTA';

  try {
    const res = await fetch(\`\${API_BASE}/reservations/hold\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${state.authToken}\`
      },
      body: JSON.stringify({
        venue_id: state.currentVenueId,
        field_id: slot.fieldId,
        booking_date: slot.date,
        start_time: slot.startTime,
        end_time: slot.endTime,
        client_name: user.name,
        client_phone: user.phone || '3012345678',
        client_email: user.email || 'mateo@gmail.com',
        payment_mode: currentBookingModality
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || 'Horario no disponible.', 'warning');
      return;
    }

    const resId = data.reservation.id;

    // Si es La Vaca, inicializar el split
    if (currentBookingModality === 'vaca_split') {
      const range = document.getElementById('bmVacaPlayersRange');
      const count = range ? parseInt(range.value, 10) : 10;
      await fetch(\`\${API_BASE}/vaca/initialize\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: resId, total_players: count })
      });
      showToast('🐄 "La Vaca Digital" inicializada con éxito.', 'success');
    }

    // Registrar recibo / comprobante
    await fetch(\`\${API_BASE}/reservations/\${resId}/receipt\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_reference: ref, receipt_url: 'https://storage.canchapro.com/receipts/demo.jpg' })
    });

    showToast('✅ ¡Turno reservado y comprobante enviado a verificación!', 'success');
    closeUnifiedBookingCheckout();
    switchClientPortalTab('reservas');
  } catch (err) {
    showToast('Error de conexión al procesar reserva.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

// ------------------------------------------------------------
// MODAL FOLIO UNIFICADO (ÚNICA FUENTE DE VERDAD)
// ------------------------------------------------------------

function setFolioPaymentMethod(method) {
  currentFolioPaymentMethod = method;
  const methods = ['cash', 'nequi', 'wompi', 'mixed'];
  methods.forEach(m => {
    const btn = document.getElementById(\`btnFolioPay_\${m}\`);
    if (btn) {
      if (m === method) {
        btn.className = 'p-2 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition font-black';
      } else {
        btn.className = 'p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition font-bold';
      }
    }
  });

  const mixedBox = document.getElementById('folioMixedPaymentBox');
  if (mixedBox) {
    if (method === 'mixed') {
      mixedBox.classList.remove('hidden');
      recalcFolioMixed();
    } else {
      mixedBox.classList.add('hidden');
    }
  }
}

function recalcFolioMixed() {
  const cashInput = document.getElementById('folioMixedCashInput');
  const elecInput = document.getElementById('folioMixedElecInput');
  const badge = document.getElementById('folioMixedMatchBadge');
  if (!cashInput || !elecInput || !badge || !currentUnifiedFolioData) return;

  const total = currentUnifiedFolioData.grand_total_due || 0;
  const cash = Number(cashInput.value || 0);
  const elec = Number(elecInput.value || 0);
  const sum = cash + elec;

  if (sum === total) {
    badge.className = 'font-black text-emerald-600 dark:text-emerald-400';
    badge.innerText = '✓ Cuadre exacto';
  } else if (sum < total) {
    badge.className = 'font-black text-red-500';
    badge.innerText = \`Faltan $\${(total - sum).toLocaleString('es-CO')}\`;
  } else {
    badge.className = 'font-black text-amber-500';
    badge.innerText = \`Sobra $\${(sum - total).toLocaleString('es-CO')}\`;
  }
}

function closeUnifiedFolioModal() {
  const modal = document.getElementById('modalUnifiedFolio');
  if (modal) modal.classList.add('hidden');
}

// ------------------------------------------------------------
// MODAL SUBIR COMPROBANTE DESDE PORTAL DEL JUGADOR
// ------------------------------------------------------------

function openUploadReceiptModal(reservationId, fieldName, pendingAmount) {
  state.currentReceiptResId = reservationId;
  const modal = document.getElementById('modalUploadReceipt');
  const title = document.getElementById('receiptModalReservationTitle');
  if (title) title.innerText = \`\${fieldName} • Saldo: $\${Number(pendingAmount).toLocaleString('es-CO')} COP\`;
  if (modal) modal.classList.remove('hidden');
}

function closeUploadReceiptModal() {
  const modal = document.getElementById('modalUploadReceipt');
  if (modal) modal.classList.add('hidden');
}

async function handlePortalReceiptSubmit(e) {
  e.preventDefault();
  if (!state.currentReceiptResId) return;

  const ref = document.getElementById('portalReceiptRefInput')?.value || 'NEQUI-889922';
  try {
    const res = await fetch(\`\${API_BASE}/reservations/\${state.currentReceiptResId}/receipt\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_reference: ref, receipt_url: 'https://storage.canchapro.com/receipts/user.jpg' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ ¡Comprobante adjuntado con éxito! Turno en verificación.', 'success');
      closeUploadReceiptModal();
      loadClientReservations();
    } else {
      showToast(data.error || 'Error al enviar comprobante.', 'error');
    }
  } catch (err) {
    showToast('Error de comunicación con el servidor.', 'error');
  }
}

// Redirigir funciones legacy al Folio Unificado
function openFolioModal(reservationId) {
  openUnifiedFolioModal(reservationId);
}
function openUnifiedCheckoutModal(reservationId = null) {
  openUnifiedFolioModal(reservationId || 'res-demo-001');
}
`;

code += additionalEngineLogic;

fs.writeFileSync(appJsPath, code, 'utf8');
const frontendAppJsPath = path.join(__dirname, '../frontend/js/app.js');
fs.writeFileSync(frontendAppJsPath, code, 'utf8');
console.log('✓ Successfully written public/js/app.js and frontend/js/app.js');
