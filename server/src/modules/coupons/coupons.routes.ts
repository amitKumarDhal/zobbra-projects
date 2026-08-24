import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';
import { getCoupons, getCouponStats, getCouponById, createCoupon, updateCoupon, deleteCoupon } from './coupons.controller.js';

const router = Router();

// Secure all endpoints to ADMIN and SALES
router.use(authenticateJWT, authorizeRoles('ADMIN', 'SALES'));

router.get('/stats', getCouponStats);
router.get('/', getCoupons);
router.get('/:id', getCouponById);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
