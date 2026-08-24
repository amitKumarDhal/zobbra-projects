import { Router } from 'express';
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getCategories, getProductStats, duplicateProduct } from './products.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/stats', getProductStats);
router.get('/categories', getCategories);
router.get('/:slug', getProductBySlug);
router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), createProduct);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateProduct);
router.post('/:id/duplicate', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), duplicateProduct);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteProduct);

export default router;
