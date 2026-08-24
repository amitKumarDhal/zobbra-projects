import { Router } from 'express';
import { getSettings, updateSettings, getUsers, getSystemInfo, getHealth, getActivityLog } from './settings.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT, authorizeRoles('ADMIN'));
router.get('/', getSettings);
router.post('/', updateSettings);
router.get('/users', getUsers);
router.get('/info', getSystemInfo);
router.get('/health', getHealth);
router.get('/activity', getActivityLog);

export default router;
