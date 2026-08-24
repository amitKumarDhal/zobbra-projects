import { Router } from 'express';
import { createDispatch, getDispatches, trackShipment } from './dispatch.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.get('/track/:shipmentNumber', trackShipment);

router.use(authenticateJWT);
router.get('/', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), getDispatches);
router.post('/', authorizeRoles('ADMIN', 'PRODUCTION'), createDispatch);

export default router;
