const fs = require('fs');
const path = require('path');

const landingHtml = `<!DOCTYPE html>
<html lang="es" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CanchaPro SaaS — El Sistema Operativo para Complejos Deportivos</title>
  <meta name="description" content="Software de gestión integral para canchas sintéticas en Colombia: reservas online, La Vaca Digital, POS cafetería y folio unificado sin comisiones por partido.">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              bg: '#0B0F19',
              green: '#10B981',
              'green-dark': '#059669',
              slate: '#1E293B',
              slateLight: '#334155',
              amber: '#F59E0B',
              blue: '#3B82F6'
            }
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="css/custom.css">
  <!-- Feather Icons -->
  <script src="https://unpkg.com/feather-icons"></script>
</head>
<body class="bg-slate-50 dark:bg-[#0B0F19] min-h-screen text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 font-sans transition-colors duration-300">

  <!-- ================= TOPBAR B2B EJECUTIVA ================= -->
  <header class="sticky top-0 z-40 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
      
      <!-- Logo EscuTech / CanchaPro -->
      <a href="/" class="flex items-center space-x-3 group">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition transform">
          <i data-feather="activity" class="text-white w-5 h-5"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xl font-black tracking-tight text-slate-900 dark:text-white">CANCHA<span class="text-emerald-500 dark:text-emerald-400">PRO</span></span>
            <span class="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">SaaS B2B</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400">Torre de Control para Complejos Deportivos</p>
        </div>
      </a>

      <!-- Menú de Navegación B2B -->
      <nav class="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-600 dark:text-slate-300">
        <a href="#solucion" class="hover:text-emerald-500 dark:hover:text-emerald-400 transition">Solución</a>
        <a href="#caracteristicas" class="hover:text-emerald-500 dark:hover:text-emerald-400 transition">Características</a>
        <a href="#planes" class="hover:text-emerald-500 dark:hover:text-emerald-400 transition">Planes SaaS</a>
        <a href="#testimonios" class="hover:text-emerald-500 dark:hover:text-emerald-400 transition">Casos de Éxito</a>
        <a href="#faq" class="hover:text-emerald-500 dark:hover:text-emerald-400 transition">Preguntas</a>
      </nav>

      <!-- Botones de Acción -->
      <div class="flex items-center space-x-2.5">
        <!-- Conmutador Claro / Oscuro -->
        <button onclick="toggleTheme()" id="themeToggleBtn" title="Cambiar tema Claro / Oscuro" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-amber-400 hover:scale-105 transition">
          <i data-feather="sun" id="themeIconSun" class="w-4 h-4 hidden dark:block"></i>
          <i data-feather="moon" id="themeIconMoon" class="w-4 h-4 block dark:hidden"></i>
        </button>

        <!-- Ver Demo en Vivo (Sede La Bernabéu) -->
        <a href="/sede/la-bernabeu" class="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5">
          <span>🏟️</span>
          <span class="hidden sm:inline">Demo Sede:</span>
          <span>La Bernabéu</span>
        </a>

        <!-- Acceso SuperAdmin -->
        <a href="/superadmin" class="inline-flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition transform hover:-translate-y-0.5">
          <span>👑</span>
          <span>SuperAdmin</span>
        </a>
      </div>

    </div>
  </header>

  <!-- ================= HERO B2B EJECUTIVO ================= -->
  <section class="relative pt-12 pb-16 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto space-y-6">
        
        <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm">
          <span>⚡ Software de Gestión Multi-Sede para Colombia</span>
          <span>•</span>
          <span class="text-amber-500 dark:text-amber-400">0% Comisiones por Partido</span>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          El Sistema Operativo para <br class="hidden sm:inline" />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500">Canchas Sintéticas y Complejos Deportivos</span>
        </h1>

        <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
          Automatiza la operación completa de tu complejo deportivo: reservas online en vivo con abonos del 50%, La Vaca Digital para jugadores, POS de cafetería integrado y liquidación unificada en un solo folio.
        </p>

        <!-- Botones Principales -->
        <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a href="/sede/la-bernabeu" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/25 inline-flex items-center space-x-2 transition transform hover:-translate-y-0.5 text-xs sm:text-sm">
            <span>🏟️ Explorar Portal Sede (La Bernabéu)</span>
          </a>
          <a href="/superadmin" class="bg-purple-600 hover:bg-purple-500 text-white font-black px-7 py-3.5 rounded-2xl shadow-xl shadow-purple-600/25 inline-flex items-center space-x-2 transition transform hover:-translate-y-0.5 text-xs sm:text-sm">
            <span>👑 Torre de Control SuperAdmin</span>
          </a>
          <a href="https://wa.me/573006799595?text=Hola,%20deseo%20conectar%20mi%20cancha%20sintética%20a%20CanchaPro%20SaaS" target="_blank" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-6 py-3.5 rounded-2xl inline-flex items-center space-x-2 transition text-xs sm:text-sm">
            <span>💬 Hablar con Asesor B2B</span>
          </a>
        </div>

        <!-- Social Proof y Métricas Clave -->
        <div class="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm">
            <p class="text-[10px] text-slate-500 uppercase font-black tracking-wider">Cero No-Shows</p>
            <p class="text-2xl font-black text-emerald-500 mt-1">100%</p>
            <p class="text-[11px] text-slate-400">Abono 50% con comprobante</p>
          </div>
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm">
            <p class="text-[10px] text-slate-500 uppercase font-black tracking-wider">Comisión x Partido</p>
            <p class="text-2xl font-black text-teal-400 mt-1">$0 COP</p>
            <p class="text-[11px] text-slate-400">Suscripción mensual fija</p>
          </div>
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm">
            <p class="text-[10px] text-slate-500 uppercase font-black tracking-wider">Folio Unificado</p>
            <p class="text-2xl font-black text-amber-500 mt-1">Cancha + Bar</p>
            <p class="text-[11px] text-slate-400">Cero fugas de cafetería</p>
          </div>
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl text-center shadow-sm">
            <p class="text-[10px] text-slate-500 uppercase font-black tracking-wider">Multi-Deporte</p>
            <p class="text-2xl font-black text-blue-500 mt-1">F5, F7, Pádel</p>
            <p class="text-[11px] text-slate-400">Tarifas Valle, Pico y Finde</p>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- ================= SECCIÓN PROBLEMA VS SOLUCIÓN B2B ================= -->
  <section id="solucion" class="py-16 bg-slate-100/80 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800/80 transition">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
          La Transformación Operativa
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
          ¿Por qué los dueños de canchas migran a CanchaPro?
        </h2>
        <p class="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Compara el desgaste de operar con cuadernos y WhatsApp frente al control automatizado de CanchaPro.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        <!-- Dolor Tradicional -->
        <div class="bg-white dark:bg-slate-900/90 border-2 border-red-500/20 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-black">✕</div>
            <div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Operación Manual Tradicional</h3>
              <p class="text-xs text-red-500 font-semibold">Cruces de turnos, desorden y dinero perdido</p>
            </div>
          </div>

          <ul class="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <li class="flex items-start space-x-2.5">
              <span class="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Cruces y dobles reservas:</strong> El canchero anota en un cuaderno y el administrador promete la misma cancha por WhatsApp.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>No-shows sin consecuencias:</strong> Equipos que apartan turno de palabra a las 8:00 PM y no llegan, dejando la cancha vacía en horario estelar.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Fuga de dinero en el bar:</strong> Se anotan cervezas e hidratantes en papelitos que se pierden o nunca se cobran al terminar el partido.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-red-500 font-bold shrink-0">✕</span>
              <span><strong>Cierres de caja descuadrados:</strong> Imposible conciliar cuánto entró en efectivo frente a transferencias Nequi/Daviplata.</span>
            </li>
          </ul>
        </div>

        <!-- Solución CanchaPro -->
        <div class="bg-gradient-to-br from-emerald-500/5 via-white to-teal-500/5 dark:from-emerald-950/20 dark:via-slate-900 dark:to-teal-950/20 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">✓</div>
            <div>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Control Total con CanchaPro SaaS</h3>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Automatización 24/7 y cuentas claras</p>
            </div>
          </div>

          <ul class="space-y-3 text-xs text-slate-700 dark:text-slate-200">
            <li class="flex items-start space-x-2.5">
              <span class="text-emerald-500 font-black shrink-0">✓</span>
              <span><strong>Portal Propio Aislado (/sede/[slug]):</strong> Cada sede tiene su dirección web con sus logos, reglas de guayos y cuentas bancarias directas.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-emerald-500 font-black shrink-0">✓</span>
              <span><strong>Abonos del 50% con Bloqueo de 10 min:</strong> Nadie aparta cancha sin pagar el anticipo. Si no abonan en 10 minutos, el turno se libera solo.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-emerald-500 font-black shrink-0">✓</span>
              <span><strong>Folio Unificado Cancha + Bar:</strong> Consumos de bebidas cargados a la reserva. Liquidación en 1 clic compartida entre Canchero y Admin.</span>
            </li>
            <li class="flex items-start space-x-2.5">
              <span class="text-emerald-500 font-black shrink-0">✓</span>
              <span><strong>Arqueo de Turno Inteligente:</strong> Cierre de caja automático separando efectivo en caja física vs pagos electrónicos (Nequi/PSE).</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  </section>

  <!-- ================= 3 TARJETAS DE PROPUESTA DE VALOR ================= -->
  <section id="caracteristicas" class="py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 transition">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-2xl mx-auto mb-12">
        <span class="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
          Módulos Especializados
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
          Todo lo que tu complejo necesita en un solo software
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Tarjeta 1 -->
        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-emerald-500/40 transition">
          <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl font-black">
            🏢
          </div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white">Portales Independientes por Sede</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Tus clientes ingresan a <code>/sede/[tu-complejo]</code>. Se aplican tus colores institucionales, logo, aviso de reglas (ej. no guayos con taches de aluminio) y tus propios medios de pago configurados.
          </p>
          <div class="pt-2">
            <a href="/sede/la-bernabeu" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Ver ejemplo en La Bernabéu →</a>
          </div>
        </div>

        <!-- Tarjeta 2 -->
        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-amber-500/40 transition">
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl font-black">
            🐄
          </div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white">La Vaca Digital para Jugadores</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            El capitán comparte un link por WhatsApp y el sistema divide el costo del alquiler entre 10 o 14 jugadores. Cada amigo paga su cuota exacta a tu cuenta de Nequi o Daviplata.
          </p>
          <div class="pt-2">
            <span class="text-xs font-bold text-amber-600 dark:text-amber-400">✓ Cero fricción de cobro</span>
          </div>
        </div>

        <!-- Tarjeta 3 -->
        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 space-y-4 hover:border-emerald-500/40 transition">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl font-black">
            🧾
          </div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white">Folio Unificado Cancha + Bar</h3>
          <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            El canchero carga hidratación y cervezas directamente al turno en juego. Al terminar, el sistema emite el folio total descontando el abono previo y permitiendo cobro en efectivo o digital.
          </p>
          <div class="pt-2">
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">✓ Mismo total en POS y Admin</span>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- ================= SECCIÓN DE PLANES SAAS B2B ================= -->
  <section id="planes" class="py-16 bg-slate-100/80 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800/80 transition">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-3xl mx-auto mb-12">
        <span class="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
          Tarifas Transparentes
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
          Planes SaaS Simples. Cero Comisiones por Partido.
        </h2>
        <p class="text-slate-600 dark:text-slate-400 text-sm mt-2">
          Pagas una mensualidad fija y conservas el 100% de lo que recaudan tus canchas y tu cafetería.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        
        <!-- Plan Básico -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Plan Básico</span>
            <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">Hasta 2 Canchas</h3>
            <div class="mt-4 flex items-baseline space-x-1">
              <span class="text-3xl font-black text-slate-900 dark:text-white">$149.000</span>
              <span class="text-xs text-slate-500 font-bold">COP / mes</span>
            </div>
            <p class="text-xs text-slate-500 mt-2">Ideal para complejos pequeños que buscan digitalizar turnos y abonos.</p>
            
            <ul class="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li class="flex items-center space-x-2"><span>✓</span><span>Portal web exclusivo <code>/sede/[slug]</code></span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Parrilla en tiempo real y bloqueo 10 min</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Recepción de abonos por Nequi/Daviplata</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>1 cuenta de Administrador</span></li>
            </ul>
          </div>

          <a href="https://wa.me/573006799595?text=Deseo%20el%20Plan%20Básico%20de%20CanchaPro" target="_blank" class="w-full text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-xs transition">
            Comenzar con Básico
          </a>
        </div>

        <!-- Plan Pro (Destacado) -->
        <div class="bg-gradient-to-b from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-xl relative">
          <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            Más Popular
          </div>
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Plan Pro</span>
            <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">Hasta 5 Canchas</h3>
            <div class="mt-4 flex items-baseline space-x-1">
              <span class="text-3xl font-black text-emerald-600 dark:text-emerald-400">$299.000</span>
              <span class="text-xs text-slate-500 font-bold">COP / mes</span>
            </div>
            <p class="text-xs text-slate-500 mt-2">Para complejos medianos con cafetería activa y múltiples horarios.</p>
            
            <ul class="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
              <li class="flex items-center space-x-2"><span>✓</span><span>Todo lo del Plan Básico</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span><strong>La Vaca Digital por WhatsApp</strong></span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span><strong>POS Cafetería & Folio Unificado</strong></span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Tarifas Valle, Pico y Fin de Semana</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Roles Admin Sede + Canchero/POS</span></li>
            </ul>
          </div>

          <a href="https://wa.me/573006799595?text=Deseo%20el%20Plan%20Pro%20de%20CanchaPro" target="_blank" class="w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20">
            Elegir Plan Pro
          </a>
        </div>

        <!-- Plan Enterprise -->
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Plan Enterprise</span>
            <h3 class="text-xl font-black text-slate-900 dark:text-white mt-1">Canchas Ilimitadas</h3>
            <div class="mt-4 flex items-baseline space-x-1">
              <span class="text-3xl font-black text-slate-900 dark:text-white">$499.000</span>
              <span class="text-xs text-slate-500 font-bold">COP / mes</span>
            </div>
            <p class="text-xs text-slate-500 mt-2">Para grandes complejos con torneos, múltiples canchas y eventos.</p>
            
            <ul class="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li class="flex items-center space-x-2"><span>✓</span><span>Sub-canchas y deportes ilimitados</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Motor de Torneos & Fixtures en vivo</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Alertas automáticas vía Telegram / WhatsApp</span></li>
              <li class="flex items-center space-x-2"><span>✓</span><span>Soporte prioritario 24/7 y onboarding</span></li>
            </ul>
          </div>

          <a href="https://wa.me/573006799595?text=Deseo%20el%20Plan%20Enterprise%20de%20CanchaPro" target="_blank" class="w-full text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl text-xs transition">
            Contactar para Enterprise
          </a>
        </div>

      </div>

    </div>
  </section>

  <!-- ================= CASOS DE ÉXITO Y TESTIMONIOS ================= -->
  <section id="testimonios" class="py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 transition">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-2xl mx-auto mb-12">
        <span class="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
          Resultados Reales
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-3">
          Lo que dicen los dueños de complejos
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
          <div class="flex items-center space-x-1 text-amber-400 text-xs">★★★★★</div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "CanchaPro nos solucionó el desorden de WhatsApp. Los clientes reservan en su portal, pagan el abono del 50% y en caja el cuadre con el bar sale exacto todos los días."
          </p>
          <div class="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center space-x-3">
            <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">MM</div>
            <div>
              <p class="font-bold text-xs text-slate-900 dark:text-white">Don Mario Mendoza</p>
              <p class="text-[10px] text-slate-500">Complejo Deportivo La Bernabéu (Cartagena)</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
          <div class="flex items-center space-x-1 text-amber-400 text-xs">★★★★★</div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "Tener 4 canchas con tarifas diferenciadas diurnas y nocturnas sin cruces de horarios nos aumentó la ocupación nocturna un 35% desde el primer mes."
          </p>
          <div class="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center space-x-3">
            <div class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">CN</div>
            <div>
              <p class="font-bold text-xs text-slate-900 dark:text-white">Gerencia General</p>
              <p class="text-[10px] text-slate-500">Camp Nou Arena VIP (Bogotá)</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
          <div class="flex items-center space-x-1 text-amber-400 text-xs">★★★★★</div>
          <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "La Vaca Digital es lo mejor que le ha pasado a nuestras canchas: los equipos se dividen la cuenta solos y nosotros ya no perseguimos la plata de nadie."
          </p>
          <div class="border-t border-slate-200 dark:border-slate-800/80 pt-3 flex items-center space-x-3">
            <div class="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">AG</div>
            <div>
              <p class="font-bold text-xs text-slate-900 dark:text-white">Andrés Gómez</p>
              <p class="text-[10px] text-slate-500">Complejo La Favela (Medellín)</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- ================= PREGUNTAS FRECUENTES B2B ================= -->
  <section id="faq" class="py-16 bg-slate-100/80 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800/80 transition">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      <div class="text-center">
        <h2 class="text-3xl font-black text-slate-900 dark:text-white">Preguntas Frecuentes</h2>
        <p class="text-xs text-slate-500 mt-1">Resolvemos las dudas más comunes de propietarios de canchas.</p>
      </div>

      <div class="space-y-4 text-xs">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h3 class="font-black text-slate-900 dark:text-white text-sm">¿Cómo recibe el complejo el dinero de los abonos?</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            Directamente en tus cuentas. Configuras tus números de Nequi, Daviplata, Bancolombia o llaves Wompi en tu panel de administración. CanchaPro no retiene tus fondos ni cobra comisión por partido.
          </p>
        </div>

        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h3 class="font-black text-slate-900 dark:text-white text-sm">¿Cómo funciona la dirección de mi sede?</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            Cada complejo obtiene su enlace único: <code>canchapro.co/sede/[tu-slug]</code>. Al entrar allí, tus clientes solo ven tus canchas, tus horarios y tus políticas de calzado.
          </p>
        </div>

        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
          <h3 class="font-black text-slate-900 dark:text-white text-sm">¿Qué pasa si llueve o hay tormenta?</h3>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">
            El administrador puede registrar un bloqueo climático en 1 clic. El sistema notifica a los jugadores y emite automáticamente un bono digital de reprogramación para que el cliente use su saldo otro día.
          </p>
        </div>
      </div>

    </div>
  </section>

  <!-- ================= FOOTER OFICIAL ESCUTECH ================= -->
  <footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-10 transition">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <div class="flex items-center space-x-2">
        <span class="font-black text-slate-900 dark:text-white">CANCHA<span class="text-emerald-500">PRO</span></span>
        <span>•</span>
        <span>Desarrollado por <strong>EscuTech Solutions</strong></span>
      </div>

      <div class="flex items-center space-x-4">
        <a href="/sede/la-bernabeu" class="hover:text-emerald-500 transition">Sede La Bernabéu</a>
        <a href="/superadmin" class="hover:text-purple-500 transition">Torre SuperAdmin</a>
        <a href="/portal" class="hover:text-blue-500 transition">Portal Jugador</a>
      </div>

      <p>© 2026 CanchaPro SaaS. Todos los derechos reservados.</p>
    </div>
  </footer>

  <script>
    // Inicialización de iconos Feather y Tema Claro/Oscuro
    function initTheme() {
      const saved = localStorage.getItem('canchapro_theme') || 'dark';
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      if (window.feather) feather.replace();
    }

    function toggleTheme() {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('canchapro_theme', isDark ? 'dark' : 'light');
      if (window.feather) feather.replace();
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../public/index.html'), landingHtml, 'utf8');
fs.writeFileSync(path.join(__dirname, '../frontend/index.html'), landingHtml, 'utf8');
console.log('✓ Clean B2B Commercial Landing generated successfully in public/index.html and frontend/index.html');
