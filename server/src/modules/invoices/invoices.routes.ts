import { Router } from 'express';
import { authenticateJWT } from '../../middleware/auth.js';
import { getInvoices, getInvoiceById, downloadInvoicePdf } from './invoices.controller.js';

const router = Router();

// All invoice routes require authentication
router.use(authenticateJWT);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePdf);

export default router;
