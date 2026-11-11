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
  authToken: localStorage.getItem('canchapro_token') || 'demo-user-b0000000-0000-0000-0000-000000000001'
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
  if (currentGridViewMode === 'multi') {
    loadMultiGridAvailability();
  } else {
    loadGridAvailability();
  }
}

function onDateChanged() {
  const picker = document.getElementById('gridDatePicker');
  if (picker && picker.value) {
    state.selectedDate = picker.value;
    if (currentGridViewMode === 'multi') {
      loadMultiGridAvailability();
    } else {
      loadGridAvailability();
    }
  }
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

function openBookingModal(startTime, endTime, price, fieldId = null) {
  if (fieldId) {
    state.selectedFieldId = fieldId;
  }
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
  let token = 'demo-user-b0000000-0000-0000-0000-000000000001';

  if (email.includes('admin@bernabeu')) {
    role = 'tenant_admin';
    token = 'demo-user-b0000000-0000-0000-0000-000000000002';
  } else if (email.includes('canchero')) {
    role = 'staff';
    token = 'demo-user-b0000000-0000-0000-0000-000000000003';
  } else if (email.includes('mateo')) {
    role = 'cliente';
    token = 'demo-user-b0000000-0000-0000-0000-000000000004';
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
    loadSubscriptions();
    loadOperationalBlocks();
    loadTournamentsDashboard();
    populateModalFieldSelects();
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

    const wkndValle = f.weekend_price_per_hour || 130000;
    const wkndPeak = f.weekend_peak_price_per_hour || 160000;

    return `
      <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-col gap-3 text-xs shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div>
            <h5 class="font-black text-slate-900 dark:text-white text-sm">${f.name}</h5>
            <span class="text-slate-500 text-[11px]">${f.sport_type?.toUpperCase()} • Reglas de precios Colombia</span>
          </div>
          <button onclick="saveFieldPrice('${f.id}')" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md shadow-emerald-500/20">
            Guardar Tarifas
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold text-slate-500 block uppercase">Lun-Vie Valle</span>
            <input type="number" id="priceValle_${f.id}" value="${f.default_price_per_hour}" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 mt-1 text-slate-900 dark:text-white font-black text-xs">
            <span class="text-[9px] text-slate-400 block mt-0.5">06:00 - 17:00</span>
          </div>
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold text-amber-500 block uppercase">Lun-Vie Pico 🔥</span>
            <input type="number" id="pricePeak_${f.id}" value="${f.peak_price_per_hour}" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 mt-1 text-slate-900 dark:text-white font-black text-xs">
            <span class="text-[9px] text-amber-500/70 block mt-0.5">17:00 - 23:00</span>
          </div>
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold text-blue-500 block uppercase">Finde Mañana</span>
            <input type="number" id="priceWeekendValle_${f.id}" value="${wkndValle}" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 mt-1 text-slate-900 dark:text-white font-black text-xs">
            <span class="text-[9px] text-blue-500/70 block mt-0.5">Sáb/Dom 06:00 - 15:00</span>
          </div>
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold text-purple-500 block uppercase">Finde Pico 🔥</span>
            <input type="number" id="priceWeekendPeak_${f.id}" value="${wkndPeak}" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 mt-1 text-slate-900 dark:text-white font-black text-xs">
            <span class="text-[9px] text-purple-500/70 block mt-0.5">Sáb/Dom 15:00 - 23:00</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.feather) feather.replace();
}

async function saveFieldPrice(fieldId) {
  const valle = document.getElementById(`priceValle_${fieldId}`).value;
  const pico = document.getElementById(`pricePeak_${fieldId}`).value;
  const wkndValle = document.getElementById(`priceWeekendValle_${fieldId}`)?.value || 130000;
  const wkndPeak = document.getElementById(`priceWeekendPeak_${fieldId}`)?.value || 160000;

  try {
    const res = await fetch(`${API_BASE}/venues/fields/${fieldId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        default_price_per_hour: Number(valle),
        peak_price_per_hour: Number(pico),
        weekend_price_per_hour: Number(wkndValle),
        weekend_peak_price_per_hour: Number(wkndPeak)
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('✅ Tarifas ordinarias y de fines de semana actualizadas.', 'success');
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
    const res = await fetch(`${API_BASE}/reservations?user_id=b0000000-0000-0000-0000-000000000004`, {
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

// ============================================================
// VISTA CONSOLIDADA MULTI-CANCHA (MATRIZ COLUMNAS CANCHAS X FILAS HORAS)
// ============================================================

let currentGridViewMode = 'single';

function switchGridViewMode(mode) {
  currentGridViewMode = mode;
  const btnSingle = document.getElementById('btnViewSingle');
  const btnMulti = document.getElementById('btnViewMulti');
  const courtTabs = document.getElementById('courtTabsContainer');
  const courtInfo = document.getElementById('courtInfoBanner');
  const slotsGrid = document.getElementById('slotsGrid');
  const multiContainer = document.getElementById('multiCourtGridContainer');

  if (mode === 'multi') {
    if (btnSingle) btnSingle.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1';
    if (btnMulti) btnMulti.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 transition flex items-center space-x-1';
    if (courtTabs) courtTabs.classList.add('hidden');
    if (courtInfo) courtInfo.classList.add('hidden');
    if (slotsGrid) slotsGrid.classList.add('hidden');
    if (multiContainer) multiContainer.classList.remove('hidden');
    loadMultiGridAvailability();
  } else {
    if (btnSingle) btnSingle.className = 'px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-slate-950 transition flex items-center space-x-1';
    if (btnMulti) btnMulti.className = 'px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center space-x-1';
    if (courtTabs) courtTabs.classList.remove('hidden');
    if (courtInfo) courtInfo.classList.remove('hidden');
    if (slotsGrid) slotsGrid.classList.remove('hidden');
    if (multiContainer) multiContainer.classList.add('hidden');
    loadGridAvailability();
  }
}

async function loadMultiGridAvailability() {
  const wrapper = document.getElementById('multiGridTableWrapper');
  const dateLabel = document.getElementById('multiGridDateLabel');
  if (!wrapper) return;

  wrapper.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">Cargando matriz consolidada de canchas...</div>`;

  try {
    const res = await fetch(`${API_BASE}/reservations/multi-grid?date=${state.selectedDate}`);
    const data = await res.json();

    if (!data.success) {
      wrapper.innerHTML = `<div class="p-4 text-center text-xs text-red-500">Error al cargar matriz multi-cancha.</div>`;
      return;
    }

    if (dateLabel) {
      dateLabel.innerHTML = `${data.day_name} ${data.date} ${data.is_weekend ? '<span class="text-amber-500 font-bold ml-1">🔥 Tarifa Fin de Semana</span>' : ''}`;
    }

    const fields = data.fields || [];
    const matrix = data.matrix || [];

    let thead = `
      <thead class="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
        <tr>
          <th class="py-3 px-3 w-28 text-left font-black">Hora</th>
          ${fields.map(f => `
            <th class="py-3 px-3 text-center min-w-[170px]">
              <div class="font-black text-slate-900 dark:text-white text-xs">${f.name}</div>
              <div class="text-[9px] font-normal text-slate-400 capitalize">${f.sport_type?.replace('_', ' ')}</div>
            </th>
          `).join('')}
        </tr>
      </thead>
    `;

    let tbodyRows = matrix.map(row => {
      let cells = fields.map(f => {
        const slot = row.courts[f.id];
        if (!slot) return `<td class="p-2 text-center text-slate-400 text-[10px]">-</td>`;

        if (slot.status === 'suspended') {
          return `
            <td class="p-2 text-center">
              <div class="bg-red-500/10 border border-red-500/30 text-red-500 p-2 rounded-2xl text-[10px] font-bold">
                ⛔ Suspendida
              </div>
            </td>
          `;
        } else if (slot.status === 'operational_block') {
          return `
            <td class="p-2 text-center">
              <div class="bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 p-2 rounded-2xl text-[10px]">
                <span class="font-black block">🌧️ Bloqueo</span>
                <span class="text-[9px] opacity-80 truncate block">${slot.block_reason || 'Lluvia / Manto'}</span>
              </div>
            </td>
          `;
        } else if (slot.status === 'subscription_recurring') {
          return `
            <td class="p-2 text-center">
              <div class="bg-purple-500/15 border border-purple-500/40 text-purple-700 dark:text-purple-300 p-2 rounded-2xl text-[10px]">
                <span class="font-black block">[F] Fijo Semanal</span>
                <span class="text-[9px] opacity-80 truncate block">${slot.client_name || 'Abonado'}</span>
              </div>
            </td>
          `;
        } else if (slot.status === 'tournament_match') {
          return `
            <td class="p-2 text-center">
              <div class="bg-blue-500/15 border border-blue-500/40 text-blue-700 dark:text-blue-300 p-2 rounded-2xl text-[10px]">
                <span class="font-black block">🏆 Torneo</span>
                <span class="text-[9px] opacity-80 truncate block">${slot.client_name?.replace('[🏆 TORNEO] ', '') || 'Partido'}</span>
              </div>
            </td>
          `;
        } else if (slot.status === 'held') {
          return `
            <td class="p-2 text-center">
              <div class="bg-amber-500/20 border border-amber-500 text-amber-800 dark:text-amber-300 p-2 rounded-2xl text-[10px] animate-pulse">
                <span class="font-black block">⏳ Retenida</span>
                <span class="text-[9px]">10 min abono</span>
              </div>
            </td>
          `;
        } else if (slot.status === 'confirmed') {
          return `
            <td class="p-2 text-center">
              <div class="bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-2xl text-[10px]">
                <span class="font-black block">⚽ Reservado</span>
                <span class="text-[9px] opacity-80 truncate block">${slot.client_name || 'Confirmado'}</span>
              </div>
            </td>
          `;
        } else {
          // Available
          const peakBadge = row.is_peak ? '<span class="text-[9px] text-amber-500 ml-0.5">🔥</span>' : '';
          return `
            <td class="p-2 text-center">
              <button onclick="openBookingModal('${row.start_time}', '${row.end_time}', ${slot.price}, '${f.id}')"
                class="w-full bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-400 hover:text-slate-950 border border-emerald-500/30 p-2 rounded-2xl text-[10px] font-black transition group flex flex-col items-center">
                <span class="text-xs">$${(slot.price / 1000).toFixed(0)}k${peakBadge}</span>
                <span class="text-[9px] uppercase tracking-wider font-semibold opacity-90 group-hover:text-slate-950">Reservar</span>
              </button>
            </td>
          `;
        }
      }).join('');

      return `
        <tr class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition">
          <td class="py-2.5 px-3 font-mono font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center space-x-1">
            <span>${row.start_time} - ${row.end_time}</span>
            ${row.is_peak ? '<span class="text-amber-500 text-xs" title="Hora Pico">🔥</span>' : ''}
          </td>
          ${cells}
        </tr>
      `;
    }).join('');

    wrapper.innerHTML = `
      <table class="w-full text-left text-xs border-collapse">
        ${thead}
        <tbody>${tbodyRows}</tbody>
      </table>
    `;

    if (window.feather) feather.replace();
  } catch (err) {
    console.error('Error cargando multi-grid:', err);
    wrapper.innerHTML = `<div class="p-4 text-center text-xs text-red-500">Error de conexión al cargar la parrilla multi-cancha.</div>`;
  }
}

// ============================================================
// GESTIÓN DE SUSCRIPCIONES SEMANALES FIJAS (RECURRENTES)
// ============================================================

function openNewSubscriptionModal() {
  populateModalFieldSelects();
  const modal = document.getElementById('modalNewSubscription');
  if (modal) modal.classList.remove('hidden');
}

function closeNewSubscriptionModal() {
  const modal = document.getElementById('modalNewSubscription');
  if (modal) modal.classList.add('hidden');
}

async function loadSubscriptions() {
  const container = document.getElementById('subscriptionsListContainer');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/reservations/recurring`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      if (!data.subscriptions || data.subscriptions.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs text-center py-4">No hay suscripciones fijas semanales activas.</p>`;
        return;
      }

      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

      container.innerHTML = `
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-2.5 px-3">Cliente / Grupo</th>
              <th class="py-2.5 px-3">Cancha</th>
              <th class="py-2.5 px-3">Turno Fijo</th>
              <th class="py-2.5 px-3">Plazo</th>
              <th class="py-2.5 px-3">Tarifa x Partido</th>
              <th class="py-2.5 px-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            ${data.subscriptions.map(s => {
              const f = state.fields.find(field => field.id === s.field_id);
              const dayStr = dayNames[s.day_of_week] || 'Día fijo';
              return `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                  <td class="py-2.5 px-3">
                    <span class="font-bold text-slate-900 dark:text-white block">${s.client_name}</span>
                    <span class="text-[10px] text-slate-400">${s.client_phone}</span>
                  </td>
                  <td class="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">${f ? f.name : 'Cancha'}</td>
                  <td class="py-2.5 px-3">
                    <span class="bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      ${dayStr}s • ${s.start_time} (${s.duration_hours || 1}h)
                    </span>
                  </td>
                  <td class="py-2.5 px-3 font-medium">${s.total_weeks} Semanas (${s.weeks_remaining} restantes)</td>
                  <td class="py-2.5 px-3 font-black text-slate-900 dark:text-white">$${Number(s.price_per_match).toLocaleString('es-CO')}</td>
                  <td class="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px]">
                    <span class="bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">Fijo Activo</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (err) {
    console.error('Error cargando suscripciones:', err);
  }
}

async function handleCreateSubscription(e) {
  e.preventDefault();
  const fieldId = document.getElementById('subFieldSelect').value;
  const clientName = document.getElementById('subClientName').value;
  const clientPhone = document.getElementById('subClientPhone').value;
  const dayOfWeek = Number(document.getElementById('subDayOfWeek').value);
  const startTime = document.getElementById('subStartTime').value;
  const durationHours = Number(document.getElementById('subDuration').value);
  const totalWeeks = Number(document.getElementById('subTotalWeeks').value);
  const pricePerMatch = Number(document.getElementById('subPricePerMatch').value);
  const depositPaid = Number(document.getElementById('subDepositPaid').value);

  try {
    const res = await fetch(`${API_BASE}/reservations/recurring`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        venue_id: state.currentVenueId,
        field_id: fieldId,
        client_name: clientName,
        client_phone: clientPhone,
        day_of_week: dayOfWeek,
        start_time: startTime,
        duration_hours: durationHours,
        total_weeks: totalWeeks,
        price_per_match: pricePerMatch,
        deposit_paid: depositPaid
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`🎉 ¡Suscripción fija creada! Se bloquearon ${data.locked_slots_count} fechas en la parrilla.`, 'success');
      closeNewSubscriptionModal();
      loadSubscriptions();
      loadGridAvailability();
      if (currentGridViewMode === 'multi') loadMultiGridAvailability();
    } else {
      showToast(data.error || 'Error al crear suscripción fija.', 'error');
    }
  } catch (err) {
    showToast('Error de red al registrar suscripción.', 'error');
  }
}

// ============================================================
// BLOQUEOS OPERATIVOS & PROTOCOLO POR LLUVIA (BONOS)
// ============================================================

function openOperationalBlockModal() {
  populateModalFieldSelects();
  const modal = document.getElementById('modalOperationalBlock');
  const dateInput = document.getElementById('blockDate');
  if (dateInput) dateInput.value = state.selectedDate;
  if (modal) modal.classList.remove('hidden');
}

function closeOperationalBlockModal() {
  const modal = document.getElementById('modalOperationalBlock');
  if (modal) modal.classList.add('hidden');
}

async function loadOperationalBlocks() {
  const blocksList = document.getElementById('operationalBlocksList');
  const vouchersList = document.getElementById('reprogrammingVouchersList');

  try {
    // 1. Cargar Bloqueos
    const resBlocks = await fetch(`${API_BASE}/reservations/operational-blocks`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const dataBlocks = await resBlocks.json();
    if (blocksList && dataBlocks.success) {
      if (!dataBlocks.blocks || dataBlocks.blocks.length === 0) {
        blocksList.innerHTML = `<p class="text-slate-400 text-xs py-3 text-center">No hay bloqueos operativos activos.</p>`;
      } else {
        blocksList.innerHTML = dataBlocks.blocks.map(b => {
          const f = state.fields.find(field => field.id === b.field_id);
          return `
            <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">${b.reason}</span>
                <h6 class="font-black text-slate-900 dark:text-white text-xs mt-1">${f ? f.name : 'Cancha'}</h6>
                <p class="text-[10px] text-slate-500">${b.block_date} | ${b.start_time} - ${b.end_time}</p>
              </div>
              <button onclick="cancelOperationalBlock('${b.id}')" class="text-xs text-red-500 hover:text-red-600 font-bold p-1">Liberar</button>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Cargar Bonos de Reprogramación
    const resVouchers = await fetch(`${API_BASE}/reservations/vouchers`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const dataVouchers = await resVouchers.json();
    if (vouchersList && dataVouchers.success) {
      if (!dataVouchers.vouchers || dataVouchers.vouchers.length === 0) {
        vouchersList.innerHTML = `<p class="text-slate-400 text-xs py-3 text-center">No se han emitido bonos de reprogramación por lluvia.</p>`;
      } else {
        vouchersList.innerHTML = dataVouchers.vouchers.map(v => `
          <div class="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <span class="font-mono font-black text-amber-700 dark:text-amber-400 text-xs block">${v.code}</span>
              <span class="text-[11px] font-bold text-slate-800 dark:text-slate-200">${v.client_name}</span>
              <p class="text-[10px] text-slate-500">${v.reason} • Expira: ${v.expires_at?.split('T')[0]}</p>
            </div>
            <div class="text-right">
              <span class="font-black text-slate-900 dark:text-white text-xs block">$${Number(v.amount_credit).toLocaleString('es-CO')}</span>
              <span class="text-[9px] font-bold uppercase ${v.status === 'redeemed' ? 'text-slate-400' : 'text-emerald-500'}">
                ${v.status === 'redeemed' ? 'Canjeado' : 'Disponible'}
              </span>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error cargando bloqueos u vouchers:', err);
  }
}

async function handleCreateOperationalBlock(e) {
  e.preventDefault();
  const fieldId = document.getElementById('blockFieldSelect').value;
  const blockDate = document.getElementById('blockDate').value;
  const startTime = document.getElementById('blockStartTime').value;
  const endTime = document.getElementById('blockEndTime').value;
  const reason = document.getElementById('blockReason').value;
  const emitVoucher = document.getElementById('blockEmitVoucher').checked;
  const notes = document.getElementById('blockNotes').value;

  try {
    const res = await fetch(`${API_BASE}/reservations/operational-blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        venue_id: state.currentVenueId,
        field_id: fieldId,
        block_date: blockDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason,
        emit_voucher: emitVoucher,
        notes: notes
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (data.cancelled_reservations && data.cancelled_reservations.length > 0) {
        showToast(`🌧️ Bloqueo aplicado. Se cancelaron ${data.cancelled_reservations.length} reservas y se emitieron bonos de reprogramación digitales.`, 'success');
      } else {
        showToast('✅ Bloqueo operativo registrado en la parrilla.', 'success');
      }
      closeOperationalBlockModal();
      loadOperationalBlocks();
      loadGridAvailability();
      if (currentGridViewMode === 'multi') loadMultiGridAvailability();
    } else {
      showToast(data.error || 'Error al aplicar bloqueo operativo.', 'error');
    }
  } catch (err) {
    showToast('Error de conexión al aplicar bloqueo.', 'error');
  }
}

async function cancelOperationalBlock(blockId) {
  try {
    const res = await fetch(`${API_BASE}/reservations/operational-blocks/${blockId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Bloqueo operativo liberado. La franja vuelve a estar disponible.', 'success');
      loadOperationalBlocks();
      loadGridAvailability();
      if (currentGridViewMode === 'multi') loadMultiGridAvailability();
    }
  } catch (err) {
    showToast('Error al cancelar bloqueo.', 'error');
  }
}

// ============================================================
// GESTIÓN DE TORNEOS VINCULADOS A LA PARRILLA
// ============================================================

function openScheduleTournamentMatchModal() {
  populateModalFieldSelects();
  const modal = document.getElementById('modalScheduleMatch');
  const dateInput = document.getElementById('matchDate');
  if (dateInput) dateInput.value = state.selectedDate;
  if (modal) modal.classList.remove('hidden');
}

function closeScheduleTournamentMatchModal() {
  const modal = document.getElementById('modalScheduleMatch');
  if (modal) modal.classList.add('hidden');
}

function openRegisterTeamModal() {
  const modal = document.getElementById('modalRegisterTeam');
  if (modal) modal.classList.remove('hidden');
}

function closeRegisterTeamModal() {
  const modal = document.getElementById('modalRegisterTeam');
  if (modal) modal.classList.add('hidden');
}

async function loadTournamentsDashboard() {
  const standingsEl = document.getElementById('tournamentStandingsTable');
  const matchesEl = document.getElementById('tournamentMatchesList');

  try {
    const resTournaments = await fetch(`${API_BASE}/tournaments`);
    const dataTournaments = await resTournaments.json();

    if (!dataTournaments.success || !dataTournaments.tournaments || dataTournaments.tournaments.length === 0) return;

    const tournament = dataTournaments.tournaments[0];

    // Cargar tabla de posiciones
    const resStandings = await fetch(`${API_BASE}/tournaments/${tournament.id}/standings`);
    const dataStandings = await resStandings.json();

    if (standingsEl && dataStandings.success) {
      standingsEl.innerHTML = `
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-100 dark:bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th class="py-2 px-3">#</th>
              <th class="py-2 px-3">Equipo</th>
              <th class="py-2 px-2 text-center">PJ</th>
              <th class="py-2 px-2 text-center">G</th>
              <th class="py-2 px-2 text-center">E</th>
              <th class="py-2 px-2 text-center">P</th>
              <th class="py-2 px-2 text-center">DG</th>
              <th class="py-2 px-3 text-right font-black">PTS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
            ${dataStandings.standings.map((t, idx) => `
              <tr class="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition">
                <td class="py-2 px-3 font-bold ${idx < 2 ? 'text-emerald-500' : 'text-slate-400'}">${idx + 1}</td>
                <td class="py-2 px-3 font-black text-slate-900 dark:text-white">${t.team_name}</td>
                <td class="py-2 px-2 text-center text-slate-500">${t.played}</td>
                <td class="py-2 px-2 text-center">${t.won}</td>
                <td class="py-2 px-2 text-center">${t.drawn}</td>
                <td class="py-2 px-2 text-center">${t.lost}</td>
                <td class="py-2 px-2 text-center font-mono">${t.goals_for - t.goals_against}</td>
                <td class="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">${t.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // Cargar Partidos Programados
    const resMatches = await fetch(`${API_BASE}/tournaments/${tournament.id}/matches`);
    const dataMatches = await resMatches.json();

    if (matchesEl && dataMatches.success) {
      if (!dataMatches.matches || dataMatches.matches.length === 0) {
        matchesEl.innerHTML = `<p class="text-slate-400 text-xs py-4 text-center">No hay partidos de torneo agendados.</p>`;
      } else {
        matchesEl.innerHTML = dataMatches.matches.map(m => {
          const f = state.fields.find(field => field.id === m.field_id);
          const isPlayed = m.status === 'completed';
          return `
            <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl space-y-1">
              <div class="flex justify-between items-center text-[10px]">
                <span class="text-blue-600 dark:text-blue-400 font-bold">${f ? f.name : 'Cancha'} • ${m.match_date} ${m.start_time}</span>
                <span class="font-bold px-2 py-0.5 rounded-full ${isPlayed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}">
                  ${isPlayed ? `Final: ${m.home_score} - ${m.away_score}` : 'Agendado en Parrilla'}
                </span>
              </div>
              <div class="flex items-center justify-between font-black text-xs text-slate-900 dark:text-white pt-1">
                <span>${m.home_team_name}</span>
                <span class="text-slate-400 text-[10px]">VS</span>
                <span>${m.away_team_name}</span>
              </div>
              <div class="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                <span>Arbitraje: $${Number(m.referee_fee || 50000).toLocaleString('es-CO')}</span>
                <span>Sanciones: 🟨 ${m.yellow_cards || 0} 🟥 ${m.red_cards || 0}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Error cargando torneo:', err);
  }
}

async function handleScheduleMatch(e) {
  e.preventDefault();
  const tournamentId = document.getElementById('matchTournamentSelect').value;
  const homeTeam = document.getElementById('matchHomeTeam').value;
  const awayTeam = document.getElementById('matchAwayTeam').value;
  const fieldId = document.getElementById('matchFieldSelect').value;
  const matchDate = document.getElementById('matchDate').value;
  const startTime = document.getElementById('matchStartTime').value;
  const endTime = document.getElementById('matchEndTime').value;
  const refereeFee = Number(document.getElementById('matchRefereeFee').value);

  try {
    const res = await fetch(`${API_BASE}/tournaments/schedule-match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        tournament_id: tournamentId,
        field_id: fieldId,
        home_team: homeTeam,
        away_team: awayTeam,
        match_date: matchDate,
        start_time: startTime,
        end_time: endTime,
        referee_fee: refereeFee
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('🏆 Partido de torneo agendado y bloqueado en la parrilla horaria con éxito.', 'success');
      closeScheduleTournamentMatchModal();
      loadTournamentsDashboard();
      loadGridAvailability();
      if (currentGridViewMode === 'multi') loadMultiGridAvailability();
    } else {
      showToast(data.error || 'Error al programar partido.', 'error');
    }
  } catch (err) {
    showToast('Error al conectar con el servidor.', 'error');
  }
}

async function handleRegisterTeam(e) {
  e.preventDefault();
  const name = document.getElementById('regTeamName').value;
  const captain = document.getElementById('regTeamCaptain').value;
  const phone = document.getElementById('regTeamPhone').value;
  const fee = Number(document.getElementById('regTeamFee').value);

  try {
    const res = await fetch(`${API_BASE}/tournaments/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        tournament_id: 'd0000000-0000-0000-0000-000000000001',
        name,
        captain_name: captain,
        captain_phone: phone,
        registration_fee_paid: fee
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`⚽ ¡Equipo ${name} inscrito exitosamente!`, 'success');
      closeRegisterTeamModal();
      loadTournamentsDashboard();
    } else {
      showToast(data.error || 'Error al registrar equipo.', 'error');
    }
  } catch (err) {
    showToast('Error de red al inscribir equipo.', 'error');
  }
}

// ============================================================
// CHECKOUT UNIFICADO (CANCHERO / POS CAFETERÍA + 50% SALDO)
// ============================================================

let currentUnifiedTotals = { courtPending: 65000, barPending: 20000, grandTotal: 85000 };

async function loadActiveReservationsForStaff() {
  const courtSelect = document.getElementById('posTargetCourtSelect');
  const checkoutSelect = document.getElementById('checkoutReservationSelect');

  try {
    const res = await fetch(`${API_BASE}/reservations?date=${state.selectedDate}&venue_id=${state.currentVenueId}`, {
      headers: { 'Authorization': `Bearer ${state.authToken}` }
    });
    const data = await res.json();
    if (data.success && data.reservations) {
      const activeList = data.reservations.filter(r => r.status === 'confirmed' || r.status === 'in_progress');
      
      const options = activeList.length > 0
        ? activeList.map(r => {
            const f = state.fields.find(field => field.id === r.field_id);
            const balance = Number(r.remaining_balance || (r.total_amount - (r.deposit_paid || 0)));
            return `<option value="${r.id}" data-pending="${balance}">${f ? f.name : 'Cancha'} — ${r.client_name} (${r.start_time}) | Saldo: $${balance.toLocaleString('es-CO')}</option>`;
          }).join('')
        : `<option value="res-demo-001" data-pending="65000">Cancha 1: La Bernabéu — Mateo Jugador (19:00 - 20:00) | Saldo $65.000</option>`;

      if (courtSelect) {
        courtSelect.innerHTML = `<option value="">Seleccionar Cancha / Reserva Activa...</option>` + options;
      }
      if (checkoutSelect) {
        checkoutSelect.innerHTML = options;
      }
    }
  } catch (err) {
    console.error('Error cargando reservas para staff:', err);
  }
}

function openUnifiedCheckoutModal(resId = null) {
  loadActiveReservationsForStaff();
  const modal = document.getElementById('modalUnifiedCheckout');
  if (modal) modal.classList.remove('hidden');
  if (resId) {
    const sel = document.getElementById('checkoutReservationSelect');
    if (sel) sel.value = resId;
  }
  onCheckoutReservationSelected();
  if (window.feather) feather.replace();
}

function closeUnifiedCheckoutModal() {
  const modal = document.getElementById('modalUnifiedCheckout');
  if (modal) modal.classList.add('hidden');
}

function onCheckoutReservationSelected() {
  const sel = document.getElementById('checkoutReservationSelect');
  const selectedOpt = sel?.options[sel.selectedIndex];
  const pendingCourt = selectedOpt ? Number(selectedOpt.dataset.pending || 65000) : 65000;

  // Consumo actual en el carrito POS si hay algo abierto
  const posCartTotal = state.posCart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const barPending = posCartTotal > 0 ? posCartTotal : 20000; // Demo fallback $20.000 si cart vacío

  const grandTotal = pendingCourt + barPending;
  currentUnifiedTotals = { courtPending: pendingCourt, barPending, grandTotal };

  const courtLabel = document.getElementById('checkoutCourtPendingLabel');
  const barLabel = document.getElementById('checkoutBarPendingLabel');
  const totalLabel = document.getElementById('checkoutGrandTotalLabel');

  if (courtLabel) courtLabel.innerText = `$${pendingCourt.toLocaleString('es-CO')}`;
  if (barLabel) barLabel.innerText = `$${barPending.toLocaleString('es-CO')}`;
  if (totalLabel) totalLabel.innerText = `$${grandTotal.toLocaleString('es-CO')}`;

  // Sugerir división 50/50 o monto total en efectivo por defecto
  const cashInput = document.getElementById('checkoutCashAmount');
  const elecInput = document.getElementById('checkoutElectronicAmount');
  if (cashInput && elecInput) {
    const half = Math.round(grandTotal / 2);
    cashInput.value = half;
    elecInput.value = grandTotal - half;
  }
  recalcUnifiedPayment();
}

function recalcUnifiedPayment() {
  const cash = Number(document.getElementById('checkoutCashAmount')?.value || 0);
  const electronic = Number(document.getElementById('checkoutElectronicAmount')?.value || 0);
  const totalPaid = cash + electronic;
  const target = currentUnifiedTotals.grandTotal;

  const badge = document.getElementById('checkoutPaymentMatchBadge');
  const btn = document.getElementById('btnSubmitUnifiedCheckout');

  if (totalPaid === target) {
    if (badge) {
      badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      badge.innerText = `✓ Cuadre Exacto ($${totalPaid.toLocaleString('es-CO')})`;
    }
    if (btn) btn.disabled = false;
  } else if (totalPaid > target) {
    const change = totalPaid - target;
    if (badge) {
      badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400';
      badge.innerText = `Cambio / Vueltas: $${change.toLocaleString('es-CO')}`;
    }
    if (btn) btn.disabled = false;
  } else {
    const diff = target - totalPaid;
    if (badge) {
      badge.className = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-500';
      badge.innerText = `Faltan: $${diff.toLocaleString('es-CO')}`;
    }
    if (btn) btn.disabled = false;
  }
}

async function handleUnifiedCheckoutSubmit(e) {
  e.preventDefault();
  const checkEquipment = document.getElementById('checkEquipmentReturned')?.checked;
  if (!checkEquipment) {
    showToast('⚠️ Obligatorio: Debes verificar la devolución física de petos y balones antes de cerrar la cuenta.', 'warning');
    return;
  }

  const reservationId = document.getElementById('checkoutReservationSelect')?.value || 'res-demo-001';
  const cashAmount = Number(document.getElementById('checkoutCashAmount')?.value || 0);
  const electronicAmount = Number(document.getElementById('checkoutElectronicAmount')?.value || 0);

  // Formar items si los hay en carrito
  const items = state.posCart.map(it => ({ product_id: it.id, quantity: it.quantity }));

  try {
    const res = await fetch(`${API_BASE}/pos/checkout-unified`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.authToken}`
      },
      body: JSON.stringify({
        reservation_id: reservationId,
        items: items,
        equipment_returned: true,
        cash_amount: cashAmount,
        electronic_amount: electronicAmount,
        electronic_method: 'Nequi / Daviplata'
      })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast('🎉 ¡Liquidación unificada exitosa! Saldo cancelado, implementos recibidos y caja cuadrada.', 'success');
      clearPosCart();
      closeUnifiedCheckoutModal();
      loadActiveReservationsForStaff();
      loadPosProducts();
    } else {
      showToast(data.error || 'Error al liquidar turno.', 'error');
    }
  } catch (err) {
    showToast('Error de comunicación con el servidor.', 'error');
  }
}

// Helper: llenar selects de canchas en modales
function populateModalFieldSelects() {
  const fields = state.fields && state.fields.length > 0 ? state.fields : [];
  const options = fields.map(f => `<option value="${f.id}">${f.name} (${f.sport_type?.toUpperCase()})</option>`).join('');

  const subSelect = document.getElementById('subFieldSelect');
  const blockSelect = document.getElementById('blockFieldSelect');
  const matchSelect = document.getElementById('matchFieldSelect');

  if (subSelect && subSelect.options.length === 0) subSelect.innerHTML = options;
  if (blockSelect && blockSelect.options.length === 0) blockSelect.innerHTML = options;
  if (matchSelect && matchSelect.options.length === 0) matchSelect.innerHTML = options;
}
