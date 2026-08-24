import { Router } from 'express';
import {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  editQuote,
  addQuoteActivity,
  triggerWhatsAppAction,
  downloadQuotePDF,
  emailQuote,
  getQuoteStats,
  applyCoupon,
  removeCoupon,
  calculateQuotePricing
} from './quotes.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);

router.get('/stats', getQuoteStats);
router.get('/', getQuotes);
router.post('/calculate', authorizeRoles('ADMIN', 'SALES'), calculateQuotePricing);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), editQuote);
router.patch('/:id', authorizeRoles('ADMIN', 'SALES'), editQuote);
router.patch('/:id/edit', authorizeRoles('ADMIN', 'SALES'), editQuote);
router.put('/:id/status', updateQuoteStatus);
router.patch('/:id/status', updateQuoteStatus);

router.post('/:id/activity', authorizeRoles('ADMIN', 'SALES'), addQuoteActivity);
router.post('/:id/whatsapp', authorizeRoles('ADMIN', 'SALES'), triggerWhatsAppAction);
router.get('/:id/pdf', downloadQuotePDF);
router.post('/:id/email', emailQuote);

router.post('/:id/apply-coupon', applyCoupon);
router.post('/:id/remove-coupon', removeCoupon);

export default router;
