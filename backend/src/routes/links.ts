import { Router } from 'express';
import { createLink, getLinks, softDeleteLink, updateLink } from '../services/link.service';
import { createLinkSchema, updateLinkSchema } from '../schemas/link.schema';
import { validateBody } from '../middleware/validate';

export const linkRouter = Router();

/** POST /api/v1/links - Create a new short link. */
linkRouter.post('/', validateBody(createLinkSchema), async (_req, res, next) => {
  try {
    const link = await createLink(res.locals.body);
    res.status(201).json({ data: link });
  } catch (error) {
    next(error);
  }
});

/** GET /api/v1/links - List all non-deleted links with click counts. */
linkRouter.get('/', async (_req, res, next) => {
  try {
    const links = await getLinks();
    res.json({ data: links });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/v1/links/:id - Update a link's target URL and/or expiration. */
linkRouter.patch('/:id', validateBody(updateLinkSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const link = await updateLink(id, res.locals.body);
    res.json({ data: link });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/v1/links/:id - Soft-delete a link. */
linkRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await softDeleteLink(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
