// ============================================================
// CANCHA PRO — Frontend Application Logic
// Tema Claro/Oscuro, Menú Lateral, CRUD de Canchas y Parrilla
// ============================================================

const API_BASE = (window.location.protocol === 'file:' || window.location.origin === 'null' || window.location.port === '3000' || window.location.port === '8080')
  ? 'http://localhost:5000/api'
  : (window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1'))
    ? `${window.location.origin}/api`
    : '/api';

// Estado global de la aplicación
const state = {
  currentVenueId: 'a0000000-0000-0000-0000-000000000001', // La Bernabéu (Cartagena)
  venues: [],
  fields: [],
  selectedFieldId: 'f0000000-0000-0000-0000-000000000001',
  selectedDate: new Date().toISOString().split('T')[0],
  currentHoldSlot: null,
  holdTimerInterval: null,
  remainingSeconds: 600,
  activeRole: 'superadmin',
  posCart: [],
  theme: localStorage.getItem('canchapro_theme') || 'dark',
  authToken: localStorage.getItem('canchapro_token') || 'demo-user-u0000000-0000-0000-0000-000000000001'
};

// ============================================================
// GESTIÓN DE TEMA: MODO CLARO Y MODO OSCURO
// ============================================================

function initTheme() {
  const saved = localStorage.getItem('canchapro_theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('canchapro_theme', theme);
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (sunIcon && moonIcon) {
    if (theme === 'dark') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  showToast(nextTheme === 'dark' ? '🌙 Modo Oscuro activado' : '☀️ Modo Claro activado', 'success');
}

// ============================================================
// MENÚ LATERAL DESPLEGABLE (OFF-CANVAS DRAWER)
// ============================================================

function openNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  if (!drawer) return;
  drawer.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  setTimeout(() => {
    drawer.classList.add('drawer-open');
  }, 10);
}

function closeNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  if (!drawer) return;
  drawer.classList.remove('drawer-open');
  document.body.classList.remove('overflow-hidden');
  setTimeout(() => {
    drawer.classList.add('hidden');
  }, 350);
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const datePicker = document.getElementById('gridDatePicker');
  if (datePicker) {
    datePicker.value = state.selectedDate;
  }

  await loadVenues();
  await loadGridAvailability();
  loadTournamentStandings();
  updateDemoVacaCalculation();
  if (window.feather) feather.replace();
});

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' 
    ? 'bg-emerald-600' 
    : (type === 'warning' ? 'bg-amber-500' : 'bg-red-600');
    
  toast.className = `${bg} text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 transform transition-all duration-300 translate-y-2 opacity-0 z-50`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Cargar Sedes
async function loadVenues() {
  try {
    const res = await fetch(`${API_BASE}/venues`);
    const data = await res.json();
    if (data.success) {
      state.venues = data.venues;
      const v = state.venues.find(v => v.id === state.currentVenueId);
      if (v && v.fields) {
        state.fields = v.fields;
        renderCourtTabs();
      }
    }
  } catch (err) {
    console.error('Error cargando sedes:', err);
  }
}

// Renderizar tabs de canchas de la sede (incluye activas y suspendidas con su distintivo)
function renderCourtTabs() {
  const container = document.getElementById('courtTabsContainer');
  if (!container) return;

  if (!state.fields || state.fields.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400">No hay canchas registradas en esta sede.</span>`;
    return;
  }

  // Si la cancha seleccionada no está en la lista, seleccionar la primera disponible
  if (!state.fields.some(f => f.id === state.selectedFieldId)) {
    state.selectedFieldId = state.fields[0].id;
  }

  container.innerHTML = state.fields.map(f => {
    const isSelected = f.id === state.selectedFieldId;
    const isSuspended = !f.is_active;

    let btnClass = '';
    if (isSuspended) {
      btnClass = isSelected
        ? 'bg-red-600 text-white font-black border-red-700 shadow-md shadow-red-500/25'
        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20 font-bold';
    } else {
      btnClass = isSelected
        ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20'
        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 font-bold';
    }

    return `
      <button onclick="selectCourt('${f.id}')" class="px-5 py-2.5 rounded-2xl text-xs whitespace-nowrap border transition flex items-center space-x-2 ${btnClass}">
        <span>${f.name}</span>
        ${isSuspended ? '<span class="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">Suspendida</span>' : ''}
      </button>
    `;
  }).join('');

  updateCourtInfoBanner();
}

function selectCourt(fieldId) {
  state.selectedFieldId = fieldId;
  renderCourtTabs();
  loadGridAvailability();
}

function updateCourtInfoBanner() {
  const field = state.fields.find(f => f.id === state.selectedFieldId);
  if (!field) return;

  const titleEl = document.getElementById('currentCourtTitle');
  const descEl = document.getElementById('currentCourtDesc');
  const valleyEl = document.getElementById('courtPriceValley');
  const peakEl = document.getElementById('courtPricePeak');

  if (titleEl) {
    if (!field.is_active) {
      titleEl.innerHTML = `<span class="line-through opacity-70">${field.name}</span> <span class="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded-full uppercase ml-2">Suspendida</span>`;
    } else {
      titleEl.innerText = field.name;
    }
  }

  if (descEl) {
    if (!field.is_active) {
      descEl.innerHTML = `<strong class="text-red-500 font-bold">⚠️ CANCHA TEMPORALMENTE SUSPENDIDA.</strong> Comunícate con el administrador del sistema para más información.`;
    } else {
      descEl.innerText = field.description || 'Grama sintética profesional con iluminación de alta potencia';
    }
  }

  if (valleyEl) valleyEl.innerText = `$${Number(field.default_price_per_hour).toLocaleString('es-CO')} COP`;
  if (peakEl) peakEl.innerText = `$${Number(field.peak_price_per_hour).toLocaleString('es-CO')} COP`;
}

// Cambiar sede
function changeVenue(venueId) {
  state.currentVenueId = venueId;
  const v = state.venues.find(item => item.id === venueId);
  if (v) {
    const label = document.getElementById('currentVenueLabel');
    if (label) label.innerText = `${v.name} (${v.city})`;
    state.fields = v.fields || [];
    if (state.fields.length > 0) {
      state.selectedFieldId = state.fields[0].id;
    }
    renderCourtTabs();
    loadGridAvailability();
  }
}

// Filtro de fecha rápido
function setGridDate(mode) {
  const todayBtn = document.getElementById('btnDateToday');
  const tomorrowBtn = document.getElementById('btnDateTomorrow');
  const picker = document.getElementById('gridDatePicker');

  const d = new Date();
  if (mode === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    if (todayBtn) todayBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
    if (tomorrowBtn) tomorrowBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 transition';
  } else {
    if (todayBtn) todayBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 transition';
    if (tomorrowBtn) tomorrowBtn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
  }

  state.selectedDate = d.toISOString().split('T')[0];
  if (picker) picker.value = state.selectedDate;
  loadGridAvailability();
}

function showPitchPlayerRole(roleName, roleDesc) {
  const tip = document.getElementById('pitchRoleTip');
  if (tip) {
    tip.innerHTML = `⚽ <strong class="text-emerald-500 dark:text-emerald-400">${roleName}:</strong> ${roleDesc}`;
  }
}

// ============================================================
// MÓDULO A: PARRILLA HORARIA EN TIEMPO REAL
// ============================================================

async function loadGridAvailability() {
  const container = document.getElementById('slotsGrid');
  if (!container) return;

  const currentField = state.fields.find(f => f.id === state.selectedFieldId);

  // VALIDACIÓN INMEDIATA: SI LA CANCHA ESTÁ SUSPENDIDA, BLOQUEAR TODA GESTIÓN
  if (currentField && currentField.is_active === false) {
    container.innerHTML = `
      <div class="col-span-full bg-red-500/10 border-2 border-dashed border-red-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-4">
        <div class="w-16 h-16 rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
          <i data-feather="lock" class="w-8 h-8"></i>
        </div>
        <div class="max-w-md mx-auto space-y-2">
          <span class="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-red-600 text-white shadow-sm inline-block">
            Cancha Suspendida / Fuera de Servicio
          </span>
          <h4 class="text-xl font-black text-slate-900 dark:text-white">
            Esta cuenta o cancha se encuentra suspendida
          </h4>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            No es posible realizar reservas, visualizar turnos ni gestionar esta instalación debido a una suspensión temporal del servicio.
          </p>
          <div class="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl text-xs font-bold text-red-700 dark:text-red-300">
            📞 Por favor, comunícate con el administrador del sistema para más información o reactivar el servicio.
          </div>
        </div>
        <div class="pt-2">
          <button onclick="showSuspendedAlertModal('${currentField.name}')" class="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-6 py-3 rounded-2xl transition shadow-lg shadow-red-600/30 inline-flex items-center space-x-2">
            <i data-feather="alert-circle" class="w-4 h-4"></i>
            <span>Ver Detalles del Bloqueo</span>
          </button>
        </div>
      </div>
    `;
    if (window.feather) feather.replace();
    return;
  }

  const datePicker = document.getElementById('gridDatePicker');
  if (datePicker && datePicker.value) {
    state.selectedDate = datePicker.value;
  }

  container.innerHTML = `
    <div class="col-span-full py-8 text-center text-slate-500 text-xs">
      <i data-feather="loader" class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500"></i>
      Consultando disponibilidad en tiempo real...
    </div>
  `;
  if (window.feather) feather.replace();

  try {
    const res = await fetch(`${API_BASE}/reservations/grid?venue_id=${state.currentVenueId}&field_id=${state.selectedFieldId}&date=${state.selectedDate}`);
    const data = await res.json();

    if (data.is_suspended || data.suspended) {
      container.innerHTML = `
        <div class="col-span-full bg-red-500/10 border-2 border-dashed border-red-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <i data-feather="slash" class="w-8 h-8"></i>
          </div>
          <div class="max-w-md mx-auto space-y-2">
            <span class="text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full bg-red-600 text-white shadow-sm inline-block">
              Bloqueo Activo
            </span>
            <h4 class="text-xl font-black text-slate-900 dark:text-white">
              ${data.error || 'Esta cuenta o cancha se encuentra suspendida'}
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-400">
              Comunícate con el administrador del sistema para restablecer el servicio.
            </p>
          </div>
        </div>
      `;
      if (window.feather) feather.replace();
      return;
    }

    if (!data.success || !data.slots) {
      container.innerHTML = `<p class="col-span-full text-center text-red-500 text-xs">Error al consultar horarios.</p>`;
      return;
    }

    container.innerHTML = data.slots.map(slot => {
      if (slot.status === 'available') {
        return `
          <div onclick="openBookingModal('${slot.start_time}', '${slot.end_time}', ${slot.price})" 
               class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 p-4 rounded-3xl cursor-pointer transition-card flex flex-col justify-between h-36 group shadow-sm dark:shadow-none">
            <div class="flex items-center justify-between">
              <span class="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-500 transition">${slot.start_time} - ${slot.end_time}</span>
              ${slot.is_peak ? '<span class="text-[9px] uppercase font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-md">Pico 🔥</span>' : '<span class="text-[9px] uppercase font-bold text-slate-400">Valle</span>'}
            </div>
            <div>
              <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 block text-base">$${slot.price.toLocaleString('es-CO')}</span>
              <span class="text-[10px] text-slate-500 font-medium">Disponible</span>
            </div>
            <div class="w-full bg-emerald-500/10 group-hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 group-hover:text-slate-950 text-[11px] font-black py-1.5 rounded-xl text-center transition">
              Reservar Turno
            </div>
          </div>
        `;
      } else if (slot.status === 'held') {
        const seconds = slot.reservation?.seconds_remaining || 600;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `
          <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-400 dark:border-amber-500/50 p-4 rounded-3xl flex flex-col justify-between h-36 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-sm font-black text-amber-700 dark:text-amber-300">${slot.start_time} - ${slot.end_time}</span>
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            </div>
            <div>
              <span class="text-[11px] font-black text-amber-600 dark:text-amber-400 block">EN PAGO (Retenido)</span>
              <span class="text-[10px] text-slate-600 dark:text-slate-400">Expira en: ${mins}:${String(secs).padStart(2, '0')}</span>
            </div>
            <div class="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-500/20 py-1.5 rounded-xl text-center font-bold">
              Bloqueado 10 min
            </div>
          </div>
        `;
      } else {
        return `
          <div class="bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-4 rounded-3xl flex flex-col justify-between h-36 opacity-75">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-slate-500 dark:text-slate-400">${slot.start_time} - ${slot.end_time}</span>
              <i data-feather="check-circle" class="w-3.5 h-3.5 text-slate-400"></i>
            </div>
            <div>
              <span class="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Reservado</span>
              <span class="text-[10px] text-slate-500">${slot.reservation?.client_name || 'Confirmado'}</span>
            </div>
            <div class="text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-900 py-1.5 rounded-xl text-center font-semibold">
              No disponible
            </div>
          </div>
        `;
      }
    }).join('');

    if (window.feather) feather.replace();
  } catch (err) {
    console.error('Error cargando slots:', err);
    container.innerHTML = `<p class="col-span-full text-center text-red-500 text-xs">Error de conexión con el backend.</p>`;
  }
}

// ============================================================
// MODAL DE RESERVA CON CRONÓMETRO DE 10 MINUTOS
// ============================================================

let currentSelectedPaymentMode = 'deposit_50';

function openBookingModal(startTime, endTime, price) {
  const field = state.fields.find(f => f.id === state.selectedFieldId);
  if (field && field.is_active === false) {
    showSuspendedAlertModal(field.name);
    return;
  }

  state.currentHoldSlot = { startTime, endTime, price };
  
  const modal = document.getElementById('bookingModal');
  const courtName = document.getElementById('modalCourtName');
  const dateTime = document.getElementById('modalDateTime');
  const totalAmount = document.getElementById('modalTotalAmount');
  const depositAmount = document.getElementById('modalDepositAmount');

  const field = state.fields.find(f => f.id === state.selectedFieldId);

  if (courtName) courtName.innerText = field ? field.name : 'Cancha';
  if (dateTime) dateTime.innerText = `${state.selectedDate} | ${startTime} - ${endTime}`;
  if (totalAmount) totalAmount.innerText = `$${price.toLocaleString('es-CO')} COP`;
  if (depositAmount) depositAmount.innerText = `$${Math.round(price * 0.5).toLocaleString('es-CO')} COP`;

  startHoldCountdown(600);
  modal.classList.remove('hidden');
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.add('hidden');
  clearInterval(state.holdTimerInterval);
}

function startHoldCountdown(durationSeconds) {
  clearInterval(state.holdTimerInterval);
  state.remainingSeconds = durationSeconds;

  const timerEl = document.getElementById('holdCountdown');

  function update() {
    const mins = Math.floor(state.remainingSeconds / 60);
    const secs = state.remainingSeconds % 60;
    if (timerEl) {
      timerEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    if (state.remainingSeconds <= 0) {
      clearInterval(state.holdTimerInterval);
      showToast('⚠️ El tiempo de retención de 10 minutos ha expirado. El turno fue liberado.', 'warning');
      closeBookingModal();
      loadGridAvailability();
    }
    state.remainingSeconds--;
  }

  update();
  state.holdTimerInterval = setInterval(update, 1000);
}

function selectPaymentMode(mode) {
  currentSelectedPaymentMode = mode;
  const b50 = document.getElementById('optDeposit50');
  const bFull = document.getElementById('optFull');
  const bVaca = document.getElementById('optVaca');

  [b50, bFull, bVaca].forEach(b => {
    if (b) {
      b.className = 'p-3 rounded-2xl border text-center text-xs font-bold border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  });

  if (mode === 'deposit_50' && b50) {
    b50.className = 'p-3 rounded-2xl border text-center text-xs font-black border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
  } else if (mode === 'full' && bFull) {
    bFull.className = 'p-3 rounded-2xl border text-center text-xs font-black border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300';
  } else if (mode === 'vaca_split' && bVaca) {
    bVaca.className = 'p-3 rounded-2xl border text-center text-xs font-black border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300';
  }
}

async function submitReservationHold() {
  if (!state.currentHoldSlot) return;

  const clientName = document.getElementById('bookingClientName').value;
  const clientPhone = document.getElementById('bookingClientPhone').value;
  const clientEmail = document.getElementById('bookingClientEmail').value;
  const terms = document.getElementById('acceptTermsCheck').checked;

  if (!terms) {
    showToast('Debes aceptar las normas de calzado turf y políticas de cancelación.', 'warning');
    return;
  }

  const payload = {
    venue_id: state.currentVenueId,
    field_id: state.selectedFieldId,
    booking_date: state.selectedDate,
    start_time: state.currentHoldSlot.startTime,
    end_time: state.currentHoldSlot.endTime,
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,
    payment_mode: currentSelectedPaymentMode
  };

  try {
    const res = await fetch(`${API_BASE}/reservations/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.suspended) {
        closeBookingModal();
        showSuspendedAlertModal();
        return;
      }
      showToast(data.error || 'Horario no disponible.', 'warning');
      return;
    }

    showToast('✅ ¡Cancha retenida con éxito por 10 minutos!', 'success');
    closeBookingModal();

    if (currentSelectedPaymentMode === 'vaca_split') {
      await fetch(`${API_BASE}/vaca/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: data.reservation.id,
          total_players: 10
        })
      });
      showToast('🐄 "La Vaca Digital" inicializada. Comparte el enlace de pago con tus amigos.', 'success');
    }

    loadGridAvailability();
  } catch (err) {
    console.error('Error al retener reserva:', err);
    showToast('Error de comunicación con el servidor.', 'error');
  }
}

async function testQuickHold() {
  const d = new Date().toISOString().split('T')[0];
  state.selectedDate = d;
  openBookingModal('20:00', '21:00', 130000);
}

// ============================================================
// MÓDULO B: SIMULADOR DE "LA VACA DIGITAL"
// ============================================================

function renderVacaSquad(totalPlayers, paidCount = 7) {
  const container = document.getElementById('vacaSquadGrid');
  if (!container) return;

  let html = '';
  for (let i = 1; i <= totalPlayers; i++) {
    const isPaid = i <= paidCount;
    html += `
      <div class="flex flex-col items-center p-1.5 rounded-xl ${isPaid ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}">
        <span class="text-base">${isPaid ? '👕' : '👤'}</span>
        <span class="text-[9px] mt-0.5">#${i} ${isPaid ? '✓' : ''}</span>
      </div>
    `;
  }
  container.innerHTML = html;
}

function updateDemoVacaCalculation() {
  const range = document.getElementById('demoVacaRange');
  const label = document.getElementById('demoVacaPlayersLabel');
  const quota = document.getElementById('demoVacaQuota');
  if (!range || !quota) return;

  const players = parseInt(range.value, 10);
  if (label) label.innerText = `${players} personas`;

  const total = 130000;
  const share = Math.ceil(total / players);
  quota.innerText = `$${share.toLocaleString('es-CO')} COP`;

  renderVacaSquad(players, Math.ceil(players * 0.7));
}

function shareVacaWhatsappDemo() {
  const range = document.getElementById('demoVacaRange');
  const players = range ? range.value : 10;
  const total = 130000;
  const share = Math.ceil(total / players);

  const text = `⚽ ¡Muchachos, se armó el partido en La Bernabéu (Cartagena)!\n` +
               `💰 Cuota por cabeza: $${share.toLocaleString('es-CO')} COP\n` +
               `🐄 Entra al link de La Vaca Digital y abona tu cupo por Nequi/PSE:\n` +
               `🔗 ${window.location.origin}/index.html#la-vaca`;

  navigator.clipboard.writeText(text);
  showToast('📋 ¡Mensaje y enlace de WhatsApp copiado al portapapeles!', 'success');
}

function demoVacaSimulation() {
  const pBar = document.getElementById('demoVacaProgressBar');
  const pText = document.getElementById('demoVacaProgressText');
  const range = document.getElementById('demoVacaRange');
  const totalPlayers = range ? parseInt(range.value, 10) : 10;

  showToast('💳 Simulando abonos en tiempo real de los jugadores...', 'success');

  let paid = Math.floor(totalPlayers * 0.4);
  const interval = setInterval(() => {
    paid++;
    const pct = Math.min(100, Math.round((paid / totalPlayers) * 100));
    if (pBar) pBar.style.width = `${pct}%`;
    if (pText) pText.innerText = `${paid} de ${totalPlayers} Pagaron ($${(paid * Math.ceil(130000 / totalPlayers)).toLocaleString('es-CO')} COP)`;

    renderVacaSquad(totalPlayers, paid);

    if (paid >= totalPlayers) {
      clearInterval(interval);
      showToast('🎉 ¡Meta del 100% alcanzada! Reserva La Bernabéu CONFIRMADA automáticamente.', 'success');
    }
  }, 700);
}

// ============================================================
// MÓDULO D: TORNEOS
// ============================================================

async function loadTournamentStandings() {
  const tbody = document.getElementById('tournamentTableBody');
  if (!tbody) return;

  try {
    const res = await fetch(`${API_BASE}/tournaments/t-001/standings`);
    const data = await res.json();
    if (data.success && data.standings) {
      tbody.innerHTML = data.standings.map((t, idx) => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
          <td class="py-3 px-4 font-bold text-slate-400">${idx + 1}</td>
          <td class="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center space-x-2">
            <span>⚽ ${t.team_name}</span>
          </td>
          <td class="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium">${t.matches_played}</td>
          <td class="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">${t.matches_won}</td>
          <td class="py-3 px-4 text-center text-slate-500 dark:text-slate-400 font-medium">${t.matches_drawn}</td>
          <td class="py-3 px-4 text-center text-red-500 font-bold">${t.matches_lost}</td>
          <td class="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">${t.goal_difference > 0 ? '+' : ''}${t.goal_difference}</td>
          <td class="py-3 px-4 text-center font-black text-amber-500 dark:text-amber-400 text-sm">${t.points}</td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error cargando torneo:', e);
  }
}

// ============================================================
// AUTENTICACIÓN Y ROLES
// ============================================================

function quickLoginAs(email) {
  let role = 'superadmin';
  let token = 'demo-user-u0000000-0000-0000-0000-000000000001';

  if (email.includes('admin@bernabeu')) {
    role = 'tenant_admin';
    token = 'demo-user-u0000000-0000-0000-0000-000000000002';
  } else if (email.includes('canchero')) {
    role = 'staff';
    token = 'demo-user-u0000000-0000-0000-0000-000000000003';
  } else if (email.includes('mateo')) {
    role = 'cliente';
    token = 'demo-user-u0000000-0000-0000-0000-000000000004';
  }

  localStorage.setItem('canchapro_token', token);
  localStorage.setItem('canchapro_role', role);
  showToast(`Cambiando a rol: ${role.toUpperCase()}`, 'success');
  window.location.href = 'dashboard.html';
}

// ============================================================
// DASHBOARD: CRUD DE CANCHAS Y CONTROL TOTAL (SUPERADMIN)
// ============================================================

function initDashboard() {
  initTheme();
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
    if (bannerDesc) bannerDesc.innerText = 'Control total: Activar/Desactivar canchas, alta de nuevos complejos y CRUD completo.';
    if (bannerBadge) { bannerBadge.innerText = 'SuperAdmin'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-purple-600 text-white uppercase'; }
    if (topUserName) topUserName.innerText = 'Alejandro SuperAdmin';
    if (topUserRole) topUserRole.innerText = 'SuperAdmin • Control Global';
    loadSuperadminFields();
    loadSuperadminVenues();
  } else if (role === 'tenant_admin') {
    if (btnTenant) btnTenant.className = 'px-3 py-1 rounded-xl font-black bg-emerald-500 text-slate-950 transition';
    if (vTenant) vTenant.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Panel de Negocio: Complejo La Bernabéu';
    if (bannerDesc) bannerDesc.innerText = 'Control de tarifas dinámicas valle/pico, horarios apertura/cierre y personal de cancha.';
    if (bannerBadge) { bannerBadge.innerText = 'Admin Sede'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = 'Don Mario Administrador';
    if (topUserRole) topUserRole.innerText = 'Admin • Complejo La Bernabéu';
    loadPricingCourts();
    loadStaffList();
  } else if (role === 'staff') {
    if (btnStaff) btnStaff.className = 'px-3 py-1 rounded-xl font-black bg-amber-500 text-slate-950 transition';
    if (vStaff) vStaff.classList.remove('hidden');
    if (bannerTitle) bannerTitle.innerText = 'Terminal Operativa de Canchero & POS Cafetería';
    if (bannerDesc) bannerDesc.innerText = 'Carga consumos a las cuentas de cancha y realiza el arqueo de caja del turno.';
    if (bannerBadge) { bannerBadge.innerText = 'Canchero & POS'; bannerBadge.className = 'text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-500 text-slate-950 uppercase'; }
    if (topUserName) topUserName.innerText = 'Carlos Canchero & POS';
    if (topUserRole) topUserRole.innerText = 'Operaciones • La Bernabéu';
    loadPosProducts();
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
}

async function loadDashboardData() {
  await loadVenues();
}

// ============================================================
// CRUD DE CANCHAS PARA SUPERADMIN
// ============================================================

async function loadSuperadminFields() {
  const container = document.getElementById('superadminFieldsTableContainer');
  const countLabel = document.getElementById('superadminTotalFieldsCount');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/venues/fields/all`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success && data.fields) {
      if (countLabel) countLabel.innerText = `${data.fields.length} Canchas`;

      container.innerHTML = `
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-3 px-4">Cancha</th>
              <th class="py-3 px-4">Sede / Ciudad</th>
              <th class="py-3 px-4">Deporte</th>
              <th class="py-3 px-4">Precios Valle / Pico</th>
              <th class="py-3 px-4 text-center">Estado</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            ${data.fields.map(f => {
              const isActive = f.is_active;
              const statusBadge = isActive
                ? '<span class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black px-2.5 py-1 rounded-full border border-emerald-500/20">ACTIVA</span>'
                : '<span class="bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold px-2.5 py-1 rounded-full">DESACTIVADA</span>';

              const toggleButton = isActive
                ? `<button onclick="toggleCourtStatus('${f.id}')" class="bg-slate-200 dark:bg-slate-800 hover:bg-red-500/10 hover:text-red-600 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-1.5 rounded-xl transition border border-slate-300 dark:border-slate-700">Desactivar</button>`
                : `<button onclick="toggleCourtStatus('${f.id}')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-xl transition shadow-sm">Activar</button>`;

              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                  <td class="py-3 px-4 font-bold text-slate-900 dark:text-white">${f.name}</td>
                  <td class="py-3 px-4 text-slate-500 font-medium">${f.venue_name} (${f.venue_city || 'Cartagena'})</td>
                  <td class="py-3 px-4 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-400">${f.sport_type}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">$${f.default_price_per_hour.toLocaleString('es-CO')} / <strong class="text-amber-500">$${f.peak_price_per_hour.toLocaleString('es-CO')}</strong></td>
                  <td class="py-3 px-4 text-center">${statusBadge}</td>
                  <td class="py-3 px-4 text-right space-x-1.5">
                    ${toggleButton}
                    <button onclick='openEditFieldModal(${JSON.stringify(f).replace(/'/g, "&apos;")})' class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold px-2.5 py-1.5 rounded-xl transition">
                      Editar
                    </button>
                    <button onclick="deleteCourt('${f.id}')" class="text-red-500 hover:text-red-600 font-bold px-2 py-1.5">
                      ✕
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

// Activar o desactivar cancha en 1 clic
async function toggleCourtStatus(fieldId) {
  try {
    const res = await fetch(`${API_BASE}/venues/fields/${fieldId}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await loadSuperadminFields();
      await loadVenues();
      loadGridAvailability();
    }
  } catch (e) {
    showToast('Error al conmutar estado de cancha.', 'error');
  }
}

// Eliminar cancha
async function deleteCourt(fieldId) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta cancha permanentemente?')) return;

  try {
    const res = await fetch(`${API_BASE}/venues/fields/${fieldId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      await loadSuperadminFields();
      await loadVenues();
    }
  } catch (e) {
    showToast('Error al eliminar cancha.', 'error');
  }
}

// Modal Crear/Editar Cancha
function openNewFieldModal() {
  document.getElementById('modalFieldFormTitle').innerText = 'Crear Nueva Cancha';
  document.getElementById('fieldFormId').value = '';
  document.getElementById('fieldFormName').value = '';
  document.getElementById('fieldFormPriceValley').value = 110000;
  document.getElementById('fieldFormPricePeak').value = 130000;
  document.getElementById('fieldFormDesc').value = '';
  document.getElementById('modalNewField')?.classList.remove('hidden');
}

function openEditFieldModal(field) {
  document.getElementById('modalFieldFormTitle').innerText = `Editar Cancha: ${field.name}`;
  document.getElementById('fieldFormId').value = field.id;
  document.getElementById('fieldFormVenue').value = field.venue_id;
  document.getElementById('fieldFormName').value = field.name;
  document.getElementById('fieldFormSport').value = field.sport_type;
  document.getElementById('fieldFormSurface').value = field.surface_type;
  document.getElementById('fieldFormPriceValley').value = field.default_price_per_hour;
  document.getElementById('fieldFormPricePeak').value = field.peak_price_per_hour;
  document.getElementById('fieldFormDesc').value = field.description || '';
  document.getElementById('modalNewField')?.classList.remove('hidden');
}

function closeNewFieldModal() {
  document.getElementById('modalNewField')?.classList.add('hidden');
}

async function handleSaveField(e) {
  e.preventDefault();
  const id = document.getElementById('fieldFormId').value;
  const venueId = document.getElementById('fieldFormVenue').value;
  const name = document.getElementById('fieldFormName').value;
  const sport = document.getElementById('fieldFormSport').value;
  const surface = document.getElementById('fieldFormSurface').value;
  const valley = document.getElementById('fieldFormPriceValley').value;
  const peak = document.getElementById('fieldFormPricePeak').value;
  const desc = document.getElementById('fieldFormDesc').value;

  const payload = {
    venue_id: venueId,
    name,
    sport_type: sport,
    surface_type: surface,
    default_price_per_hour: Number(valley),
    peak_price_per_hour: Number(peak),
    description: desc
  };

  const url = id ? `${API_BASE}/venues/fields/${id}` : `${API_BASE}/venues/fields`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Cancha actualizada con éxito' : 'Nueva cancha creada con éxito', 'success');
      closeNewFieldModal();
      await loadSuperadminFields();
      await loadVenues();
    }
  } catch (err) {
    showToast('Error al guardar cancha.', 'error');
  }
}

// Carga Sedes SuperAdmin
async function loadSuperadminVenues() {
  const container = document.getElementById('superadminVenuesList');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/venues`);
    const data = await res.json();
    if (data.success) {
      container.innerHTML = data.venues.map(v => `
        <div class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-3 shadow-sm dark:shadow-none transition">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase block">${v.city}</span>
              <h4 class="font-black text-slate-900 dark:text-white text-base">${v.name}</h4>
              <p class="text-xs text-slate-500 mt-0.5">${v.address}</p>
            </div>
            <span class="w-3 h-3 rounded-full bg-emerald-500 pulse-live"></span>
          </div>

          <div class="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl text-center">
            <div>
              <span class="text-slate-400 block font-medium">Canchas</span>
              <span class="font-bold text-slate-800 dark:text-white">${v.fields_count || 3}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Horario</span>
              <span class="font-bold text-slate-800 dark:text-white">${v.open_time} - ${v.close_time}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-medium">Abono Min</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${v.deposit_percentage}%</span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1 text-xs">
            <span class="text-slate-500">Tel: ${v.phone}</span>
            <button class="font-bold text-purple-600 dark:text-purple-400 hover:underline">Configurar Sede →</button>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

// Carga Precios Canchas (Tenant Admin)
async function loadPricingCourts() {
  const container = document.getElementById('pricingCourtsContainer');
  if (!container) return;

  const fields = state.fields.length > 0 ? state.fields : [];

  container.innerHTML = fields.map(f => {
    const isSuspended = !f.is_active;

    if (isSuspended) {
      return `
        <div class="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div>
            <div class="flex items-center space-x-2">
              <h5 class="font-black text-slate-900 dark:text-white text-sm line-through opacity-70">${f.name}</h5>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white">SUSPENDIDA</span>
            </div>
            <p class="text-red-600 dark:text-red-400 font-bold text-[11px] mt-1">
              ⚠️ Cancha desactivada por el Administrador. Gestión de tarifas bloqueada. Comunícate con el administrador del sistema.
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="showSuspendedAlertModal('${f.name}')" class="bg-red-600 hover:bg-red-500 text-white font-black px-3.5 py-2 rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5">
              <i data-feather="lock" class="w-3.5 h-3.5"></i>
              <span>Bloqueada</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div>
          <h5 class="font-black text-slate-900 dark:text-white text-sm">${f.name}</h5>
          <span class="text-slate-500 text-[11px]">Tarifa normal vs Tarifa en alta demanda</span>
        </div>
        <div class="flex items-center space-x-3">
          <div>
            <label class="block text-slate-500 text-[10px] font-bold">Precio Valle</label>
            <input type="number" id="priceValle_${f.id}" value="${f.default_price_per_hour}" class="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-bold text-xs">
          </div>
          <div>
            <label class="block text-amber-500 text-[10px] font-bold">Precio Pico</label>
            <input type="number" id="pricePeak_${f.id}" value="${f.peak_price_per_hour}" class="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-slate-900 dark:text-white font-bold text-xs">
          </div>
          <button onclick="saveFieldPrice('${f.id}')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl mt-3 text-xs transition shadow-sm">
            Actualizar
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.feather) feather.replace();
}

async function saveFieldPrice(fieldId) {
  const valle = document.getElementById(`priceValle_${fieldId}`).value;
  const pico = document.getElementById(`pricePeak_${fieldId}`).value;

  try {
    const res = await fetch(`${API_BASE}/venues/fields/${fieldId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        default_price_per_hour: Number(valle),
        peak_price_per_hour: Number(pico)
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('✅ Tarifas de cancha actualizadas correctamente.', 'success');
      await loadVenues();
    } else {
      if (data.suspended) {
        showSuspendedAlertModal('Esta cancha');
      } else {
        showToast(data.error || 'Error al actualizar precios.', 'error');
      }
    }
  } catch (e) {
    showToast('Error al actualizar precios.', 'error');
  }
}

// Carga Empleados / Cancheros (Tenant Admin)
async function loadStaffList() {
  const container = document.getElementById('staffListTable');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/venues/${state.currentVenueId}/staff`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      container.innerHTML = `
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-2.5 px-3">Nombre</th>
              <th class="py-2.5 px-3">Rol</th>
              <th class="py-2.5 px-3">Correo</th>
              <th class="py-2.5 px-3">Teléfono</th>
              <th class="py-2.5 px-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            ${data.staff.map(u => `
              <tr>
                <td class="py-2.5 px-3 font-bold text-slate-900 dark:text-white">${u.name}</td>
                <td class="py-2.5 px-3"><span class="bg-slate-200 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-lg text-[10px]">${u.role}</span></td>
                <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400">${u.email}</td>
                <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400">${u.phone || 'N/A'}</td>
                <td class="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">Activo</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (e) {
    console.error(e);
  }
}

// ============================================================
// MÓDULO C: POS CAFETERÍA, INVENTARIO & "CARGAR A CANCHA"
// ============================================================

async function loadPosProducts() {
  const grid = document.getElementById('posProductsGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/pos/products`);
    const data = await res.json();
    if (data.success) {
      grid.innerHTML = data.products.map(p => `
        <div onclick="addPosToCart('${p.id}', '${p.name}', ${p.sale_price})"
             class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-500 p-3.5 rounded-3xl cursor-pointer transition-card flex flex-col justify-between h-32 group shadow-sm">
          <div class="flex justify-between items-start">
            <span class="font-bold text-slate-800 dark:text-white text-xs group-hover:text-amber-500 transition leading-tight">${p.name}</span>
          </div>
          <div class="flex justify-between items-end">
            <span class="text-xs font-black text-emerald-600 dark:text-emerald-400 text-sm">$${p.sale_price.toLocaleString('es-CO')}</span>
            <span class="text-[10px] text-slate-400 font-medium">Stock: ${p.stock_quantity}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

function addPosToCart(productId, name, price) {
  const existing = state.posCart.find(i => i.product_id === productId);
  if (existing) {
    existing.quantity++;
    existing.subtotal = existing.quantity * price;
  } else {
    state.posCart.push({ product_id: productId, name, price, quantity: 1, subtotal: price });
  }
  renderPosCart();
  showToast(`+ ${name} agregado al ticket`, 'success');
}

function renderPosCart() {
  const container = document.getElementById('posCartItems');
  const totalEl = document.getElementById('posCartTotal');
  if (!container || !totalEl) return;

  if (state.posCart.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-center py-6">No hay productos agregados</p>`;
    totalEl.innerText = '$0 COP';
    return;
  }

  const total = state.posCart.reduce((sum, item) => sum + item.subtotal, 0);
  totalEl.innerText = `$${total.toLocaleString('es-CO')} COP`;

  container.innerHTML = state.posCart.map(item => `
    <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div>
        <span class="font-bold text-slate-900 dark:text-white block">${item.name}</span>
        <span class="text-slate-400 text-[10px]">$${item.price.toLocaleString('es-CO')} c/u</span>
      </div>
      <div class="flex items-center space-x-2">
        <span class="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-800 dark:text-white font-bold">x${item.quantity}</span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400">$${item.subtotal.toLocaleString('es-CO')}</span>
      </div>
    </div>
  `).join('');
}

function clearPosCart() {
  state.posCart = [];
  renderPosCart();
}

async function checkoutPosOrder(paymentMethod) {
  if (state.posCart.length === 0) {
    showToast('El ticket de cafetería está vacío.', 'warning');
    return;
  }

  const reservationSelect = document.getElementById('posTargetCourtSelect');
  const resId = reservationSelect ? reservationSelect.value : null;

  if (paymentMethod === 'charged_to_field' && !resId) {
    showToast('Debes seleccionar la Cancha / Reserva activa a la que se cargarán los consumos.', 'warning');
    return;
  }

  const payload = {
    items: state.posCart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    payment_method: paymentMethod,
    reservation_id: resId || null
  };

  try {
    const res = await fetch(`${API_BASE}/pos/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      clearPosCart();
      loadPosProducts();
    }
  } catch (e) {
    showToast('Error al procesar orden de cafetería.', 'error');
  }
}

// Cierre de caja
async function submitCloseShift() {
  const input = document.getElementById('shiftActualCashInput');
  const val = input ? input.value : 0;
  if (!val) {
    showToast('Ingresa el monto de efectivo contado en caja física.', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/pos/shift/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ actual_cash: Number(val) })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      alert(`📊 Resumen de Cierre de Caja:\nEsperado: $${data.shift_summary.expected_cash}\nContado: $${data.shift_summary.actual_cash}\nDescuadre: $${data.shift_summary.difference}`);
    }
  } catch (e) {
    console.error(e);
  }
}

// ============================================================
// VISTA CLIENTE: MIS RESERVAS
// ============================================================

async function loadClientReservations() {
  const container = document.getElementById('clientReservationsList');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/reservations?user_id=u0000000-0000-0000-0000-000000000004`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success && data.reservations) {
      container.innerHTML = data.reservations.map(r => `
        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div>
            <span class="text-emerald-600 dark:text-emerald-400 font-black block">${r.field_name}</span>
            <span class="text-slate-900 dark:text-white font-bold">${r.booking_date} | ${r.start_time} - ${r.end_time}</span>
            <span class="text-slate-500 block mt-0.5">Estado: <strong class="text-emerald-600 dark:text-emerald-400 uppercase">${r.status}</strong> • Modo: ${r.payment_mode}</span>
          </div>
          <div class="text-right">
            <span class="text-slate-500 block">Total: $${r.total_amount?.toLocaleString('es-CO')}</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-black">Abonado: $${r.deposit_paid?.toLocaleString('es-CO')}</span>
            <span class="text-amber-600 dark:text-amber-400 block text-[11px] font-bold">Pendiente: $${r.remaining_balance?.toLocaleString('es-CO')}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

// Modales auxiliares
function openNewVenueModal() { document.getElementById('modalNewVenue')?.classList.remove('hidden'); }
function closeNewVenueModal() { document.getElementById('modalNewVenue')?.classList.add('hidden'); }
function openNewStaffModal() { document.getElementById('modalNewStaff')?.classList.remove('hidden'); }
function closeNewStaffModal() { document.getElementById('modalNewStaff')?.classList.add('hidden'); }

async function handleCreateVenue(e) {
  e.preventDefault();
  const name = document.getElementById('newVenueName').value;
  const city = document.getElementById('newVenueCity').value;
  const address = document.getElementById('newVenueAddress').value;
  const phone = document.getElementById('newVenuePhone').value;

  try {
    const res = await fetch(`${API_BASE}/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ name, city, address, phone })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Nueva sede deportiva dada de alta con éxito.', 'success');
      closeNewVenueModal();
      loadSuperadminVenues();
      loadVenues();
    }
  } catch (e) {
    showToast('Error al crear sede.', 'error');
  }
}

async function handleCreateStaff(e) {
  e.preventDefault();
  const name = document.getElementById('newStaffName').value;
  const email = document.getElementById('newStaffEmail').value;
  const password = document.getElementById('newStaffPassword').value;

  try {
    const res = await fetch(`${API_BASE}/venues/${state.currentVenueId}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({ name, email, password, role: 'staff' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Empleado/Canchero creado con éxito.', 'success');
      closeNewStaffModal();
      loadStaffList();
    }
  } catch (e) {
    showToast('Error al crear usuario.', 'error');
  }
}

// ============================================================
// GESTIÓN Y ESTADO SUPABASE CLOUD
// ============================================================

function openSupabaseModal() {
  const modal = document.getElementById('modalSupabase');
  if (modal) modal.classList.remove('hidden');
}

function closeSupabaseModal() {
  const modal = document.getElementById('modalSupabase');
  if (modal) modal.classList.add('hidden');
}

async function checkSupabaseStatus() {
  const badge = document.getElementById('supabaseStatusBadge');
  const text = document.getElementById('supabaseStatusText');
  const desc = document.getElementById('supabaseStatusDesc');

  if (text) text.innerText = 'Consultando...';

  try {
    const res = await fetch(`${API_BASE}/database/status`);
    const json = await res.json();
    if (json.success) {
      const data = json.data;
      if (data.connected && data.provider === 'supabase_cloud') {
        if (badge) badge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1';
        if (text) text.innerText = 'Supabase Cloud Activo 🌲';
        if (desc) desc.innerText = `Conexión en vivo con PostgreSQL (${data.url || 'Cloud'}). Tablas sincronizadas.`;
      } else {
        if (badge) badge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center space-x-1';
        if (text) text.innerText = 'Motor Reactivo Local (Fallback)';
        if (desc) desc.innerText = `${data.message} Listo para enlazar con Supabase Cloud.`;
      }
    }
  } catch (err) {
    if (text) text.innerText = 'Modo Local';
  }
}

async function handleSaveSupabaseConfig(e) {
  e.preventDefault();
  const url = document.getElementById('supabaseFormUrl').value.trim();
  const key = document.getElementById('supabaseFormKey').value.trim();
  const feedback = document.getElementById('supabaseTestFeedback');
  const btn = document.getElementById('btnSaveSupabase');

  if (btn) btn.disabled = true;
  if (feedback) {
    feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-500 block';
    feedback.innerText = 'Conectando y validando con Supabase...';
  }

  try {
    const res = await fetch(`${API_BASE}/database/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseUrl: url, supabaseKey: key })
    });
    const json = await res.json();
    if (json.success) {
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 block';
      feedback.innerText = `✅ ¡Conexión Exitosa! ${json.message}`;
      showToast('🌲 Supabase conectado correctamente', 'success');
      checkSupabaseStatus();
      setTimeout(closeSupabaseModal, 1500);
    } else {
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 block';
      feedback.innerText = `❌ Error: ${json.error || 'Credenciales inválidas'}`;
    }
  } catch (err) {
    feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 block';
    feedback.innerText = `❌ Error de red: ${err.message}`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ============================================================
// MODAL DE BLOQUEO Y ALERTA DE CANCHA / CUENTA SUSPENDIDA
// ============================================================

function showSuspendedAlertModal(targetName = 'Esta cancha') {
  const modal = document.getElementById('modalSuspendedAlert');
  const text = document.getElementById('suspendedModalText');
  if (text) {
    text.innerText = `${targetName} se encuentra actualmente desactivada o suspendida. Toda gestión de horarios, tarifas y reservas está temporalmente bloqueada. Por favor, comunícate con el administrador del sistema para restablecer el servicio.`;
  }
  if (modal) modal.classList.remove('hidden');
  if (window.feather) feather.replace();
}

function closeSuspendedAlertModal() {
  const modal = document.getElementById('modalSuspendedAlert');
  if (modal) modal.classList.add('hidden');
}
