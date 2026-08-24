import { Router } from 'express';
import { getCMSContent, createCMSContent } from './cms.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.get('/', getCMSContent);
router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createCMSContent);

export default router;
