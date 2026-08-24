import { Router } from 'express';
import { convertQuoteToOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats } from './orders.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', getOrderStats);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/from-quote/:quoteId', convertQuoteToOrder);
router.post('/convert', convertQuoteToOrder);
router.patch('/:id/status', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), updateOrderStatus);
router.put('/:id/status', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), updateOrderStatus);
router.put('/:id', authorizeRoles('ADMIN', 'SALES', 'PRODUCTION'), updateOrderStatus);

export default router;
