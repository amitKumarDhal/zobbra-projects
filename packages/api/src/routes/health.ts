import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @openapi
 * /:
 *   get:
 *     summary: API Root Status
 *     responses:
 *       200:
 *         description: API is running.
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Zobra API',
    status: 'running',
  });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health Check Endpoint
 *     responses:
 *       200:
 *         description: Service is healthy.
 */
router.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
  });
});

export default router;
