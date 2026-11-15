// ============================================================
// CANCHA PRO — Venue & Field Routes (Multi-Tenancy)
// ============================================================
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { authenticate, requireRoles, requireVenueAccess } = require('../middleware/auth');

// Públicos
router.get('/', venueController.listVenues);
router.get('/by-slug/:slug', venueController.getVenueBySlug);

// SaaS Billing y Planes (Superadmin)
router.get('/saas/billing', authenticate, requireRoles('superadmin'), venueController.getSaasBilling);
router.post('/saas/billing/:id/pay', authenticate, requireRoles('superadmin'), venueController.paySaasSubscription);

// Medios de Pago de la Sede
router.get('/:id/payment-methods', venueController.getPaymentMethods);
router.put('/:id/payment-methods', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.updatePaymentMethods);

// Clientes, Cuentas por Cobrar y Reportes de Turno (Admin Sede)
router.get('/:id/clients', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.getClientsAndReceivables);
router.get('/:id/shifts/history', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.getShiftsHistory);

router.get('/:id', venueController.getVenue);

// Gestión de sedes por Superadmin
router.post('/', authenticate, requireRoles('superadmin'), venueController.createVenue);
router.put('/:id', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.updateVenue);
router.patch('/:id/toggle', authenticate, requireRoles('superadmin'), venueController.toggleVenueStatus);

// Personal de la sede (Cancheros / Empleados)
router.get('/:venueId/staff', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.listStaff);
router.post('/:venueId/staff', authenticate, requireRoles('superadmin', 'tenant_admin'), requireVenueAccess, venueController.createStaff);

// Canchas (CRUD Completo y Activar/Desactivar para Superadmin y Tenant Admin)
router.get('/fields/all', authenticate, requireRoles('superadmin', 'tenant_admin'), venueController.listAllFields);
router.post('/fields', authenticate, requireRoles('superadmin', 'tenant_admin'), venueController.createField);
router.put('/fields/:id', authenticate, requireRoles('superadmin', 'tenant_admin'), venueController.updateField);
router.patch('/fields/:id/toggle', authenticate, requireRoles('superadmin', 'tenant_admin'), venueController.toggleFieldStatus);
router.delete('/fields/:id', authenticate, requireRoles('superadmin'), venueController.deleteField);

module.exports = router;
