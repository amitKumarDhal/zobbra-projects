import { Router } from 'express';
import { InquiryController } from './inquiries.controller.js';
import { authenticateJWT, authorizeRoles, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/inquiries/stats - Must be before /:id
router.get('/stats', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.getStats);

// Customers can view their own inquiries
router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES', 'CUSTOMER'), InquiryController.getAll);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES', 'CUSTOMER'), InquiryController.getById);

router.post('/', optionalAuth, InquiryController.create);

router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.update);
router.patch('/:id/status', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.updateStatus);
router.patch('/:id/assign', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.assign);

router.post('/:id/activity', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.addActivity);
router.post('/:id/whatsapp', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.generateWhatsappLink);
router.post('/:id/convert-to-quote', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.convertToQuote);
router.post('/:id/approve', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.approve);
router.post('/:id/reject', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), InquiryController.reject);

export default router;
