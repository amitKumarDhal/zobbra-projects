import { Router } from 'express';
import { InquiryController } from './inquiries.controller.js';
import { authenticateJWT, authorizeRoles, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/inquiries/stats - Must be before /:id
router.get('/stats', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.getStats);

router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.getAll);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.getById);

router.post('/', optionalAuth, InquiryController.create);

router.patch('/:id/status', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.updateStatus);
router.patch('/:id/assign', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.assign);

router.post('/:id/activity', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.addActivity);
router.post('/:id/whatsapp', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.generateWhatsappLink);
router.post('/:id/convert-to-quote', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.convertToQuote);

export default router;
