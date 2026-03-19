import { Router } from 'express';
import { getLinkBySlug } from '../services/link.service';
import { recordClick } from '../services/analytics.service';

export const redirectRouter = Router();

/**
 * GET /:slug - Redirect to the target URL.
 * Records a click event asynchronously (fire-and-forget) to avoid blocking the redirect.
 */
redirectRouter.get('/:slug', async (req, res, next) => {
  try {
    const link = await getLinkBySlug(req.params.slug);

    recordClick(link.id, req.headers['user-agent']).catch((err) => {
      console.error('Failed to record click:', err);
    });

    res.redirect(302, link.targetUrl);
  } catch (error) {
    next(error);
  }
});
