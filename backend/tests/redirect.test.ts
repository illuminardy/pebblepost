import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { cleanDatabase } from './setup';

describe('GET /:slug (redirect)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns 302 with correct Location header for a valid slug', async () => {
    await prisma.link.create({
      data: { slug: 'test-redir', targetUrl: 'https://example.com' },
    });

    const res = await request(app).get('/test-redir').redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/nonexistent-slug');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LINK_NOT_FOUND');
  });

  it('returns 410 for an expired link', async () => {
    await prisma.link.create({
      data: {
        slug: 'expired-link',
        targetUrl: 'https://expired.example.com',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    const res = await request(app).get('/expired-link');

    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('LINK_EXPIRED');
  });

  it('records a click event after redirect', async () => {
    const link = await prisma.link.create({
      data: { slug: 'click-track', targetUrl: 'https://example.com' },
    });

    await request(app)
      .get('/click-track')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0')
      .redirects(0);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const clicks = await prisma.clickEvent.findMany({
      where: { linkId: link.id },
    });

    expect(clicks).toHaveLength(1);
    expect(clicks[0].browser).toBe('Chrome');
  });

  it('performs case-insensitive slug lookup', async () => {
    await prisma.link.create({
      data: { slug: 'myslug', targetUrl: 'https://example.com' },
    });

    const res = await request(app).get('/MYSLUG').redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com');
  });
});
