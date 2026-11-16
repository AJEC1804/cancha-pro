import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Venue, Field } from '../../../types/canchapro';

interface Props {
  params: {
    slug: string;
  };
}

async function getVenueData(slug: string): Promise<{ venue: Venue; fields: Field[] } | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/venues/by-slug/${slug}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success || !data.venue) return null;

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

  // BLOQUEO INMEDIATO SI LA SEDE ESTÁ SUSPENDIDA
  if (!venue.is_active) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-3xl">
            🚫
          </div>
          <span className="text-xs uppercase font-black tracking-widest text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
            Servicio Temporalmente Suspendido
          </span>
          <h1 className="text-2xl font-black text-white">{venue.name}</h1>
          <p className="text-xs text-slate-400">
            El portal público y sistema de reservas de este complejo deportivo han sido temporalmente desactivados por la administración.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition inline-block"
            >
              Volver a CanchaPro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isWeekend = [0, 6].includes(new Date().getDay());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header Sede Oficial */}
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
              href={`/sede/${venue.slug}/portal`}
              className="text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Portal Jugador
            </Link>
            <Link
              href={`/sede/${venue.slug}/admin`}
              className="hidden sm:inline-flex text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition"
            >
              Admin Sede
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        
        {/* Aviso de Reglas del Complejo (Estilo La Bernabéu) */}
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                Reglamento Oficial de {venue.name}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {venue.rules_and_conditions || 'Uso obligatorio de calzado deportivo turf. Prohibido terminantemente el ingreso con guayos de taches metálicos o de aluminio.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Llegar 15 min antes</span>
        </div>

        {/* Hero Sede */}
        <section className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Disponibilidad Oficial en Tiempo Real</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Reserva tu partido en <span className="text-emerald-400">{venue.name}</span>
          </h1>

          <p className="text-sm text-slate-400 max-w-2xl">
            {venue.address}, {venue.city} • Consulta turnos disponibles, divide el pago con tu equipo en La Vaca Digital y recibe confirmación inmediata.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/sede/${venue.slug}/portal`}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <span>⚡ Ingresar al Portal del Jugador</span>
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
        </section>

        {/* Sub-Canchas y Tarifas Consistentes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Canchas y Tarifas de la Sede</h2>
              <p className="text-xs text-slate-400">Tarifas unificadas para horarios diurnos, nocturnos y fines de semana.</p>
            </div>
            <span className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-xl">
              {isWeekend ? 'Tarifa Fin de Semana' : 'Tarifa Entre Semana'}
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
                      {field.description || 'Grama sintética monofilamento con iluminación profesional de alta potencia.'}
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
                    href={`/sede/${venue.slug}/portal?tab=nueva&field=${field.id}`}
                    className="w-full text-center bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-sm"
                  >
                    Reservar Turno en Portal
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 CanchaPro SaaS — {venue.name}. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
}
