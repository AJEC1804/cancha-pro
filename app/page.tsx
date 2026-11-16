import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'CanchaPro SaaS — El Sistema Operativo para Complejos Deportivos',
  description: 'Software B2B integral para canchas sintéticas en Colombia: reservas online, La Vaca Digital, POS cafetería y folio unificado sin comisiones por partido.'
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Topbar B2B */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                CANCHA<span className="text-white">PRO</span>
              </span>
              <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                SaaS B2B
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-slate-400">
            <a href="#solucion" className="hover:text-emerald-400 transition">Solución</a>
            <a href="#caracteristicas" className="hover:text-emerald-400 transition">Características</a>
            <a href="#planes" className="hover:text-emerald-400 transition">Planes SaaS</a>
            <a href="#testimonios" className="hover:text-emerald-400 transition">Casos de Éxito</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/sede/la-bernabeu"
              className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center space-x-1.5"
            >
              <span>🏟️</span>
              <span className="hidden sm:inline">Demo Sede:</span>
              <span>La Bernabéu</span>
            </Link>

            <Link
              href="/superadmin"
              className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center space-x-1.5"
            >
              <span>👑</span>
              <span>SuperAdmin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero B2B */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span>⚡ Software de Gestión Multi-Sede para Colombia</span>
            <span>•</span>
            <span className="text-amber-400">0% Comisiones por Reserva</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            El Sistema Operativo para <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
              Canchas Sintéticas y Complejos
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Automatiza reservas online con abonos del 50%, reduce los no-shows con La Vaca Digital y liquida consumos de bar y horas de cancha en un solo folio unificado.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sede/la-bernabeu"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <span>🏟️ Ver Demo Sede (La Bernabéu)</span>
            </Link>
            <Link
              href="/superadmin"
              className="bg-purple-600 hover:bg-purple-500 text-white font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl shadow-purple-600/20 transition flex items-center space-x-2"
            >
              <span>👑 Torre de Control SuperAdmin</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-black">No-Shows</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">0%</p>
              <p className="text-[11px] text-slate-400">Abono 50% anticipado</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-black">Comisiones</span>
              <p className="text-2xl font-black text-teal-400 mt-1">$0</p>
              <p className="text-[11px] text-slate-400">Tarifa fija mensual</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-black">Folio Único</span>
              <p className="text-2xl font-black text-amber-400 mt-1">Cancha + Bar</p>
              <p className="text-[11px] text-slate-400">Arqueo exacto en caja</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-black">Multi-Cancha</span>
              <p className="text-2xl font-black text-blue-400 mt-1">F5, F7, Pádel</p>
              <p className="text-[11px] text-slate-400">Tarifas Valle/Pico/Finde</p>
            </div>
          </div>
        </div>
      </section>

      {/* Planes B2B */}
      <section id="planes" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase font-black text-emerald-400 tracking-wider">Suscripción SaaS</span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">Planes Transparentes y Fijos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs font-bold text-slate-400">Básico (Hasta 2 Canchas)</span>
            <div className="text-3xl font-black text-white">$149.000 <span className="text-xs text-slate-500 font-normal">COP/mes</span></div>
            <p className="text-xs text-slate-400">Para complejos pequeños que inician su digitalización.</p>
          </div>
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 space-y-4 shadow-xl shadow-emerald-500/10">
            <span className="text-xs font-bold text-emerald-400">Pro (Hasta 5 Canchas) — Más Popular</span>
            <div className="text-3xl font-black text-emerald-400">$299.000 <span className="text-xs text-slate-500 font-normal">COP/mes</span></div>
            <p className="text-xs text-slate-300">Incluye La Vaca Digital, POS Cafetería y Cierre de Caja.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <span className="text-xs font-bold text-purple-400">Enterprise (Canchas Ilimitadas)</span>
            <div className="text-3xl font-black text-white">$499.000 <span className="text-xs text-slate-500 font-normal">COP/mes</span></div>
            <p className="text-xs text-slate-400">Para grandes clubes deportivos, torneos y fixtures.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 CanchaPro SaaS — Desarrollado por EscuTech Solutions.</p>
      </footer>

    </div>
  );
}
