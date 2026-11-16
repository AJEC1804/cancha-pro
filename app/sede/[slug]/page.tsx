import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Venue, Field } from '../../../types/canchapro';

interface Props {
  params: {
    slug: string;
  };
}

// Carga en el servidor (SSR) de los datos de la sede para eliminar cualquier parpadeo de carga
async function getVenueData(slug: string): Promise<{ venue: Venue; fields: Field[] } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/venues/by-slug/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.venue) return null;

    // Obtener canchas asociadas exclusivamente a esta sede
    const fieldsRes = await fetch(`${baseUrl}/api/fields?venue_id=${data.venue.id}`, {
      cache: 'no-store'
    });
    const fieldsData = await fieldsRes.json();
    return {
      venue: data.venue,
      fields: fieldsData.success ? fieldsData.fields : []
    };
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const data = await getVenueData(params.slug);
  if (!data) return { title: 'Sede no encontrada | CanchaPro' };

  return {
    title: `${data.venue.name} — Reservas Online | CanchaPro`,
    description: `Reserva tu cancha sintética en ${data.venue.name}, ${data.venue.city}. Parrilla de horarios en vivo y La Vaca Digital.`
  };
}

export default async function SedeSlugPage({ params }: Props) {
  const data = await getVenueData(params.slug);

  if (!data) {
    notFound();
  }

  const { venue, fields } = data;
  const isWeekend = [0, 6].includes(new Date().getDay());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Barra de Navegación Ejecutiva y Limpia */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                CANCHA<span className="text-white">PRO</span>
              </span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
              📍 {venue.name}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href={`/login?redirect=/portal&venue=${venue.slug}`}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl transition"
            >
              Iniciar Sesión
            </Link>
            <Link
              href={`/login?mode=register&redirect=/portal&venue=${venue.slug}`}
              className="text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Portal Jugador
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Ejecutivo con Datos Directos de Servidor (Zero Flicker) */}
      <section className="relative py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full text-center sm:text-left">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Disponibilidad Oficial en Tiempo Real</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Reserva tu partido en <span className="text-emerald-400">{venue.name}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            {venue.address}, {venue.city} • Consulta turnos disponibles, divide el pago con tu equipo en La Vaca Digital y recibe confirmación inmediata.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/login?redirect=/portal&venue=${venue.slug}`}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <span>⚡ Reservar Turno en {venue.name}</span>
            </Link>
            <a
              href={`https://wa.me/57${venue.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm border border-slate-800 transition flex items-center space-x-2"
            >
              <span>💬 Contactar por WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3 Tarjetas de Propuesta de Valor */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg mb-4">
              📅
            </div>
            <h3 className="text-base font-black text-white mb-1">Disponibilidad en Vivo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consulta los horarios libres de cada cancha sin llamar ni esperar chats. Lo que ves en parrilla está 100% reservable.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-lg mb-4">
              🐄
            </div>
            <h3 className="text-base font-black text-white mb-1">La Vaca Digital</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Divide el alquiler automáticamente entre 10 o 14 jugadores con link único para que cada amigo pague su parte por Nequi o Daviplata.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg mb-4">
              🧾
            </div>
            <h3 className="text-base font-black text-white mb-1">Folio & Bar Integrado</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tus consumos de bebidas y saldo de cancha en un solo folio transparente. Paga en línea o liquida en el mostrador.
            </p>
          </div>
        </div>
      </section>

      {/* Canchas y Tarifas Consistentes de la Sede */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Canchas y Tarifas Oficiales</h2>
            <p className="text-xs text-slate-400">Tarifas unificadas para horarios diurnos, nocturnos y fines de semana.</p>
          </div>
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-xl">
            {isWeekend ? 'Tarifa Fin de Semana Activa' : 'Tarifa Entre Semana'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map(field => {
            const valleyPrice = isWeekend 
              ? (field.weekend_price_per_hour || field.default_price_per_hour)
              : field.default_price_per_hour;
            const peakPrice = isWeekend
              ? (field.weekend_peak_price_per_hour || field.peak_price_per_hour)
              : field.peak_price_per_hour;

            return (
              <div 
                key={field.id}
                className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700 transition space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      {field.sport_type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {field.open_time} - {field.close_time}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mt-3">{field.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {field.description || 'Grama sintética monofilamento certificada con iluminación profesional.'}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Horario Valle (Diurno):</span>
                    <span className="font-bold text-white">${valleyPrice.toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Horario Pico (Nocturno):</span>
                    <span className="font-bold text-emerald-400">${peakPrice.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                <Link
                  href={`/login?redirect=/portal&venue=${venue.slug}&field=${field.id}`}
                  className="w-full text-center bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Consultar Turnos Disponibles
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 CanchaPro SaaS — {venue.name}. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
}
