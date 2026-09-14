import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, getCustomerStats, deleteCustomer, bulkDeleteCustomers } from './customers.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);
router.get('/stats', authorizeRoles('ADMIN', 'SALES'), getCustomerStats);
router.get('/', authorizeRoles('ADMIN', 'SALES'), getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES'), getCustomerById);
router.post('/', authorizeRoles('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), updateCustomer);
router.delete('/bulk', authorizeRoles('ADMIN'), bulkDeleteCustomers);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

export default router;
