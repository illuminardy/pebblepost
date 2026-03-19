import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { cleanDatabase } from './setup';

describe('GET /api/v1/links/:id/analytics', () => {
  let linkId: string;

  beforeEach(async () => {
    await cleanDatabase();

    const link = await prisma.link.create({
      data: { slug: 'analytics-test', targetUrl: 'https://example.com' },
    });
    linkId = link.id;
  });

  it('returns total clicks and daily breakdown', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.clickEvent.createMany({
      data: [
        { linkId, timestamp: now, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
        { linkId, timestamp: now, browser: 'Firefox', os: 'Windows', device: 'Desktop' },
        { linkId, timestamp: yesterday, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
      ],
    });

    const res = await request(app).get(`/api/v1/links/${linkId}/analytics?range=7d`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBe(3);
    expect(res.body.data.dailyClicks).toHaveLength(2);
  });

  it('returns browser, OS, and device breakdowns', async () => {
    await prisma.clickEvent.createMany({
      data: [
        { linkId, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
        { linkId, browser: 'Chrome', os: 'Windows', device: 'Desktop' },
        { linkId, browser: 'Firefox', os: 'macOS', device: 'Desktop' },
        { linkId, browser: 'Safari', os: 'iOS', device: 'Mobile' },
      ],
    });

    const res = await request(app).get(`/api/v1/links/${linkId}/analytics?range=30d`);

    expect(res.status).toBe(200);

    const { browserBreakdown, osBreakdown, deviceBreakdown } = res.body.data;

    expect(browserBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Chrome', count: 2 }),
        expect.objectContaining({ name: 'Firefox', count: 1 }),
        expect.objectContaining({ name: 'Safari', count: 1 }),
      ]),
    );

    expect(osBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'macOS', count: 2 }),
      ]),
    );

    expect(deviceBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Desktop', count: 3 }),
        expect.objectContaining({ name: 'Mobile', count: 1 }),
      ]),
    );
  });

  it('filters by range correctly', async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await prisma.clickEvent.createMany({
      data: [
        { linkId, timestamp: eightDaysAgo, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
        { linkId, timestamp: twoDaysAgo, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
      ],
    });

    const res7d = await request(app).get(`/api/v1/links/${linkId}/analytics?range=7d`);
    expect(res7d.body.data.totalClicks).toBe(1);

    const res30d = await request(app).get(`/api/v1/links/${linkId}/analytics?range=30d`);
    expect(res30d.body.data.totalClicks).toBe(2);
  });

  it('returns empty data for a link with no clicks in range', async () => {
    const res = await request(app).get(`/api/v1/links/${linkId}/analytics?range=7d`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBe(0);
    expect(res.body.data.dailyClicks).toHaveLength(0);
    expect(res.body.data.browserBreakdown).toHaveLength(0);
  });

  it('returns 404 for a non-existent link ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/api/v1/links/${fakeId}/analytics`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('LINK_NOT_FOUND');
  });

  it('uses default range of 30d when no range parameter is provided', async () => {
    await prisma.clickEvent.create({
      data: { linkId, browser: 'Chrome', os: 'macOS', device: 'Desktop' },
    });

    const res = await request(app).get(`/api/v1/links/${linkId}/analytics`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBe(1);
  });
});

describe('POST /api/v1/links (validation)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('creates a link with a valid URL', async () => {
    const res = await request(app)
      .post('/api/v1/links')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBeTruthy();
    expect(res.body.data.targetUrl).toBe('https://example.com');
  });

  it('creates a link with a custom slug', async () => {
    const res = await request(app)
      .post('/api/v1/links')
      .send({ url: 'https://example.com', slug: 'custom' });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('custom');
  });

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/api/v1/links')
      .send({ url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for a duplicate slug', async () => {
    await prisma.link.create({
      data: { slug: 'taken', targetUrl: 'https://example.com' },
    });

    const res = await request(app)
      .post('/api/v1/links')
      .send({ url: 'https://other.com', slug: 'taken' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SLUG_TAKEN');
  });

  it('rejects a slug that is too short', async () => {
    const res = await request(app)
      .post('/api/v1/links')
      .send({ url: 'https://example.com', slug: 'ab' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
