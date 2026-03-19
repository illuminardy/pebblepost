import { prisma } from '../lib/prisma';
import { parseUserAgent } from '../lib/ua-parser';
import { broadcastAll, broadcastToSubscribers, WS_EVENTS } from '../lib/websocket';
import type { AnalyticsQuery } from '../schemas/analytics.schema';

/** Computes the start date for a given range string (e.g., "7d", "30d", "90d"). */
function getRangeStartDate(range: string): Date {
  const days = parseInt(range.replace('d', ''), 10);
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Records a click event for a link. Parses the user-agent string
 * into browser, OS, and device fields for analytics.
 * After recording, broadcasts real-time updates via WebSocket.
 */
export async function recordClick(linkId: string, userAgent: string | undefined) {
  const parsed = userAgent ? parseUserAgent(userAgent) : null;

  await prisma.clickEvent.create({
    data: {
      linkId,
      userAgent: userAgent ?? null,
      browser: parsed?.browser ?? null,
      os: parsed?.os ?? null,
      device: parsed?.device ?? null,
    },
  });

  const totalClicks = await prisma.clickEvent.count({ where: { linkId } });
  broadcastAll(WS_EVENTS.CLICK_RECORDED, { linkId, totalClicks });

  try {
    const analytics = await getAnalytics(linkId, { range: '30d' });
    broadcastToSubscribers(WS_EVENTS.ANALYTICS_UPDATED, linkId, { data: analytics });
  } catch {
    // Non-critical: don't fail the click recording if analytics broadcast fails
  }
}

/**
 * Returns analytics for a link within the given date range.
 * Includes total clicks, daily breakdown, and browser/OS/device breakdowns.
 */
export async function getAnalytics(linkId: string, query: AnalyticsQuery) {
  const startDate = getRangeStartDate(query.range);

  const [totalClicks, dailyClicks, browserBreakdown, osBreakdown, deviceBreakdown] =
    await Promise.all([
      prisma.clickEvent.count({
        where: { linkId, timestamp: { gte: startDate } },
      }),

      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE(timestamp)::text as date, COUNT(*)::bigint as count
        FROM click_events
        WHERE link_id = ${linkId} AND timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `,

      prisma.$queryRaw<Array<{ browser: string; count: bigint }>>`
        SELECT COALESCE(browser, 'Unknown') as browser, COUNT(*)::bigint as count
        FROM click_events
        WHERE link_id = ${linkId} AND timestamp >= ${startDate}
        GROUP BY browser
        ORDER BY count DESC
      `,

      prisma.$queryRaw<Array<{ os: string; count: bigint }>>`
        SELECT COALESCE(os, 'Unknown') as os, COUNT(*)::bigint as count
        FROM click_events
        WHERE link_id = ${linkId} AND timestamp >= ${startDate}
        GROUP BY os
        ORDER BY count DESC
      `,

      prisma.$queryRaw<Array<{ device: string; count: bigint }>>`
        SELECT COALESCE(device, 'Unknown') as device, COUNT(*)::bigint as count
        FROM click_events
        WHERE link_id = ${linkId} AND timestamp >= ${startDate}
        GROUP BY device
        ORDER BY count DESC
      `,
    ]);

  return {
    totalClicks,
    dailyClicks: dailyClicks.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    browserBreakdown: browserBreakdown.map((b) => ({
      name: b.browser,
      count: Number(b.count),
    })),
    osBreakdown: osBreakdown.map((o) => ({
      name: o.os,
      count: Number(o.count),
    })),
    deviceBreakdown: deviceBreakdown.map((d) => ({
      name: d.device,
      count: Number(d.count),
    })),
  };
}
