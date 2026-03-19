import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Creates Express middleware that validates `req.body` against a Zod schema.
 * Parsed data is stored in `res.locals.body`.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors.map((e) => e.message).join(', '),
        },
      });
      return;
    }
    res.locals.body = result.data;
    next();
  };
}

/**
 * Creates Express middleware that validates `req.query` against a Zod schema.
 * Parsed data is stored in `res.locals.query`.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.errors.map((e) => e.message).join(', '),
        },
      });
      return;
    }
    res.locals.query = result.data;
    next();
  };
}
