import { z } from 'zod';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Zod schema for the POST /api/v1/links request body. */
export const createLinkSchema = z.object({
  url: z
    .string()
    .url('Must be a valid URL')
    .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
      message: 'URL must use http or https protocol',
    }),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(
      SLUG_PATTERN,
      'Slug must be lowercase alphanumeric with optional hyphens (no leading/trailing/consecutive hyphens)',
    )
    .transform((val) => val.toLowerCase())
    .optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'Must be a valid ISO datetime' })
    .refine((val) => new Date(val) > new Date(), {
      message: 'Expiration date must be in the future',
    })
    .optional(),
});

/** Inferred type for the create link request body. */
export type CreateLinkInput = z.infer<typeof createLinkSchema>;

/** Zod schema for the PATCH /api/v1/links/:id request body. */
export const updateLinkSchema = z
  .object({
    url: z
      .string()
      .url('Must be a valid URL')
      .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
        message: 'URL must use http or https protocol',
      })
      .optional(),
    expiresAt: z
      .string()
      .datetime({ message: 'Must be a valid ISO datetime' })
      .refine((val) => new Date(val) > new Date(), {
        message: 'Expiration date must be in the future',
      })
      .nullable()
      .optional(),
  })
  .refine((data) => data.url !== undefined || data.expiresAt !== undefined, {
    message: 'At least one field (url or expiresAt) must be provided',
  });

/** Inferred type for the update link request body. */
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
