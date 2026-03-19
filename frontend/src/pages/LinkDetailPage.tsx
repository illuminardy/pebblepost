import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { AnalyticsResponse } from '../api/client';
import { useWebSocket } from '../lib/useWebSocket';
import { ClicksChart } from '../components/ClicksChart';
import { AnalyticsSummary } from '../components/AnalyticsSummary';
import './LinkDetailPage.css';

type Range = '7d' | '30d' | '90d';

/** Analytics page for a single link with live updates via WebSocket. */
export function LinkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.analytics.get(id, range);
      setAnalytics(data);
      setError(null);
      setNotFound(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  }, [id, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const { subscribe, unsubscribe } = useWebSocket((evt) => {
    if (evt.event === 'analytics:updated' && evt.linkId === id && range === '30d') {
      setAnalytics(evt.data);
    }
  });

  useEffect(() => {
    if (!id) return;
    subscribe(id);
    return () => unsubscribe(id);
  }, [id, subscribe, unsubscribe]);

  const ranges: Range[] = ['7d', '30d', '90d'];

  return (
    <div>
      <Link to="/" className="back-link">&larr; Back to links</Link>

      <div className="detail-header">
        <h2>Link Analytics</h2>
        <div className="range-selector">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`range-btn ${r === range ? 'range-btn-active' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="detail-loading">Loading analytics...</div>}
      {error && <div className="detail-error">{error}</div>}

      {notFound && (
        <div className="detail-not-found">
          <h3>Link not found</h3>
          <p>This link doesn't exist or may have been deleted.</p>
          <Link to="/" className="detail-not-found-link">View all links</Link>
        </div>
      )}

      {analytics && (
        <>
          <AnalyticsSummary analytics={analytics} range={range} />
          <ClicksChart dailyClicks={analytics.dailyClicks} />
        </>
      )}
    </div>
  );
}
