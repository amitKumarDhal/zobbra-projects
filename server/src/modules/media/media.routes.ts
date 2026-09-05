import { Router } from 'express';
import { getSignature, deleteMedia } from './media.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

// Only ADMIN and SALES should upload/delete media to avoid abuse
router.get('/signature', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getSignature);
router.delete('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), deleteMedia);

export default router;
