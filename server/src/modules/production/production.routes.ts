import { Router } from 'express';
import { getKanbanJobs, updateJobStage } from './production.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.use(authenticateJWT);
router.get('/kanban', authorizeRoles('ADMIN', 'PRODUCTION', 'SALES'), getKanbanJobs);
router.put('/:id/stage', authorizeRoles('ADMIN', 'PRODUCTION'), updateJobStage);

export default router;
