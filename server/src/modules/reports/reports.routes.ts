import { Router } from 'express';
import { getDashboardKPIs, getSalesReport } from './reports.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);
router.get('/kpis', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), getDashboardKPIs);
router.get('/sales', authorizeRoles('ADMIN', 'SALES'), getSalesReport);

export default router;
