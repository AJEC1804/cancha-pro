'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Venue, Field } from '../../types/canchapro';

interface SaasPlan {
  id: string;
  name: string;
  max_fields: number;
  monthly_price: number;
  features: string[];
}

interface SaasBillingRecord {
  venue_id: string;
  venue_name: string;
  slug: string;
  city: string;
  fields_count: number;
  saas_plan_name: string;
  saas_monthly_fee: number;
  saas_status: 'al_dia' | 'por_vencer' | 'en_mora';
  saas_next_billing: string;
  is_active: boolean;
}

export default function SuperadminPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [billingRecords, setBillingRecords] = useState<SaasBillingRecord[]>([]);
  const [totalFields, setTotalFields] = useState<number>(0);
  const [totalMrr, setTotalMrr] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal Crear Sede
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    city: 'Cartagena',
    phone: '',
    address: '',
    logo_url: '',
    primary_color: '#1e3a8a',
    secondary_color: '#facc15',
    admin_name: '',
    admin_email: '',
    admin_password: 'admin123',
    default_sport_type: 'futbol_5',
    initial_field_name: 'Cancha 1 Principal'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const superAdminToken = 'demo-user-b0000000-0000-0000-0000-000000000001';

  const loadData = async () => {
    try {
      setLoading(true);
      const [resVenues, resBilling] = await Promise.all([
        fetch('/api/venues', { headers: { 'Authorization': `Bearer ${superAdminToken}` } }),
        fetch('/api/venues/saas/billing', { headers: { 'Authorization': `Bearer ${superAdminToken}` } })
      ]);

      const dataVenues = await resVenues.json();
      const dataBilling = await resBilling.json();

      if (dataVenues.success && Array.isArray(dataVenues.venues)) {
        setVenues(dataVenues.venues);
        const countFields = dataVenues.venues.reduce((acc: number, v: any) => acc + (v.fields ? v.fields.length : 0), 0);
        setTotalFields(countFields);
      }

      if (dataBilling.success && dataBilling.overview) {
        setPlans(dataBilling.overview.plans || []);
        setBillingRecords(dataBilling.overview.billing || dataBilling.overview.venues || []);
        setTotalMrr(dataBilling.overview.mrr || 947000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (venueId: string, currentStatus: boolean) => {
    try {
      setActionLoadingId(venueId);
      const res = await fetch(`/api/venues/${venueId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Error al cambiar estado.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${superAdminToken}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Complejo "${formData.name}" creado con éxito.`);
        setIsModalOpen(false);
        setFormData({
          name: '',
          slug: '',
          city: 'Cartagena',
          phone: '',
          address: '',
          logo_url: '',
          primary_color: '#1e3a8a',
          secondary_color: '#facc15',
          admin_name: '',
          admin_email: '',
          admin_password: 'admin123',
          default_sport_type: 'futbol_5',
          initial_field_name: 'Cancha 1 Principal'
        });
        await loadData();
      } else {
        alert(data.error || 'Error al crear complejo.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Topbar SuperAdmin */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="font-black text-xl text-white">
              CANCHA<span className="text-purple-400">PRO</span>
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-xs bg-purple-500/10 text-purple-400 font-black px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Torre de Control SuperAdmin
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-900 transition"
            >
              Volver a Inicio
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* Banner y Métricas Globales */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Torre de Control SaaS</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Gestión multi-tenant de complejos deportivos, estados de suscripción y facturación en Colombia.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-2xl text-xs shadow-lg shadow-purple-600/20 transition flex items-center space-x-2"
            >
              <span>➕ Nuevo Complejo Deportivo</span>
            </button>
          </div>

          {/* KPIs Globales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Complejos Registrados</span>
              <p className="text-2xl font-black text-white mt-1">{venues.length} Sedes</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">{venues.filter(v => v.is_active).length} Activas</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Canchas en el Sistema</span>
              <p className="text-2xl font-black text-white mt-1">{totalFields} Canchas</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Calculado en tiempo real</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">MRR Recurrente SaaS</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">${totalMrr.toLocaleString('es-CO')} COP</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Suscripciones mensuales</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Comisión x Partido</span>
              <p className="text-2xl font-black text-teal-400 mt-1">$0 COP</p>
              <p className="text-[11px] text-slate-400 mt-0.5">100% de ingresos para la sede</p>
            </div>
          </div>
        </div>

        {/* MÓDULO 1: GESTIÓN DE COMPLEJOS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Complejos Deportivos Conectados</h2>
              <p className="text-xs text-slate-400">Cada complejo opera en su ruta aislada <code>/sede/[slug]</code>.</p>
            </div>

            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o slug..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 w-full sm:w-72 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVenues.map(venue => {
              const isLoading = actionLoadingId === venue.id;
              return (
                <div
                  key={venue.id}
                  className={`bg-slate-900/70 border ${
                    venue.is_active ? 'border-slate-800' : 'border-red-500/40 bg-red-950/10'
                  } rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                        {venue.city}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        venue.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {venue.is_active ? '✓ Activa' : '✕ Suspendida'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white">{venue.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">/sede/{venue.slug}</p>
                      <p className="text-xs text-slate-500 mt-1">{venue.address}</p>
                    </div>

                    <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan SaaS:</span>
                        <span className="font-bold text-white capitalize">{venue.saas_plan || 'Pro'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Teléfono:</span>
                        <span className="text-slate-300 font-mono">{venue.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800/80">
                    <Link
                      href={`/sede/${venue.slug}`}
                      className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 transition"
                    >
                      Ver Portal Sede
                    </Link>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleStatus(venue.id, venue.is_active)}
                      className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition ${
                        venue.is_active
                          ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      } disabled:opacity-50`}
                    >
                      {isLoading ? 'Guardando...' : venue.is_active ? 'Suspender Sede' : 'Activar Sede'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MÓDULO 2: PLANES Y FACTURACIÓN SAAS */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white">Planes Comerciales & Facturación Mensual</h2>
            <p className="text-xs text-slate-400">
              Control de recaudos mensuales por complejo. Estado al día, por vencer o en mora.
            </p>
          </div>

          {/* Tabla de Facturación */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Complejo Deportivo</th>
                    <th className="p-3.5">Plan Contratado</th>
                    <th className="p-3.5 text-center">Canchas</th>
                    <th className="p-3.5 text-right">Tarifa Mensual</th>
                    <th className="p-3.5 text-center">Estado Cobro</th>
                    <th className="p-3.5 text-right">Próximo Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {billingRecords.map(b => (
                    <tr key={b.venue_id} className="hover:bg-slate-900/40">
                      <td className="p-3.5 font-bold text-white">
                        <span>{b.venue_name}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">{b.city} • /sede/{b.slug}</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{b.saas_plan_name}</td>
                      <td className="p-3.5 text-center font-bold text-slate-200">{b.fields_count}</td>
                      <td className="p-3.5 text-right font-black text-emerald-400">
                        ${Number(b.saas_monthly_fee).toLocaleString('es-CO')} COP
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          b.saas_status === 'al_dia' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          b.saas_status === 'por_vencer' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {b.saas_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-400 font-mono">{b.saas_next_billing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {/* Modal Nuevo Complejo Deportivo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">🏢 Alta de Nuevo Complejo Deportivo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateVenueSubmit} className="space-y-4 text-xs">
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-purple-400 block">1. Datos del Complejo</span>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Nombre del Complejo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Canchas El Monumental"
                    value={formData.name}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                      setFormData({ ...formData, name, slug });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Slug URL</label>
                    <input
                      type="text"
                      required
                      placeholder="el-monumental"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Ciudad</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Color Primario</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.primary_color}
                        onChange={e => setFormData({ ...formData, primary_color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-slate-300">{formData.primary_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Color Secundario</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.secondary_color}
                        onChange={e => setFormData({ ...formData, secondary_color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-slate-300">{formData.secondary_color}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="3001234567"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Dirección Completa</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle 123 # 45-67"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-black text-purple-400 block">2. Dueño / Administrador de la Sede</span>
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Correo del Dueño</label>
                  <input
                    type="email"
                    required
                    placeholder="dueno@complejo.com"
                    value={formData.admin_email}
                    onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <span className="text-[10px] uppercase font-black text-purple-400 block">3. Cancha Inicial</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Nombre Cancha 1</label>
                    <input
                      type="text"
                      value={formData.initial_field_name}
                      onChange={e => setFormData({ ...formData, initial_field_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Deporte</label>
                    <select
                      value={formData.default_sport_type}
                      onChange={e => setFormData({ ...formData, default_sport_type: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="futbol_5">Fútbol 5</option>
                      <option value="futbol_7">Fútbol 7</option>
                      <option value="padel">Pádel</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creando Sede...' : 'Crear Sede y Vincular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
