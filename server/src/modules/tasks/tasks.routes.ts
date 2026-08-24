import { Router } from 'express';
import { getTasks, getTaskStats, getTaskById, createTask, updateTask, updateTaskStatus, updateTaskAssignee, deleteTask } from './tasks.controller.js';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.js';

const router = Router();

router.get('/stats', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getTaskStats);
router.get('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getTasks);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), getTaskById);

router.post('/', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), createTask);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateTask);

router.patch('/:id/status', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateTaskStatus);
router.patch('/:id/assign', authenticateJWT, authorizeRoles('ADMIN', 'SALES'), updateTaskAssignee);

router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteTask);

export default router;
