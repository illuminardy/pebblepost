import { prisma } from '../lib/prisma';
import { generateSlug } from '../lib/slug';
import { AppError } from '../middleware/error-handler';
import type { CreateLinkInput, UpdateLinkInput } from '../schemas/link.schema';

const MAX_SLUG_RETRIES = 3;

/**
 * Creates a new short link. If no slug is provided, generates one automatically.
 * Retries slug generation on collision up to {@link MAX_SLUG_RETRIES} times.
 */
export async function createLink(input: CreateLinkInput) {
  const slug = input.slug?.toLowerCase() ?? generateSlug();
  const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

  for (let attempt = 0; attempt <= MAX_SLUG_RETRIES; attempt++) {
    try {
      const currentSlug = attempt === 0 ? slug : generateSlug();

      return await prisma.link.create({
        data: {
          slug: currentSlug,
          targetUrl: input.url,
          expiresAt,
        },
      });
    } catch (error: unknown) {
      const isPrismaUniqueViolation =
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002';

      if (isPrismaUniqueViolation && !input.slug && attempt < MAX_SLUG_RETRIES) {
        continue;
      }

      if (isPrismaUniqueViolation) {
        throw new AppError(409, 'SLUG_TAKEN', `The slug "${slug}" is already in use`);
      }

      throw error;
    }
  }

  throw new AppError(500, 'SLUG_GENERATION_FAILED', 'Failed to generate a unique slug');
}

/** Retrieves all non-deleted links ordered by creation date (newest first), with click counts. */
export async function getLinks() {
  return prisma.link.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { clicks: true } },
    },
  });
}

/**
 * Finds a non-deleted link by its slug and checks if it's expired.
 * @throws {AppError} 404 if slug not found or soft-deleted, 410 if link is expired.
 */
export async function getLinkBySlug(slug: string) {
  const link = await prisma.link.findUnique({
    where: { slug: slug.toLowerCase() },
  });

  if (!link || link.deletedAt) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Short link not found');
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new AppError(410, 'LINK_EXPIRED', 'This short link has expired');
  }

  return link;
}

/**
 * Finds a non-deleted link by ID.
 * @throws {AppError} 404 if not found or soft-deleted.
 */
export async function getLinkById(id: string) {
  const link = await prisma.link.findUnique({
    where: { id },
    include: {
      _count: { select: { clicks: true } },
    },
  });

  if (!link || link.deletedAt) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Link not found');
  }

  return link;
}

/**
 * Soft-deletes a link by setting its `deletedAt` timestamp.
 * @throws {AppError} 404 if not found or already deleted.
 */
export async function softDeleteLink(id: string) {
  const link = await prisma.link.findUnique({ where: { id } });

  if (!link || link.deletedAt) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Link not found');
  }

  return prisma.link.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Updates a link's target URL and/or expiration date.
 * @throws {AppError} 404 if not found or soft-deleted.
 */
export async function updateLink(id: string, input: UpdateLinkInput) {
  const link = await prisma.link.findUnique({ where: { id } });

  if (!link || link.deletedAt) {
    throw new AppError(404, 'LINK_NOT_FOUND', 'Link not found');
  }

  const data: { targetUrl?: string; expiresAt?: Date | null } = {};

  if (input.url !== undefined) {
    data.targetUrl = input.url;
  }

  if (input.expiresAt !== undefined) {
    data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  }

  return prisma.link.update({
    where: { id },
    data,
    include: {
      _count: { select: { clicks: true } },
    },
  });
}
