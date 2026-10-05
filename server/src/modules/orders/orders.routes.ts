import { Router } from 'express';
import { convertQuoteToOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats, trackOrder } from './orders.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';

const router = Router();

// Public: anyone holding an order ID can check its progress. Limited per IP because
// order numbers are sequential and could otherwise be enumerated.
const trackOrderLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many tracking requests. Please wait a few minutes and try again.',
});
router.get('/track/:orderNumber', trackOrderLimiter, trackOrder);

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
