import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import './ClicksChart.css';

interface ClicksChartProps {
  dailyClicks: Array<{ date: string; count: number }>;
}

/** Responsive bar chart displaying clicks per day. */
export function ClicksChart({ dailyClicks }: ClicksChartProps) {
  if (dailyClicks.length === 0) {
    return <div className="chart-empty">No clicks in this period.</div>;
  }

  const data = dailyClicks.map((d) => ({
    date: formatDate(d.date),
    clicks: d.count,
  }));

  return (
    <div className="chart-card">
      <h3 className="chart-title">Daily Clicks</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 13,
              }}
            />
            <Bar dataKey="clicks" fill="#2e9e6a" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Formats ISO date string (YYYY-MM-DD) to a shorter display format (MMM D). */
function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
