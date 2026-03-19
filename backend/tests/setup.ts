import { prisma } from '../src/lib/prisma';
import { afterAll } from 'vitest';

/**
 * Deletes all click events and links from the database.
 * Used for test isolation between test runs.
 */
export async function cleanDatabase() {
  await prisma.clickEvent.deleteMany();
  await prisma.link.deleteMany();
}

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
