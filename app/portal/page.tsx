'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Reservation, Venue, Field } from '../../types/canchapro';
import { UnifiedFolioModal } from '../../components/UnifiedFolioModal';

export default function PlayerPortalPage() {
  const [activeTab, setActiveTab] = useState<'reservas' | 'nueva'>('reservas');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Folio
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isFolioOpen, setIsFolioOpen] = useState<boolean>(false);

  // Subir comprobante
  const [uploadReservationId, setUploadReservationId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Cancha y Sede para Nueva Reserva
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [gridSlots, setGridSlots] = useState<any[]>([]);

  // Demo user token for player
  const token = 'demo-user-b0000000-0000-0000-0000-000000000004';
  const customerId = 'b0000000-0000-0000-0000-000000000004';
  const venueId = 'a0000000-0000-0000-0000-000000000001'; // La Bernabéu

  const fetchPlayerReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reservations?customer_id=${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.reservations)) {
        setReservations(data.reservations);
      } else {
        setError(data.error || 'No se pudieron consultar tus reservas.');
      }
    } catch (e) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const loadVenueFields = async () => {
    try {
      const res = await fetch(`/api/fields?venue_id=${venueId}`);
      const data = await res.json();
      if (data.success && data.fields) {
        setFields(data.fields);
        if (data.fields.length > 0) {
          setSelectedFieldId(data.fields[0].id);
        }
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
    fetchPlayerReservations();
    loadVenueFields();
  }, []);

  useEffect(() => {
    if (activeTab === 'nueva' && selectedFieldId) {
      loadGridSlots(selectedFieldId, selectedDate);
    }
  }, [activeTab, selectedFieldId, selectedDate]);

  const handleUploadReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadReservationId) return;

    try {
      setIsUploading(true);
      const res = await fetch(`/api/reservations/${uploadReservationId}/upload-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_reference: paymentRef || 'NEQUI-TRANSFER-DEMO',
          receipt_url: receiptUrl || 'https://storage.canchapro.com/receipts/demo.jpg'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Comprobante adjuntado con éxito. Estado: Pendiente de Verificación por la administración.');
        setUploadReservationId(null);
        setPaymentRef('');
        setReceiptUrl('');
        fetchPlayerReservations();
      } else {
        alert(data.error || 'Error al subir comprobante');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar con Estado Activo Claro de Jugador */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="font-black text-xl text-white tracking-tight">
              CANCHA<span className="text-emerald-400">PRO</span>
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Portal Jugador
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-white block">Mateo Jugador</span>
              <span className="text-[10px] text-slate-400 font-mono">mateo@gmail.com</span>
            </div>
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition"
            >
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        
        {/* Banner Bienvenida con Acción Rápida */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">¡Hola, Mateo! 👋</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Gestiona tus partidos reservados, liquida tus consumos y reserva turnos en tu sede asignada.
            </p>
          </div>

          {/* El botón Reservar en mi Sede activa la pestaña Nueva Reserva SIN salir a la home */}
          <button
            onClick={() => setActiveTab('nueva')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
          >
            <span>⚡ Reservar en mi Sede</span>
          </button>
        </div>

        {/* 2 Pestañas Internas Claras */}
        <div className="flex border-b border-slate-800 space-x-2">
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
        </div>

        {/* PESTAÑA 1: MIS RESERVAS Y PAGOS */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            {loading && (
              <div className="py-16 text-center text-slate-400 text-xs">
                <span className="inline-block animate-spin mr-2">⏳</span> Consultando tus reservas y estados de cuenta...
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {!loading && reservations.length === 0 && (
              <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
                <p className="text-sm font-bold text-slate-300">Aún no tienes partidos reservados</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Reserva tu turno ahora y comparte el link con tu equipo para armar la vaca.
                </p>
                <button
                  onClick={() => setActiveTab('nueva')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition"
                >
                  Buscar Horarios Disponibles
                </button>
              </div>
            )}

            {!loading && reservations.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {reservations.map(res => {
                  const folio = res.folio;
                  const courtBalance = Number(res.remaining_balance || (res.total_amount - res.deposit_paid));
                  const barDebt = Number(folio?.cafeteria_total_amount || 0);
                  const totalPending = courtBalance + barDebt;

                  return (
                    <div
                      key={res.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-slate-400">#{res.id}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              res.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              res.status === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {res.status === 'confirmed' ? 'Confirmada' :
                               res.status === 'pending_verification' ? 'Verificando Comprobante' : res.status}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1">{res.field_name}</h3>
                          <p className="text-xs text-slate-400">
                            📅 {res.booking_date} • ⏰ {res.start_time} - {res.end_time}
                          </p>
                        </div>

                        {/* Estado financiero */}
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] uppercase text-slate-400 block font-bold">Total Pendiente</span>
                          <span className="text-xl font-black text-amber-400">
                            ${totalPending.toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>

                      {/* Desglose rápido */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
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

                      {/* Botones de acción */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => {
                            setSelectedReservationId(res.id);
                            setIsFolioOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs transition shadow-sm"
                        >
                          Ver Folio & Desglose Bar
                        </button>

                        {totalPending > 0 && res.status !== 'pending_verification' && (
                          <button
                            onClick={() => setUploadReservationId(res.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold px-3.5 py-1.5 rounded-xl text-xs transition"
                          >
                            📤 Subir Comprobante Nequi/PSE
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: NUEVA RESERVA (Filtrada estrictamente para la sede) */}
        {activeTab === 'nueva' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">Disponibilidad en Sede La Bernabéu</h2>
              <p className="text-xs text-slate-400">
                Selecciona la cancha y la fecha para consultar los turnos disponibles y reservar en 1 solo paso.
              </p>
            </div>

            {/* Selectores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Cancha</label>
                <select
                  value={selectedFieldId}
                  onChange={e => setSelectedFieldId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.sport_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Fecha del Partido</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Grilla de Horarios */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
                Horarios Disponibles para {selectedDate}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {gridSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border text-center transition ${
                      slot.is_available
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 cursor-pointer'
                        : 'border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold block text-white">{slot.start_time}</span>
                    <span className="text-[10px] text-slate-400 block">${Number(slot.price).toLocaleString('es-CO')}</span>
                    <span className={`text-[9px] font-black uppercase block mt-1 ${slot.is_available ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {slot.is_available ? 'Libre' : 'Ocupado'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Modal Reutilizable de Folio Unificado */}
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
            fetchPlayerReservations();
          }}
        />
      )}

      {/* Modal de Subir Comprobante */}
      {uploadReservationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white">Subir Comprobante de Pago</h3>
              <button onClick={() => setUploadReservationId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUploadReceiptSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Número de Aprobación / Referencia Nequi/Daviplata</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: M1234567 o 987654"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-bold">URL de Comprobante / Imagen</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={e => setReceiptUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadReservationId(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {isUploading ? 'Enviando...' : 'Enviar Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
