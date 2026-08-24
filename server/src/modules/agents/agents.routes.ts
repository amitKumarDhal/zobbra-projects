import { Router } from 'express';
import { getAgents, getAgentStats, getAgentById, updateAgent } from './agents.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getAgentStats);
router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getAgents);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getAgentById);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), updateAgent);

export default router;
