import { Router } from 'express';
import { getLinkById } from '../services/link.service';
import { getAnalytics } from '../services/analytics.service';
import { analyticsQuerySchema } from '../schemas/analytics.schema';
import { validateQuery } from '../middleware/validate';

export const analyticsRouter = Router();

/** GET /api/v1/links/:id/analytics - Retrieve click analytics for a link. */
analyticsRouter.get(
  '/:id/analytics',
  validateQuery(analyticsQuerySchema),
  async (req, res, next) => {
    try {
      await getLinkById(req.params.id);
      const analytics = await getAnalytics(req.params.id, res.locals.query);
      res.json({ data: analytics });
    } catch (error) {
      next(error);
    }
  },
);
