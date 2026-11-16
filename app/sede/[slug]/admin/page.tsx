'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Reservation, Venue, Field, ShiftCashRegister } from '../../../../types/canchapro';
import { UnifiedFolioModal } from '../../../../components/UnifiedFolioModal';

interface Props {
  params: {
    slug: string;
  };
}

export default function SedeAdminPage({ params }: Props) {
  const [activeTab, setActiveTab] = useState<'reservas' | 'canchas' | 'pos' | 'pagos' | 'caja' | 'notificaciones'>('reservas');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [shift, setShift] = useState<ShiftCashRegister | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal Folio Unificado
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [isFolioOpen, setIsFolioOpen] = useState<boolean>(false);

  // Configuración de Medios de Pago
  const [paymentSettings, setPaymentSettings] = useState({
    nequi_number: '3006799595',
    nequi_holder: 'Mario Mendoza',
    daviplata_number: '3006799595',
    daviplata_holder: 'Mario Mendoza',
    bancolombia_type: 'Ahorros',
    bancolombia_number: '245-000123-45',
    bre_b_code: 'BREB-LABERNABEU-01',
    cash_accepted: true,
    wompi_enabled: true
  });
  const [isSavingPayments, setIsSavingPayments] = useState<boolean>(false);

  // Notificaciones & Telegram
  const [telegramChatId, setTelegramChatId] = useState<string>('123456789');
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const token = 'demo-user-b0000000-0000-0000-0000-000000000002'; // Mario Admin Sede

  const loadAllData = async () => {
    try {
      setLoading(true);
      const resVenue = await fetch(`/api/venues/by-slug/${params.slug}`);
      const dataVenue = await resVenue.json();

      if (dataVenue.success && dataVenue.venue) {
        setVenue(dataVenue.venue);
        const venueId = dataVenue.venue.id;

        const [resFields, resReservations, resShift] = await Promise.all([
          fetch(`/api/fields?venue_id=${venueId}`),
          fetch(`/api/reservations?venue_id=${venueId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/pos/shift/active?venue_id=${venueId}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const dataFields = await resFields.json();
        const dataRes = await resReservations.json();
        const dataShift = await resShift.json();

        if (dataFields.success) setFields(dataFields.fields || []);
        if (dataRes.success) setReservations(dataRes.reservations || []);
        if (dataShift.success) setShift(dataShift.shift || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [params.slug]);

  const handleApproveReservation = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Reserva aprobada');
        loadAllData();
      } else {
        alert(data.error || 'Error al aprobar');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleRejectReservation = async (reservationId: string) => {
    if (!confirm('¿Seguro que deseas rechazar este comprobante y liberar el turno?')) return;
    try {
      const res = await fetch(`/api/reservations/${reservationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Comprobante no coincide o no recibido' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Reserva rechazada y turno liberado');
        loadAllData();
      } else {
        alert(data.error || 'Error al rechazar');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue) return;
    try {
      setIsSavingPayments(true);
      const res = await fetch(`/api/venues/${venue.id}/payment-methods`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentSettings)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Medios de pago de la sede actualizados correctamente.');
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleSimulateReminder = (type: '24h' | '2h') => {
    setReminderStatus(`⚡ Recordatorio de ${type} enviado exitosamente vía Telegram (Chat ID: ${telegramChatId}) y WhatsApp a los jugadores confirmados de hoy.`);
    setTimeout(() => setReminderStatus(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400">⏳ Cargando panel administrativo de la sede...</span>
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
          <p className="text-xs text-slate-400">El acceso administrativo se encuentra restringido por la torre central.</p>
        </div>
      </div>
    );
  }

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = !searchQuery || 
      r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.client_phone.includes(searchQuery) ||
      r.field_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Topbar Admin */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/sede/${params.slug}`} className="font-black text-white hover:text-emerald-400 transition">
              ← {venue?.name}
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Admin & Canchero Sede
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono hidden sm:inline">Mario Mendoza (Admin)</span>
            <Link
              href="/"
              className="text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800"
            >
              Salir
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        
        {/* Banner de Sede */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-purple-500/10 text-purple-400 font-black px-2.5 py-0.5 rounded-full">
                Sede Activa
              </span>
              <span className="text-xs text-slate-400 font-mono">/sede/{venue?.slug}</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">Panel de Control — {venue?.name}</h1>
            <p className="text-xs text-slate-400 mt-1">{venue?.address}, {venue?.city} • Tel: {venue?.phone}</p>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/sede/${params.slug}/portal`}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              Ver Vista Cliente
            </Link>
          </div>
        </div>

        {/* Pestañas Operativas */}
        <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('reservas')}
            className={`pb-3 px-4 transition border-b-2 shrink-0 ${
              activeTab === 'reservas' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📋 Reservas & Folios
          </button>

          <button
            onClick={() => setActiveTab('canchas')}
            className={`pb-3 px-4 transition border-b-2 shrink-0 ${
              activeTab === 'canchas' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🏟️ Sub-Canchas & Tarifas
          </button>

          <button
            onClick={() => setActiveTab('caja')}
            className={`pb-3 px-4 transition border-b-2 shrink-0 ${
              activeTab === 'caja' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            📊 Cierre de Caja & Arqueo
          </button>

          <button
            onClick={() => setActiveTab('pagos')}
            className={`pb-3 px-4 transition border-b-2 shrink-0 ${
              activeTab === 'pagos' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            💳 Medios de Pago Sede
          </button>

          <button
            onClick={() => setActiveTab('notificaciones')}
            className={`pb-3 px-4 transition border-b-2 shrink-0 ${
              activeTab === 'notificaciones' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            🔔 Recordatorios & Reportes
          </button>
        </div>

        {/* PESTAÑA 1: RESERVAS Y COBROS (ESTILO LA BERNABÉU + FOLIO UNIFICADO) */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            {/* Buscador y Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, cancha..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 w-full sm:w-72"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    statusFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('pending_verification')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    statusFilter === 'pending_verification' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Por Verificar
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-3 py-1.5 rounded-xl font-bold ${
                    statusFilter === 'confirmed' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  Confirmadas
                </button>
              </div>
            </div>

            {/* Tabla Completa con las 10 Columnas Requeridas */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Sub-Cancha</th>
                      <th className="p-3">Fecha/Hora</th>
                      <th className="p-3 text-right">Total Cancha</th>
                      <th className="p-3 text-right">Abono (50%)</th>
                      <th className="p-3 text-right">Resta Cancha</th>
                      <th className="p-3 text-right">Consumos Bar</th>
                      <th className="p-3 text-right font-black">Total Neto</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReservations.map(r => {
                      const courtBalance = Number(r.remaining_balance || (r.total_amount - (r.deposit_paid || 0)));
                      const barDebt = Number(r.folio?.cafeteria_total_amount || 0);
                      const grandTotal = r.folio?.grand_total_due ?? (courtBalance + barDebt);

                      return (
                        <tr key={r.id} className="hover:bg-slate-900/40 transition">
                          <td className="p-3 font-bold text-white">
                            <span>{r.client_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{r.client_phone}</span>
                          </td>
                          <td className="p-3 text-slate-300 font-semibold">{r.field_name}</td>
                          <td className="p-3 text-slate-300 font-mono">
                            <span>{r.booking_date}</span>
                            <span className="text-[10px] text-slate-500 block">{r.start_time} - {r.end_time}</span>
                          </td>
                          <td className="p-3 text-right text-slate-300 font-bold">${Number(r.total_amount).toLocaleString('es-CO')}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">${Number(r.deposit_paid || 0).toLocaleString('es-CO')}</td>
                          <td className="p-3 text-right text-amber-300 font-bold">${courtBalance.toLocaleString('es-CO')}</td>
                          <td className="p-3 text-right text-amber-400 font-bold">${barDebt.toLocaleString('es-CO')}</td>
                          <td className="p-3 text-right font-black text-white">${grandTotal.toLocaleString('es-CO')}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              r.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              r.status === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              r.status === 'held' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {r.status === 'confirmed' ? 'Confirmada' :
                               r.status === 'pending_verification' ? 'Por Verificar' : r.status}
                            </span>
                            {r.status === 'pending_verification' && (
                              <div className="flex items-center justify-center space-x-1 mt-1">
                                <button
                                  onClick={() => handleApproveReservation(r.id)}
                                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded text-[9px] shadow-sm"
                                >
                                  ✓ Aprobar
                                </button>
                                <button
                                  onClick={() => handleRejectReservation(r.id)}
                                  className="bg-red-500 hover:bg-red-400 text-white font-black px-2 py-0.5 rounded text-[9px] shadow-sm"
                                >
                                  ✕ Rechazar
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedReservationId(r.id);
                                setIsFolioOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
                            >
                              Liquidar Saldo
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: SUB-CANCHAS & TARIFAS */}
        {activeTab === 'canchas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fields.map(f => (
              <div key={f.id} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {f.sport_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-black text-white mt-2">{f.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                    {f.is_active ? 'Activa' : 'Suspendida'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarifa Valle:</span>
                    <span className="font-bold text-white">${Number(f.default_price_per_hour).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarifa Pico:</span>
                    <span className="font-black text-emerald-400">${Number(f.peak_price_per_hour).toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fin de Semana:</span>
                    <span className="font-bold text-amber-300">${Number(f.weekend_price_per_hour || f.default_price_per_hour).toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PESTAÑA 3: CIERRE DE CAJA & ARQUEO */}
        {activeTab === 'caja' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Efectivo en Caja Física</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">${Number(shift?.expected_cash || 165000).toLocaleString('es-CO')} COP</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Base + Cobros en mostrador</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Pagos Digitales (Nequi/PSE)</span>
                <p className="text-2xl font-black text-blue-400 mt-1">${Number(shift?.total_electronic_sales || 120000).toLocaleString('es-CO')} COP</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Transferencias verificadas</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Total Recaudado en Turno</span>
                <p className="text-2xl font-black text-white mt-1">${(Number(shift?.expected_cash || 165000) - 100000 + Number(shift?.total_electronic_sales || 120000)).toLocaleString('es-CO')} COP</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Canchas + Cafetería</p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: MEDIOS DE PAGO SEDE */}
        {activeTab === 'pagos' && (
          <form onSubmit={handleSavePaymentSettings} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 max-w-2xl space-y-4 text-xs">
            <h3 className="text-base font-black text-white border-b border-slate-800 pb-2">
              Configuración de Cuentas Propias de la Sede
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Número de Nequi</label>
                <input
                  type="tel"
                  value={paymentSettings.nequi_number}
                  onChange={e => setPaymentSettings({ ...paymentSettings, nequi_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Titular Nequi</label>
                <input
                  type="text"
                  value={paymentSettings.nequi_holder}
                  onChange={e => setPaymentSettings({ ...paymentSettings, nequi_holder: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Número Daviplata</label>
                <input
                  type="tel"
                  value={paymentSettings.daviplata_number}
                  onChange={e => setPaymentSettings({ ...paymentSettings, daviplata_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-bold">Cuenta Bancolombia / Bre-B</label>
                <input
                  type="text"
                  value={paymentSettings.bancolombia_number}
                  onChange={e => setPaymentSettings({ ...paymentSettings, bancolombia_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPayments}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition disabled:opacity-50"
              >
                {isSavingPayments ? 'Guardando...' : 'Guardar Cuentas de la Sede'}
              </button>
            </div>
          </form>
        )}

        {/* PESTAÑA 5: RECORDATORIOS & REPORTES */}
        {activeTab === 'notificaciones' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 max-w-2xl space-y-5 text-xs">
            <h3 className="text-base font-black text-white border-b border-slate-800 pb-2">
              Motor de Notificaciones & Telegram Bot
            </h3>

            <div>
              <label className="text-slate-400 block mb-1 font-bold">Telegram Chat ID de la Sede (Opcional)</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                placeholder="Ej: 123456789"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Recibe alertas en vivo de abonos subidos, liquidación de canchas y no-shows directamente en tu Telegram.
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 block font-bold">Simular Envíos Automáticos de Recordatorio:</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSimulateReminder('24h')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  📨 Recordatorio 24h Previas
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateReminder('2h')}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition"
                >
                  ⏰ Recordatorio 2h Previas
                </button>
              </div>
            </div>

            {reminderStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                {reminderStatus}
              </div>
            )}
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
            loadAllData();
          }}
        />
      )}

    </div>
  );
}
