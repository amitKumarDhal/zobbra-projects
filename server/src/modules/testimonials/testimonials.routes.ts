import { Router } from 'express';
import { 
  getTestimonials, 
  getTestimonialStats, 
  getTestimonialById, 
  createTestimonial, 
  updateTestimonial, 
  updateTestimonialStatus, 
  deleteTestimonial 
} from './testimonials.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
const router = Router();

// Stats should come before /:id to prevent routing issues
router.get('/stats', authenticateJWT, getTestimonialStats);

router.get('/', getTestimonials); // Public can access if they filter by PUBLISHED, or auth'd users can access all
router.get('/:id', getTestimonialById);

// Protected routes (Admin / Sales)
router.post('/', authenticateJWT, createTestimonial);
router.put('/:id', authenticateJWT, updateTestimonial);
router.patch('/:id/status', authenticateJWT, updateTestimonialStatus);
router.delete('/:id', authenticateJWT, deleteTestimonial);

export default router;
