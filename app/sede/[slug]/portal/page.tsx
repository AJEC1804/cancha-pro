'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Reservation, Field, Venue } from '../../../../types/canchapro';
import { UnifiedFolioModal } from '../../../../components/UnifiedFolioModal';

interface Props {
  params: {
    slug: string;
  };
}

export default function SedePlayerPortalPage({ params }: Props) {
  const [activeTab, setActiveTab] = useState<'nueva' | 'reservas'>('nueva');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
  );
  const [gridSlots, setGridSlots] = useState<any[]>([]);

  // Checkout en 1 solo paso
  const [checkoutSlot, setCheckoutSlot] = useState<any | null>(null);
  const [paymentMode, setPaymentMode] = useState<'deposit_50' | 'full_100' | 'la_vaca'>('deposit_50');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('nequi');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Modal de Folio
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isFolioOpen, setIsFolioOpen] = useState<boolean>(false);

  // Demo user token for player
  const token = 'demo-user-b0000000-0000-0000-0000-000000000004';
  const customerId = 'b0000000-0000-0000-0000-000000000004';

  const loadVenueData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/venues/by-slug/${params.slug}`);
      const data = await res.json();
      if (data.success && data.venue) {
        setVenue(data.venue);
        const fieldsRes = await fetch(`/api/fields?venue_id=${data.venue.id}`);
        const fieldsData = await fieldsRes.json();
        if (fieldsData.success && fieldsData.fields) {
          setFields(fieldsData.fields);
          if (fieldsData.fields.length > 0) {
            setSelectedFieldId(fieldsData.fields[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    try {
      const res = await fetch(`/api/reservations?customer_id=${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.reservations) {
        setReservations(data.reservations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadGridSlots = async (fieldId: string, date: string) => {
    if (!fieldId) return;
    try {
      const res = await fetch(`/api/reservations/grid?field_id=${fieldId}&date=${date}`);
      const data = await res.json();
      if (data.success && data.slots) {
        setGridSlots(data.slots);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadVenueData();
    loadReservations();
  }, [params.slug]);

  useEffect(() => {
    if (selectedFieldId && selectedDate) {
      loadGridSlots(selectedFieldId, selectedDate);
    }
  }, [selectedFieldId, selectedDate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutSlot || !venue || !selectedFieldId) return;

    try {
      setIsSubmittingBooking(true);
      const totalAmount = checkoutSlot.price;
      const depositRequired = paymentMode === 'full_100' ? totalAmount : Math.round(totalAmount * 0.5);

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          venue_id: venue.id,
          field_id: selectedFieldId,
          booking_date: selectedDate,
          start_time: checkoutSlot.start_time,
          end_time: checkoutSlot.end_time,
          payment_mode: paymentMode,
          payment_method: selectedPaymentMethod,
          payment_reference: paymentReference || 'NEQUI-DEMO',
          total_amount: totalAmount,
          deposit_required: depositRequired,
          accepted_terms: true
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Reserva realizada con éxito. Tu turno ha sido registrado.');
        setCheckoutSlot(null);
        setPaymentReference('');
        setActiveTab('reservas');
        loadReservations();
        loadGridSlots(selectedFieldId, selectedDate);
      } else {
        alert(data.error || 'No se pudo completar la reserva.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400"><span className="animate-spin inline-block mr-2">⏳</span> Cargando portal del jugador...</span>
      </div>
    );
  }

  if (venue && !venue.is_active) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="text-3xl">🚫</div>
          <h1 className="text-lg font-black text-white">{venue.name}</h1>
          <p className="text-xs text-red-400 font-bold">Sede Temporalmente Suspendida</p>
          <p className="text-xs text-slate-400">Las reservas en este complejo se encuentran bloqueadas.</p>
        </div>
      </div>
    );
  }

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Topbar del Portal */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/sede/${params.slug}`} className="font-black text-base text-white hover:text-emerald-400 transition">
              ← {venue?.name || 'Sede'}
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Portal Jugador
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono hidden sm:inline">Mateo Jugador</span>
            <Link
              href={`/sede/${params.slug}`}
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800"
            >
              Salir
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        
        {/* Banner Bienvenida Sede */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              {venue?.city} • {venue?.address}
            </span>
            <h1 className="text-2xl font-black text-white mt-1">Portal Oficial — {venue?.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              ⚠️ {venue?.rules_and_conditions || 'Uso obligatorio de tenis o guayos sintéticos (turf). No taches metálicos.'}
            </p>
          </div>

          <button
            onClick={() => setActiveTab('nueva')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition shrink-0"
          >
            ⚡ Reservar en mi Sede
          </button>
        </div>

        {/* 2 Pestañas Internas */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab('nueva')}
            className={`pb-3 px-4 text-xs font-black transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'nueva'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📅</span>
            <span>Nueva Reserva en mi Sede</span>
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-3 px-4 text-xs font-black transition border-b-2 flex items-center space-x-2 ${
              activeTab === 'reservas'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📋</span>
            <span>Mis Reservas y Pagos</span>
            {reservations.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {reservations.length}
              </span>
            )}
          </button>
        </div>

        {/* PESTAÑA 1: NUEVA RESERVA */}
        {activeTab === 'nueva' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Sub-Cancha</label>
                <select
                  value={selectedFieldId}
                  onChange={e => setSelectedFieldId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.sport_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Fecha (Bogotá)</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>
            </div>

            {/* Parrilla Horaria */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Horarios Disponibles para {selectedDate}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedField?.open_time} - {selectedField?.close_time}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {gridSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!slot.is_available}
                    onClick={() => setCheckoutSlot(slot)}
                    className={`p-3 rounded-2xl border text-center transition ${
                      slot.is_available
                        ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer'
                        : 'border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold block text-white">{slot.start_time} - {slot.end_time}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">${Number(slot.price).toLocaleString('es-CO')}</span>
                    <span className={`text-[9px] font-black uppercase block mt-1 ${slot.is_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {slot.is_available ? 'Disponible' : 'Ocupado'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: MIS RESERVAS Y PAGOS */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <p className="text-sm font-bold text-slate-300">No tienes partidos reservados en este momento.</p>
                <button
                  onClick={() => setActiveTab('nueva')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs"
                >
                  Ver Horarios Disponibles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reservations.map(res => {
                  const courtBalance = Number(res.remaining_balance || (res.total_amount - res.deposit_paid));
                  const barDebt = Number(res.folio?.cafeteria_total_amount || 0);
                  const totalPending = courtBalance + barDebt;

                  return (
                    <div key={res.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono text-slate-400">#{res.id}</span>
                          <h3 className="text-base font-black text-white">{res.field_name}</h3>
                          <p className="text-xs text-slate-400">📅 {res.booking_date} • ⏰ {res.start_time} - {res.end_time}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase text-slate-400 block font-bold">Total Pendiente</span>
                          <span className="text-xl font-black text-amber-400">${totalPending.toLocaleString('es-CO')} COP</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Tarifa Cancha</span>
                          <span className="font-bold text-slate-200">${Number(res.total_amount).toLocaleString('es-CO')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Abono Pagado</span>
                          <span className="font-bold text-emerald-400">${Number(res.deposit_paid).toLocaleString('es-CO')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Saldo Cancha</span>
                          <span className="font-bold text-amber-300">${courtBalance.toLocaleString('es-CO')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Consumos Bar</span>
                          <span className="font-bold text-amber-400">${barDebt.toLocaleString('es-CO')}</span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setSelectedReservationId(res.id);
                            setIsFolioOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition"
                        >
                          Ver Folio & Desglose Bar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal Checkout 1 Solo Paso */}
      {checkoutSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Confirmar Reserva de Cancha</h3>
                <p className="text-xs text-slate-400">{selectedField?.name} • {checkoutSlot.start_time} - {checkoutSlot.end_time}</p>
              </div>
              <button onClick={() => setCheckoutSlot(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
              {/* Modalidad de Pago (Se pregunta una sola vez) */}
              <div>
                <label className="text-slate-400 block mb-2 font-bold uppercase tracking-wider text-[10px]">
                  Modalidad de Pago (1 Solo Paso)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('deposit_50')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      paymentMode === 'deposit_50'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <span className="block text-sm">50%</span>
                    <span className="text-[10px] block mt-0.5 font-normal">Abono Inicial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('full_100')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      paymentMode === 'full_100'
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <span className="block text-sm">100%</span>
                    <span className="text-[10px] block mt-0.5 font-normal">Pago Total</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('la_vaca')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      paymentMode === 'la_vaca'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <span className="block text-sm">🐄</span>
                    <span className="text-[10px] block mt-0.5 font-normal">La Vaca Digital</span>
                  </button>
                </div>
              </div>

              {/* Cálculo del Monto Exacto */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tarifa turno (1 hora):</span>
                  <span className="font-bold text-white">${Number(checkoutSlot.price).toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex justify-between font-black text-emerald-400 text-sm pt-1 border-t border-slate-800">
                  <span>Monto a Transferir Ahora:</span>
                  <span>
                    ${(paymentMode === 'full_100' ? checkoutSlot.price : Math.round(checkoutSlot.price * 0.5)).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* Medios de Pago de la Sede */}
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Transferir a Cuentas de la Sede</label>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-slate-300">
                  <p className="font-mono text-emerald-400 font-bold">Nequi: {venue?.phone || '3006799595'}</p>
                  <p className="text-[11px] text-slate-400">Titular: {venue?.name}</p>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">Referencia de Transferencia / Nro. Comprobante</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: M1234567 o 987654"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckoutSlot(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmittingBooking ? 'Confirmando...' : 'Confirmar Reserva en Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Folio Unificado */}
      {selectedReservationId && (
        <UnifiedFolioModal
          reservationId={selectedReservationId}
          isOpen={isFolioOpen}
          token={token}
          onClose={() => {
            setIsFolioOpen(false);
            setSelectedReservationId(null);
          }}
          onSettled={() => {
            loadReservations();
          }}
        />
      )}

    </div>
  );
}
