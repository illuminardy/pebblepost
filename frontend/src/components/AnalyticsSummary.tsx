import type { AnalyticsResponse } from '../api/client';
import './AnalyticsSummary.css';

interface AnalyticsSummaryProps {
  analytics: AnalyticsResponse;
  range: string;
}

/** Summary cards showing total clicks and browser/OS/device breakdowns. */
export function AnalyticsSummary({ analytics, range }: AnalyticsSummaryProps) {
  return (
    <div className="summary-grid">
      <div className="summary-stat-card">
        <span className="stat-label">Total Clicks ({range})</span>
        <span className="stat-value">{analytics.totalClicks}</span>
      </div>

      <BreakdownCard title="Browsers" items={analytics.browserBreakdown} />
      <BreakdownCard title="Operating Systems" items={analytics.osBreakdown} />
      <BreakdownCard title="Devices" items={analytics.deviceBreakdown} />
    </div>
  );
}

interface BreakdownCardProps {
  title: string;
  items: Array<{ name: string; count: number }>;
}

function BreakdownCard({ title, items }: BreakdownCardProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="breakdown-card">
      <h4 className="breakdown-title">{title}</h4>
      {items.length === 0 ? (
        <p className="breakdown-empty">No data</p>
      ) : (
        <ul className="breakdown-list">
          {items.map((item) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <li key={item.name} className="breakdown-item">
                <div className="breakdown-bar-bg">
                  <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="breakdown-name">{item.name}</span>
                <span className="breakdown-count">
                  {item.count} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
