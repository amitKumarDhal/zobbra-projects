import { Router } from 'express';
import { register, login, getMe, forgotPassword, changePassword, registerSchema, loginSchema } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateJWT } from '../../middleware/auth.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', authenticateJWT, changePassword);
router.get('/me', authenticateJWT, getMe);

export default router;
