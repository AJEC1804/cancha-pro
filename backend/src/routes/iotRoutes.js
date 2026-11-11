// ============================================================
// CANCHA PRO — IoT Lighting Routes
// ============================================================
const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');
const { authenticate, requireRoles } = require('../middleware/auth');

router.post('/lighting/switch', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), iotController.switchCourtLighting);
router.get('/lighting/logs', authenticate, requireRoles('superadmin', 'tenant_admin', 'staff'), iotController.getIotLogs);

module.exports = router;
