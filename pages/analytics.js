// pages/analytics.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchPerformanceMetrics } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  buttonStyle,
} from '../lib/theme';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPerformanceMetrics(days);
      if (res.ok) {
        setMetrics(res);
      } else {
        setError(res.error || 'Failed to load metrics');
      }
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [days]);

  return (
    <Layout active="analytics">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Analytics
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Performance metrics and trading analysis
        </p>
      </div>

      {/* Time Range Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              ...buttonStyle,
              background: days === d ? colors.accentDark : colors.bgSecondary,
              borderColor: days === d ? colors.accentMuted : colors.border,
              color: days === d ? colors.accent : colors.textPrimary,
            }}
          >
            {d}D
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ color: colors.textMuted, padding: 40 }}>Loading metrics...</div>
      )}

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

      {metrics && !loading && (
        <>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <MetricCard
              title="Total P&L"
              value={formatCurrency(metrics.total_pnl)}
              color={metrics.total_pnl >= 0 ? colors.accent : colors.error}
            />
            <MetricCard
              title="Win Rate"
              value={`${metrics.win_rate}%`}
              subtitle={`${metrics.win_count}W / ${metrics.loss_count}L`}
              color={metrics.win_rate >= 50 ? colors.accent : colors.error}
            />
            <MetricCard
              title="Sharpe Ratio"
              value={metrics.sharpe_ratio != null ? metrics.sharpe_ratio.toFixed(2) : '—'}
              subtitle="Annualized"
              color={metrics.sharpe_ratio > 1 ? colors.accent : metrics.sharpe_ratio > 0 ? colors.warning : colors.error}
            />
            <MetricCard
              title="Profit Factor"
              value={metrics.profit_factor != null ? metrics.profit_factor.toFixed(2) : '—'}
              subtitle="Gross P / Gross L"
              color={metrics.profit_factor > 1 ? colors.accent : colors.error}
            />
            <MetricCard
              title="Max Drawdown"
              value={formatCurrency(metrics.max_drawdown)}
              subtitle={`${metrics.max_drawdown_pct}%`}
              color={colors.error}
            />
            <MetricCard
              title="Current Drawdown"
              value={formatCurrency(metrics.current_drawdown)}
              color={metrics.current_drawdown > 0 ? colors.warning : colors.accent}
            />
          </div>

          {/* Trade Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <MetricCard
              title="Total Trades"
              value={metrics.total_trades}
              subtitle={`Last ${days} days`}
            />
            <MetricCard
              title="Avg Win"
              value={formatCurrency(metrics.avg_win)}
              color={colors.accent}
            />
            <MetricCard
              title="Avg Loss"
              value={formatCurrency(metrics.avg_loss)}
              color={colors.error}
            />
            <MetricCard
              title="Best Trade"
              value={formatCurrency(metrics.best_trade)}
              color={colors.accent}
            />
            <MetricCard
              title="Worst Trade"
              value={formatCurrency(metrics.worst_trade)}
              color={colors.error}
            />
            <MetricCard
              title="Current Streak"
              value={Math.abs(metrics.current_streak)}
              subtitle={metrics.current_streak > 0 ? 'Wins' : metrics.current_streak < 0 ? 'Losses' : '—'}
              color={metrics.current_streak > 0 ? colors.accent : metrics.current_streak < 0 ? colors.error : colors.textMuted}
            />
          </div>

          {/* Streaks */}
          <div style={cardStyle}>
            <div style={{
              fontWeight: 800,
              fontSize: 18,
              color: colors.textPrimary,
              marginBottom: 16,
            }}>
              Streaks
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>Max Win Streak</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: colors.accent }}>
                  {metrics.max_win_streak}
                </div>
              </div>
              <div>
                <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>Max Loss Streak</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: colors.error }}>
                  {metrics.max_loss_streak}
                </div>
              </div>
            </div>
          </div>

          {/* Cumulative P&L Chart */}
          {metrics.cumulative_pnl && metrics.cumulative_pnl.length > 0 && (
            <div style={{ ...cardStyle, marginTop: 24 }}>
              <div style={{
                fontWeight: 800,
                fontSize: 18,
                color: colors.textPrimary,
                marginBottom: 16,
              }}>
                Cumulative P&L
              </div>
              <CumulativePnlChart data={metrics.cumulative_pnl} />
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

// Components
function MetricCard({ title, value, subtitle, color = colors.textPrimary }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: colors.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function CumulativePnlChart({ data }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const chartHeight = 200;
  const chartWidth = 100;

  // Generate SVG path
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((v - min) / range) * (chartHeight - 20);
    return `${x},${y}`;
  }).join(' ');

  // Zero line position
  const zeroY = chartHeight - ((0 - min) / range) * (chartHeight - 20);

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        {/* Zero line */}
        <line
          x1="0"
          y1={zeroY}
          x2={chartWidth}
          y2={zeroY}
          stroke={colors.border}
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        {/* Area fill */}
        <polygon
          points={`0,${zeroY} ${points} ${chartWidth},${zeroY}`}
          fill={data[data.length - 1] >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 71, 87, 0.1)'}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={data[data.length - 1] >= 0 ? colors.accent : colors.error}
          strokeWidth="1.5"
        />
      </svg>
      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 12,
        color: colors.textMuted,
      }}>
        <span>Trade 1</span>
        <span>Trade {data.length}</span>
      </div>
    </div>
  );
}

function formatCurrency(val) {
  if (val == null) return '—';
  const num = Number(val);
  if (Math.abs(num) >= 1000) {
    return `$${(num / 1000).toFixed(1)}K`;
  }
  return `$${num.toFixed(2)}`;
}
