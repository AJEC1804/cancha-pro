'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedFolio } from '../types/canchapro';

interface UnifiedFolioModalProps {
  reservationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSettled?: (folio: UnifiedFolio) => void;
  token?: string;
}

export const UnifiedFolioModal: React.FC<UnifiedFolioModalProps> = ({
  reservationId,
  isOpen,
  onClose,
  onSettled,
  token
}) => {
  const [folio, setFolio] = useState<UnifiedFolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'nequi' | 'wompi' | 'pago_mixto'>('efectivo');
  const [equipmentReturned, setEquipmentReturned] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados para pago mixto
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [mixedDigital, setMixedDigital] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !reservationId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/reservations/${reservationId}/folio`, { headers })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.success && data.folio) {
          setFolio(data.folio);
          setEquipmentReturned(data.folio.equipment_returned ?? true);
          setMixedCash(Math.floor(data.folio.grand_total_due / 2));
          setMixedDigital(data.folio.grand_total_due - Math.floor(data.folio.grand_total_due / 2));
        } else {
          setError(data.error || 'No se pudo cargar la información del folio.');
        }
      })
      .catch(err => {
        if (isMounted) setError('Error de comunicación con el servidor.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, reservationId, token]);

  if (!isOpen) return null;

  const handleSettle = async () => {
    if (!folio) return;

    if (paymentMethod === 'pago_mixto') {
      const sum = Number(mixedCash) + Number(mixedDigital);
      if (sum !== folio.grand_total_due) {
        alert(`La suma del efectivo ($${mixedCash.toLocaleString()}) y digital ($${mixedDigital.toLocaleString()}) debe ser igual al total exacto ($${folio.grand_total_due.toLocaleString()}).`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/reservations/${folio.reservation_id}/settle-folio`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          payment_method: paymentMethod,
          equipment_returned: equipmentReturned,
          mixed_cash: paymentMethod === 'pago_mixto' ? mixedCash : undefined,
          mixed_digital: paymentMethod === 'pago_mixto' ? mixedDigital : undefined
        })
      });

      const data = await res.json();
      if (data.success && data.folio) {
        setFolio(data.folio);
        if (onSettled) onSettled(data.folio);
        alert('✅ Cuenta liquidada y registrada en caja con éxito.');
        onClose();
      } else {
        alert(data.error || 'No se pudo liquidar la cuenta.');
      }
    } catch (e) {
      alert('Error al liquidar el folio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allCafeteriaItems = folio?.cafeteria_orders?.flatMap(o => o.items) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-400 font-black px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Folio Único Oficial
              </span>
              <span className="text-xs text-slate-400 font-mono">#{reservationId}</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">Liquidación Unificada de Turno</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {loading && (
            <div className="py-12 text-center text-slate-400">
              <span className="inline-block animate-spin mr-2">⏳</span> Cargando estado unificado del folio...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center">
              {error}
            </div>
          )}

          {folio && !loading && (
            <>
              {/* Información General */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Cancha & Sede</span>
                  <span className="font-bold text-white text-xs">{folio.field_name}</span>
                  <span className="text-[10px] text-slate-400 block">{folio.venue_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Cliente Responsable</span>
                  <span className="font-bold text-white text-xs">{folio.client_name}</span>
                  <span className="text-[10px] text-emerald-400 block font-mono">{folio.client_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Fecha & Horario</span>
                  <span className="font-bold text-slate-300 text-xs">{folio.booking_date} • {folio.start_time} - {folio.end_time}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Estado de Balón/Petos</span>
                  <label className="inline-flex items-center space-x-2 mt-0.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={equipmentReturned} 
                      onChange={e => setEquipmentReturned(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                    />
                    <span className="text-xs text-slate-300">Implementos devueltos</span>
                  </label>
                </div>
              </div>

              {/* 1. Desglose de Cancha */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">1. Alquiler de Cancha</h4>
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tarifa total turno (1 hora)</span>
                    <span className="font-bold text-white">${folio.court_price.toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-400">Abono previo pagado</span>
                    <span className="font-bold text-emerald-400">-${folio.court_deposit_paid.toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-xs font-black">
                    <span className="text-slate-300">Saldo pendiente cancha</span>
                    <span className="text-amber-400">${folio.court_pending_balance.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>
              </div>

              {/* 2. Desglose Cafetería / Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">2. Consumos Cafetería / Bar</h4>
                  <span className="text-[10px] font-bold text-amber-400">Total Bar: ${folio.cafeteria_total_amount.toLocaleString('es-CO')} COP</span>
                </div>
                
                {allCafeteriaItems.length === 0 ? (
                  <div className="p-3 bg-slate-950/20 border border-slate-800/40 rounded-xl text-center text-xs text-slate-500">
                    Sin consumos de cafetería cargados a este turno.
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl divide-y divide-slate-800/60 overflow-hidden text-xs">
                    {allCafeteriaItems.map((item, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200 block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.quantity} x ${item.unit_price.toLocaleString('es-CO')}</span>
                        </div>
                        <span className="font-bold text-amber-300">${item.subtotal.toLocaleString('es-CO')} COP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Neto a Liquidar */}
              <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">Total Neto a Liquidar</span>
                  <span className="text-[11px] text-slate-400">Saldo cancha + Consumos de bar</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">
                    ${folio.grand_total_due.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">COP</span>
                </div>
              </div>

              {/* Selector de Medios de Pago */}
              {folio.grand_total_due > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                    Seleccionar Medio de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('efectivo')}
                      className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 ${
                        paymentMethod === 'efectivo' 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>💵</span>
                      <span>Efectivo en Caja</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('nequi')}
                      className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 ${
                        paymentMethod === 'nequi' 
                          ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>📱</span>
                      <span>Nequi / Daviplata</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wompi')}
                      className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 ${
                        paymentMethod === 'wompi' 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>💳</span>
                      <span>Wompi / PSE / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pago_mixto')}
                      className={`p-3 rounded-xl border text-left font-bold transition flex items-center space-x-2 ${
                        paymentMethod === 'pago_mixto' 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>⚖️</span>
                      <span>Pago Mixto</span>
                    </button>
                  </div>

                  {/* Campos si es pago mixto */}
                  {paymentMethod === 'pago_mixto' && (
                    <div className="p-3 bg-slate-950/60 border border-amber-500/20 rounded-xl space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monto en Efectivo</label>
                          <input 
                            type="number"
                            value={mixedCash}
                            onChange={e => setMixedCash(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Monto Digital (Nequi/PSE)</label>
                          <input 
                            type="number"
                            value={mixedDigital}
                            onChange={e => setMixedDigital(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                      </div>
                      <div className="text-[11px] text-right text-slate-400">
                        Suma: ${(Number(mixedCash) + Number(mixedDigital)).toLocaleString('es-CO')} / ${folio.grand_total_due.toLocaleString('es-CO')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Acciones */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cerrar
          </button>

          {folio && folio.grand_total_due > 0 && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSettle}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando en Caja...' : `Cobrar $${folio.grand_total_due.toLocaleString('es-CO')} COP`}
            </button>
          )}

          {folio && folio.grand_total_due === 0 && (
            <div className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
              <span>✓</span>
              <span>Turno 100% Saldado y Cerrado</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
