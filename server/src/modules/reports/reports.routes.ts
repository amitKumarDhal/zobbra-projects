import { Router } from 'express';
import { getDashboardKPIs, getSalesReport, getSidebarCounts } from './reports.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);
router.get('/kpis', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), getDashboardKPIs);
router.get('/sales', authorizeRoles('ADMIN', 'SALES'), getSalesReport);
router.get('/sidebar-counts', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), getSidebarCounts);

export default router;
