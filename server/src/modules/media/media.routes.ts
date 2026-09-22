import { Router } from 'express';
import { getSignature, getGuestSignature, deleteMedia } from './media.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Guest signature for design assets/previews strictly scoped to zobbra/designs
router.get('/guest-signature', getGuestSignature);

// Customers need to upload artwork references for quotes, so they need signature access.
// Deletion remains restricted to ADMIN and SALES to prevent abuse.
router.get('/signature', authenticateJWT, authorizeRoles('ADMIN', 'SALES', 'CUSTOMER'), getSignature);
router.delete('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), deleteMedia);

export default router;
