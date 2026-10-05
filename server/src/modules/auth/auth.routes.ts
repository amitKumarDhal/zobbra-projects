import { Router } from 'express';
import {
  register,
  login,
  getMe,
  forgotPassword,
  changePassword,
  loginSchema,
  requestLoginOtp,
  verifyLoginOtp,
  otpRequestSchema,
  otpVerifySchema,
  updateProfile,
  updateProfileSchema,
} from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { config } from '../../config/index.js';

export const otpRequestLimiter = createRateLimiter({
  windowMs: config.otp.ipWindowSeconds * 1000,
  max: config.otp.ipRequestLimit,
  message: 'Too many code requests. Please wait a few minutes and try again.',
});

export const otpVerifyLimiter = createRateLimiter({
  windowMs: config.otp.ipWindowSeconds * 1000,
  max: config.otp.ipVerifyLimit,
  message: 'Too many verification attempts. Please wait a few minutes and try again.',
});

const router = Router();

// Retired: returns 410 — non-admin accounts are created by WhatsApp OTP verification
router.post('/register', register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/otp/request', otpRequestLimiter, validateRequest(otpRequestSchema), requestLoginOtp);
router.post('/otp/verify', otpVerifyLimiter, validateRequest(otpVerifySchema), verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', authenticateJWT, changePassword);
router.get('/me', authenticateJWT, getMe);
router.put('/me', authenticateJWT, validateRequest(updateProfileSchema), updateProfile);

export default router;
