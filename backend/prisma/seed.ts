import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.link.count();
  if (existingCount > 0) {
    console.log('Seed data already exists, skipping.');
    return;
  }

  console.log('Seeding database...');

  const links = await Promise.all([
    prisma.link.create({
      data: { slug: 'github', targetUrl: 'https://github.com' },
    }),
    prisma.link.create({
      data: { slug: 'google', targetUrl: 'https://www.google.com' },
    }),
    prisma.link.create({
      data: {
        slug: 'example',
        targetUrl: 'https://example.com',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.link.create({
      data: {
        slug: 'expired-demo',
        targetUrl: 'https://expired.example.com',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile',
  ];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Chrome'];
  const oses = ['macOS', 'Windows', 'iOS', 'Android'];
  const devices = ['Desktop', 'Desktop', 'Mobile', 'Mobile'];

  const clickData = Array.from({ length: 50 }, (_, i) => {
    const link = links[i % 3];
    const daysAgo = Math.floor(Math.random() * 14);
    const uaIndex = Math.floor(Math.random() * userAgents.length);

    return {
      linkId: link.id,
      timestamp: new Date(now - daysAgo * DAY_MS + Math.random() * DAY_MS),
      userAgent: userAgents[uaIndex],
      browser: browsers[uaIndex],
      os: oses[uaIndex],
      device: devices[uaIndex],
    };
  });

  await prisma.clickEvent.createMany({ data: clickData });

  console.log(`Seeded ${links.length} links and ${clickData.length} click events.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
