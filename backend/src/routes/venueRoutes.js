// ============================================================
// CANCHA PRO — Venue & Field Routes (Multi-Tenancy)
// ============================================================
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { authenticate, requireRoles, requireVenueAccess } = require('../middleware/auth');

// Públicos
router.get('/', venueController.listVenues);
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
