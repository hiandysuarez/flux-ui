// pages/timing.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchTimingAnalytics } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
} from '../lib/theme';

export default function TimingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTimingAnalytics();
      if (res.ok) {
        setData(res);
      } else {
        setError(res.error || 'Failed to load timing data');
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout active="timing">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Timing Analysis
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Trading performance patterns by time of day and day of week
        </p>
      </div>

      {error && (
        <div style={{
          ...cardStyle,
          background: '#1a0a0a',
          borderColor: colors.error,
          color: colors.error,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: colors.textMuted, padding: 40 }}>Loading timing data...</div>
      ) : !data ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: colors.textMuted, padding: 40 }}>
          No timing data available
        </div>
      ) : (
        <>
          {/* Best Trading Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
            <BestHoursCard
              hours={data.by_hour?.filter(h => h.trades > 0).sort((a, b) => b.win_rate - a.win_rate)}
              title="Best Trading Hours"
              color={colors.accent}
            />
            <BestHoursCard
              hours={data.by_hour?.filter(h => h.trades > 0).sort((a, b) => a.win_rate - b.win_rate)}
              title="Worst Trading Hours"
              color={colors.error}
            />
          </div>

          {/* Hour Heatmap */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary, marginBottom: 16 }}>
              Performance by Hour
            </div>
            <HourHeatmap data={data.by_hour} />
          </div>

          {/* Day of Week */}
          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary, marginBottom: 16 }}>
              Performance by Day of Week
            </div>
            <DayOfWeekChart data={data.by_day} />
          </div>

          {/* Detailed Stats Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>Hourly Breakdown</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.bgSecondary }}>
                  <Th>Hour</Th>
                  <Th>Trades</Th>
                  <Th>Win Rate</Th>
                  <Th>Total P&L</Th>
                  <Th>Avg P&L</Th>
                </tr>
              </thead>
              <tbody>
                {data.by_hour && data.by_hour.map((h, i) => {
                  const avgPnl = h.trades > 0 ? h.pnl / h.trades : 0;
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                      <Td style={{ fontWeight: 700 }}>{formatHour(h.hour)}</Td>
                      <Td style={{ fontFamily: 'monospace' }}>{h.trades}</Td>
                      <Td style={{
                        fontWeight: 600,
                        color: h.win_rate >= 50 ? colors.accent : colors.error,
                      }}>
                        {h.win_rate}%
                      </Td>
                      <Td style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: h.pnl > 0 ? colors.accent : h.pnl < 0 ? colors.error : colors.textPrimary,
                      }}>
                        ${h.pnl.toFixed(2)}
                      </Td>
                      <Td style={{
                        fontFamily: 'monospace',
                        color: avgPnl > 0 ? colors.accent : avgPnl < 0 ? colors.error : colors.textPrimary,
                      }}>
                        ${avgPnl.toFixed(2)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}

// Components
function BestHoursCard({ hours, title, color }) {
  if (!hours || hours.length === 0) {
    return (
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary, marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ color: colors.textMuted }}>Not enough data</div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary, marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hours.slice(0, 3).map((h, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: colors.bgSecondary,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                color: colors.bgPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
              }}>
                {i + 1}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{formatHour(h.hour)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color, fontSize: 14 }}>{h.win_rate}%</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{h.trades} trades</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HourHeatmap({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: colors.textMuted }}>No hourly data available</div>;
  }

  const maxPnl = Math.max(...data.map(d => d.pnl), 0);
  const minPnl = Math.min(...data.map(d => d.pnl), 0);

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {data.map((h, i) => {
        const intensity = h.pnl > 0
          ? Math.min(h.pnl / (maxPnl || 1), 1)
          : Math.min(Math.abs(h.pnl) / (Math.abs(minPnl) || 1), 1);
        const bgColor = h.pnl > 0
          ? `rgba(0, 255, 136, ${0.2 + intensity * 0.6})`
          : h.pnl < 0
          ? `rgba(255, 71, 87, ${0.2 + intensity * 0.6})`
          : colors.bgSecondary;

        return (
          <div
            key={i}
            style={{
              width: 60,
              padding: '8px 4px',
              background: bgColor,
              borderRadius: borderRadius.md,
              textAlign: 'center',
              border: `1px solid ${colors.border}`,
            }}
            title={`${formatHour(h.hour)}: $${h.pnl.toFixed(2)} P&L, ${h.win_rate}% win rate`}
          >
            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
              {formatHour(h.hour)}
            </div>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: h.pnl > 0 ? colors.accent : h.pnl < 0 ? colors.error : colors.textPrimary,
            }}>
              {h.win_rate}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayOfWeekChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ color: colors.textMuted }}>No daily data available</div>;
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxPnl = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const chartHeight = 160;
  const barWidth = 60;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: chartHeight, padding: '20px 0' }}>
      {data.map((d, i) => {
        const barHeight = Math.abs(d.pnl) / maxPnl * (chartHeight - 40);
        const isPositive = d.pnl >= 0;

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {/* P&L Label */}
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: isPositive ? colors.accent : colors.error,
            }}>
              ${d.pnl.toFixed(0)}
            </div>
            {/* Bar */}
            <div style={{
              width: barWidth,
              height: Math.max(barHeight, 4),
              background: isPositive
                ? `linear-gradient(180deg, ${colors.accent} 0%, ${colors.accentDark} 100%)`
                : `linear-gradient(180deg, ${colors.error} 0%, #1a0a0a 100%)`,
              borderRadius: borderRadius.md,
              transition: 'height 0.3s ease',
            }} />
            {/* Day Label */}
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
              {days[d.day] || `Day ${d.day}`}
            </div>
            {/* Win Rate */}
            <div style={{ fontSize: 11, color: colors.textMuted }}>
              {d.win_rate}% ({d.trades})
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '12px 14px',
      fontSize: 12,
      fontWeight: 700,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {children}
    </th>
  );
}

function Td({ children, style = {} }) {
  return (
    <td style={{ padding: '12px 14px', fontSize: 13, ...style }}>
      {children}
    </td>
  );
}

function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}
