const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Topbar: Add "Iniciar Sesión / Portal Jugador" button
const oldTopbarActions = `        <!-- Acceso directo al Dashboard -->
        <a href="dashboard.html" class="hidden sm:inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition transform hover:-translate-y-0.5">
          <i data-feather="sliders" class="w-3.5 h-3.5"></i>
          <span>Panel de Gestión</span>
        </a>`;

const newTopbarActions = `        <!-- Acceso directo a Portal Jugador / Login -->
        <a href="dashboard.html?role=cliente" class="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5">
          <i data-feather="user" class="w-3.5 h-3.5"></i>
          <span>Portal Jugador</span>
        </a>

        <!-- Acceso al Dashboard de Gestión -->
        <a href="dashboard.html?role=tenant_admin" class="hidden sm:inline-flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition">
          <i data-feather="sliders" class="w-3.5 h-3.5 text-emerald-500"></i>
          <span>Admin Sede</span>
        </a>`;

if (html.includes(oldTopbarActions)) {
  html = html.replace(oldTopbarActions, newTopbarActions);
  console.log('✓ Topbar buttons updated');
}

// 2. Hero: Replace "Simular La Vaca" with "Iniciar Sesión / Portal Jugador"
const oldHeroVacaBtn = `<a href="#la-vaca" class="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold px-6 py-4 rounded-2xl inline-flex items-center space-x-2 transition shadow-sm hover:-translate-y-0.5">
              <i data-feather="share-2" class="w-5 h-5 text-amber-500 dark:text-amber-400"></i>
              <span>Simular La Vaca</span>
            </a>`;

const newHeroVacaBtn = `<a href="dashboard.html?role=cliente" class="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-4 rounded-2xl inline-flex items-center space-x-2 transition shadow-lg shadow-blue-600/25 hover:-translate-y-0.5">
              <i data-feather="user-check" class="w-5 h-5"></i>
              <span>Portal del Jugador & Reservar</span>
            </a>`;

if (html.includes(oldHeroVacaBtn)) {
  html = html.replace(oldHeroVacaBtn, newHeroVacaBtn);
  console.log('✓ Hero CTA updated');
}

// 3. Remove heavy sections: #la-vaca, #cafeteria, #torneos
const cutStart = html.indexOf('<!-- ================= SECCIÓN: "LA VACA DIGITAL" ================= -->');
const cutEnd = html.indexOf('<!-- ================= SECCIÓN: PRUEBA SOCIAL & TESTIMONIOS (CONVERSIÓN HUBSPOT/UNBOUNCE) ================= -->');

if (cutStart !== -1 && cutEnd !== -1) {
  html = html.slice(0, cutStart) + html.slice(cutEnd);
  console.log('✓ Removed heavy operational sections (#la-vaca, #cafeteria, #torneos) from landing');
} else {
  console.warn('⚠️ Could not find exact boundaries for heavy sections');
}

// 4. Update #courtInfoBanner to show consistent Valle, Pico, and Weekend pricing
const oldBannerPrices = `          <div>
            <span class="text-slate-500 dark:text-slate-400 block font-medium">Hora Valle (06:00 - 17:00):</span>
            <span class="text-slate-900 dark:text-white font-black text-base" id="courtPriceValley">$110.000 COP</span>
          </div>
          <div>
            <span class="text-amber-600 dark:text-amber-400 block font-medium">Hora Pico 🔥 (17:00 - 23:00):</span>
            <span class="text-slate-900 dark:text-white font-black text-base" id="courtPricePeak">$130.000 COP</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 block font-medium">Abono Requerido:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-black text-base">50% para retener</span>
          </div>`;

const newBannerPrices = `          <div>
            <span class="text-slate-500 dark:text-slate-400 block font-medium text-[11px]" id="courtPriceValleyLabel">Tarifa Valle (06:00 - 17:00):</span>
            <span class="text-slate-900 dark:text-white font-black text-base" id="courtPriceValley">$110.000 COP</span>
          </div>
          <div>
            <span class="text-amber-600 dark:text-amber-400 block font-medium text-[11px]" id="courtPricePeakLabel">Tarifa Pico 🔥 (17:00 - 23:00):</span>
            <span class="text-slate-900 dark:text-white font-black text-base" id="courtPricePeak">$130.000 COP</span>
          </div>
          <div class="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
            <span class="text-purple-600 dark:text-purple-400 block font-bold text-[10px] uppercase">Fin de Semana:</span>
            <span class="text-slate-900 dark:text-white font-black text-xs" id="courtPriceWeekendDisplay">$130.000 / $160.000 COP</span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400 block font-medium text-[11px]">Abono Requerido:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-black text-base">50% para apartar</span>
          </div>`;

if (html.includes(oldBannerPrices)) {
  html = html.replace(oldBannerPrices, newBannerPrices);
  console.log('✓ Court info banner pricing updated');
}

// 5. Remove old bookingModal and modalCheckoutStep from index.html and replace with modalAuthLogin
const modalCutStart = html.indexOf('<!-- ================= MODAL DE RESERVA CON CRONÓMETRO 10 MIN ================= -->');
const modalCutEnd = html.indexOf('<!-- Modal Alerta de Cancha / Cuenta Suspendida -->');

const authModalHtml = `<!-- ================= MODAL DE AUTENTICACIÓN / REGISTRO PARA RESERVAS ================= -->
  <div id="modalAuthLogin" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 transition">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div class="flex items-center space-x-2">
          <div class="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            <i data-feather="user-check" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-black text-slate-900 dark:text-white text-base">Portal del Jugador</h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">Inicia sesión o crea tu cuenta para reservar turno</p>
          </div>
        </div>
        <button onclick="closeAuthModal()" class="text-slate-400 hover:text-slate-700 dark:hover:text-white"><i data-feather="x" class="w-5 h-5"></i></button>
      </div>

      <!-- Pestañas Iniciar Sesión / Crear Cuenta -->
      <div class="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <button type="button" onclick="switchAuthTab('login')" id="authTabBtn_login" class="flex-1 py-2 rounded-xl font-black bg-blue-600 text-white transition shadow-sm">Iniciar Sesión</button>
        <button type="button" onclick="switchAuthTab('register')" id="authTabBtn_register" class="flex-1 py-2 rounded-xl font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition">Crear Cuenta</button>
      </div>

      <!-- Formulario Login -->
      <form id="authLoginForm" onsubmit="handleAuthLogin(event)" class="space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
          <input type="email" id="authLoginEmail" required placeholder="tu@correo.com" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:outline-none">
        </div>
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
          <input type="password" id="authLoginPassword" required placeholder="••••••••" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:outline-none">
        </div>
        <button type="submit" id="btnSubmitAuth" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl transition shadow-md shadow-blue-500/20">
          Iniciar Sesión y Continuar a mi Portal
        </button>
      </form>

      <!-- Formulario Registro -->
      <form id="authRegisterForm" onsubmit="handleAuthRegister(event)" class="space-y-3 text-xs hidden">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
          <input type="text" id="authRegisterName" required placeholder="Ej. Juan Pérez" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Celular / WhatsApp</label>
            <input type="tel" id="authRegisterPhone" required placeholder="3001234567" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
          </div>
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
            <input type="email" id="authRegisterEmail" required placeholder="juan@correo.com" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
          <input type="password" id="authRegisterPassword" required placeholder="Crea una contraseña segura" class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold">
        </div>
        <button type="submit" id="btnSubmitRegister" class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl transition shadow-md shadow-emerald-500/20">
          Crear Cuenta y Entrar al Portal
        </button>
      </form>

      <!-- Accesos Rápidos Demo -->
      <div id="authDemoShortcuts" class="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
        <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Acceso Rápido Jugador Demo:</span>
        <button type="button" onclick="loginAsDemoUser('cliente')" class="w-full p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black border border-blue-500/20 hover:bg-blue-500/20 flex items-center justify-center space-x-2 text-xs">
          <span>⚽ Entrar como Mateo Jugador (Demo)</span>
        </button>
      </div>
    </div>
  </div>\n\n  `;

if (modalCutStart !== -1 && modalCutEnd !== -1) {
  html = html.slice(0, modalCutStart) + authModalHtml + html.slice(modalCutEnd);
  console.log('✓ Replaced open booking modal with secure auth modal');
} else {
  console.warn('⚠️ Could not find exact boundaries for old booking modal');
}

fs.writeFileSync(indexPath, html, 'utf8');
const frontendIndexPath = path.join(__dirname, '../frontend/index.html');
fs.writeFileSync(frontendIndexPath, html, 'utf8');
console.log('✓ Successfully written public/index.html and frontend/index.html');
