// ============================================================
// CANCHA PRO — POS Cafetería & Inventario Routes
// ============================================================
const express = require('express');
const router = express.Router();
const posController = require('../controllers/posController');
const { authenticate, requireRoles } = require('../middleware/auth');

// Productos
router.get('/products', posController.listProducts);
router.post('/products', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), posController.createProduct);

// Órdenes de Cafetería ("Cargar a Cancha X")
router.post('/orders', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), posController.createOrder);

// Checkout Unificado (50% restante de Cancha + Cafetería + Check de Implementos + Pagos Mixtos)
router.post('/checkout-unified', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), posController.checkoutUnifiedTab);

// Arqueo de caja
router.get('/shift', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), posController.getActiveShift);
router.post('/shift/close', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), posController.closeShift);

module.exports = router;
