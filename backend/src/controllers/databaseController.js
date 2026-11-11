// ============================================================
// CANCHA PRO — Database & Supabase Controller
// ============================================================
const supabaseClient = require('../config/supabaseClient');
const db = require('../config/database');

const databaseController = {
  // GET /api/database/status
  getStatus: async (req, res, next) => {
    try {
      const conn = await supabaseClient.testConnection();
      res.json({
        success: true,
        data: {
          ...conn,
          localStats: {
            venues: db.store.venues.length,
            fields: db.store.fields.length,
            users: db.store.users.length,
            reservations: db.store.reservations.length,
            posProducts: db.store.pos_products.length
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/database/configure
  configure: async (req, res, next) => {
    try {
      const { supabaseUrl, supabaseKey } = req.body;
      if (!supabaseUrl || !supabaseKey) {
        return res.status(400).json({
          success: false,
          error: 'supabaseUrl y supabaseKey son requeridos.'
        });
      }

      const configured = supabaseClient.configureClient(supabaseUrl, supabaseKey);
      if (!configured) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo inicializar el cliente de Supabase con los parámetros suministrados.'
        });
      }

      const testResult = await supabaseClient.testConnection();
      res.json({
        success: true,
        message: 'Credenciales de Supabase actualizadas.',
        data: testResult
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = databaseController;
