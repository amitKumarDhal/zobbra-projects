import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductStats,
  duplicateProduct,
  bulkDeleteProducts,
  getCustomizerTemplatesHandler,
  getCustomizerTemplateByIdHandler,
  createCustomizerTemplateHandler,
  updateCustomizerTemplateHandler,
  setCustomizerTemplateStatusHandler,
} from './products.controller.js';
import { authenticateJWT, authorizeRoles, optionalAuth } from '../../middleware/auth.js';

const router = Router();

// Public reads. optionalAuth only identifies staff so they can also see hidden products;
// everyone else (guests, customers) is limited to active products in the controller.
router.get('/', optionalAuth, getProducts);
router.get('/stats', getProductStats);
router.get('/categories', getCategories);
router.get('/customizer-templates', optionalAuth, getCustomizerTemplatesHandler);
router.get('/customizer-templates/:id', getCustomizerTemplateByIdHandler);
router.post('/customizer-templates', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), createCustomizerTemplateHandler);
router.put('/customizer-templates/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateCustomizerTemplateHandler);
router.patch('/customizer-templates/:id/status', authenticateJWT, authorizeRoles('ADMIN'), setCustomizerTemplateStatusHandler);
router.get('/:slug', optionalAuth, getProductBySlug);
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateProduct);
router.post('/:id/duplicate', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), duplicateProduct);
router.delete('/bulk', authenticateJWT, authorizeRoles('ADMIN'), bulkDeleteProducts);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteProduct);

export default router;
