import { z } from 'zod';

/** Zod schema for the GET /api/v1/links/:id/analytics query parameters. */
export const analyticsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d']).default('30d'),
});

/** Inferred type for the analytics query parameters. */
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
