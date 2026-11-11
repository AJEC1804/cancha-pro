// ============================================================
// CANCHA PRO — Supabase Client & PostgreSQL Integration
// Maneja la conexión a Supabase con Resiliencia y Fallback Local
// ============================================================
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let isConfigured = false;

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    isConfigured = true;
    console.log(`🌲 [SUPABASE] Cliente inicializado para: ${supabaseUrl}`);
  } catch (err) {
    console.warn(`⚠️ [SUPABASE] Error al inicializar cliente: ${err.message}. Operando en modo memoria.`);
  }
} else {
  console.log(`ℹ️ [SUPABASE] Variables SUPABASE_URL / SUPABASE_ANON_KEY no configuradas aún. Operando con almacén local de alta disponibilidad.`);
}

/**
 * Función para probar conectividad en vivo con Supabase
 */
async function testConnection() {
  if (!supabase || !isConfigured) {
    return {
      connected: false,
      configured: false,
      provider: 'in_memory_engine',
      message: 'Operando con almacén de datos local reactivo (En memoria / Fallback).',
      url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1***') : null
    };
  }

  try {
    const { data, error } = await supabase.from('venues').select('id, name').limit(1);
    if (error) {
      return {
        connected: false,
        configured: true,
        provider: 'supabase_cloud',
        error: error.message,
        message: `Error al consultar Supabase: ${error.message}`
      };
    }
    return {
      connected: true,
      configured: true,
      provider: 'supabase_cloud',
      message: 'Conectado exitosamente a Supabase PostgreSQL en la nube.',
      venuesCount: data ? data.length : 0,
      url: supabaseUrl.replace(/^(https?:\/\/[^.]+).*/, '$1***')
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      provider: 'in_memory_engine',
      error: err.message,
      message: `Fallo de red o DNS hacia Supabase: ${err.message}. Se mantiene fallback activo.`
    };
  }
}

/**
 * Permite reconfigurar dinámicamente las credenciales en caliente
 */
function configureClient(url, key) {
  if (!url || !key) return false;
  try {
    supabase = createClient(url, key, { auth: { persistSession: false } });
    isConfigured = true;
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  getSupabase: () => supabase,
  isConfigured: () => isConfigured,
  testConnection,
  configureClient
};
