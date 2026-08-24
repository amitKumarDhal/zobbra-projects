import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.js';
import { createRazorpayOrder, verifyPayment, handleWebhook, getPayments, getPaymentStats, getPaymentById, recordManualPayment } from './payments.controller.js';
import { authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Create Razorpay Order (Auth Required)
router.post('/create-order', authenticateJWT, createRazorpayOrder);

// Verify Razorpay Signature & Update Payment Status (Auth Required)
router.post('/verify', authenticateJWT, verifyPayment);

// Webhook endpoint (Public endpoint verified via signature)
router.post('/webhook', handleWebhook);

// Administrative Endpoints (Auth & Role Required)
router.get('/stats', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getPaymentStats);
router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getPayments);
router.post('/record', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), recordManualPayment);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getPaymentById);

export default router;

