import { Router } from 'express';
import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { pingDb } from '../../config/db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ app: 'mangertask-backend', docs: '/docs', health: '/health' });
});

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await pingDb();
      res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() });
    } catch (_error) {
      res.status(503).json({ status: 'degraded', db: 'down', timestamp: new Date().toISOString() });
    }
  }),
);

export default router;
