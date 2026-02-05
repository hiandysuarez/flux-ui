// pages/analytics.js
import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { fetchPerformanceMetrics } from '../lib/api';
import { SkeletonStatCard, SkeletonChart } from '../components/Skeleton';
import {
  darkTheme,
  borderRadius,
  cardStyle,
  buttonStyle,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
  skeletonStyle,
  visualEffects,
  lookbackOptions,
  glassStyle,
} from '../lib/theme';

export default function AnalyticsPage() {
  const colors = darkTheme;
  const effects = visualEffects;

  const [metrics, setMetrics] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBreakdown, setActiveBreakdown] = useState('overview');

  // Calculate days for MTD/YTD
  const getActualDays = (value) => {
    if (value === 'mtd') {
      const now = new Date();
      return now.getDate();
    }
    if (value === 'ytd') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24));
    }
    return value;
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const actualDays = getActualDays(days);
      const res = await fetchPerformanceMetrics(actualDays);
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

  // Calculate performance by symbol from cumulative data
  const bySymbolData = useMemo(() => {
    if (!metrics?.by_symbol) return [];
    return Object.entries(metrics.by_symbol || {})
      .map(([symbol, pnl]) => ({ symbol, pnl: Number(pnl) }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [metrics]);

  // Calculate performance by hour (mock - would need real data)
  const byHourData = useMemo(() => {
    if (!metrics?.by_hour) return [];
    return metrics.by_hour || [];
  }, [metrics]);

  return (
    <Layout active="analytics">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>


      {/* Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <h1 style={{
          fontSize: fontSize.xl,
          fontWeight: fontWeight.black,
          margin: 0,
          color: colors.textPrimary,
          letterSpacing: '-0.02em',
        }}>
          Analytics
        </h1>
        <p style={{ margin: `${spacing.sm}px 0 0`, color: colors.textMuted, fontSize: fontSize.sm }}>
          Performance metrics and trading analysis
        </p>
      </div>

      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div
          role="group"
          aria-label="Select time range"
          style={{
            display: 'flex',
            gap: 4,
            background: colors.bgSecondary,
            padding: 4,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
          }}
        >
          {lookbackOptions.analytics.filter(opt => opt.value !== 'custom').map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              aria-pressed={days === opt.value}
              aria-label={`Show ${opt.label} data`}
              style={{
                padding: '8px 14px',
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                borderRadius: borderRadius.md,
                border: 'none',
                cursor: 'pointer',
                background: days === opt.value ? colors.accent : 'transparent',
                color: days === opt.value ? colors.bgPrimary : colors.textMuted,
                transition: `all ${transitions.fast}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Period indicator */}
        <span style={{
          fontSize: fontSize.sm,
          color: colors.textMuted,
          padding: '8px 14px',
          background: colors.bgCard,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border}`,
        }}>
          {days === 'mtd' ? 'Month to Date' :
           days === 'ytd' ? 'Year to Date' :
           `Last ${days} days`}
        </span>
      </div>

      {/* Breakdown Tabs */}
      <div
        role="tablist"
        aria-label="Analytics view"
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 24,
          background: colors.bgSecondary,
          padding: 4,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.border}`,
          width: 'fit-content',
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'performance', label: 'Performance' },
          { id: 'breakdown', label: 'Breakdown' },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeBreakdown === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveBreakdown(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
              borderRadius: borderRadius.sm,
              border: 'none',
              cursor: 'pointer',
              background: activeBreakdown === tab.id ? colors.bgCard : 'transparent',
              color: activeBreakdown === tab.id ? colors.textPrimary : colors.textMuted,
              transition: `all ${transitions.fast}`,
              boxShadow: activeBreakdown === tab.id ? shadows.sm : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }} aria-busy="true" aria-label="Loading analytics data">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <div style={{
          ...cardStyle,
          background: colors.errorDark,
          borderColor: colors.error,
          color: colors.error,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {metrics && !loading && (
        <>
          {/* Overview Tab */}
          {activeBreakdown === 'overview' && (
            <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
              {/* Key Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                <MetricCard
                  title="Total P&L"
                  value={formatCurrency(metrics.total_pnl)}
                  color={metrics.total_pnl >= 0 ? colors.accent : colors.error}
                  themeColors={colors}
                  glow={true}
                />
                <MetricCard
                  title="Win Rate"
                  value={`${metrics.win_rate}%`}
                  subtitle={`${metrics.win_count}W / ${metrics.loss_count}L`}
                  color={metrics.win_rate >= 50 ? colors.accent : colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Sharpe Ratio"
                  value={metrics.sharpe_ratio != null ? metrics.sharpe_ratio.toFixed(2) : '—'}
                  subtitle="Annualized"
                  color={metrics.sharpe_ratio > 1 ? colors.accent : metrics.sharpe_ratio > 0 ? colors.warning : colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Profit Factor"
                  value={metrics.profit_factor != null ? metrics.profit_factor.toFixed(2) : '—'}
                  subtitle="Gross P / Gross L"
                  color={metrics.profit_factor > 1 ? colors.accent : colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Max Drawdown"
                  value={formatCurrency(metrics.max_drawdown)}
                  subtitle={`${metrics.max_drawdown_pct}%`}
                  color={colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Current Drawdown"
                  value={formatCurrency(metrics.current_drawdown)}
                  color={metrics.current_drawdown > 0 ? colors.warning : colors.accent}
                  themeColors={colors}
                />
              </div>

              {/* Cumulative P&L Chart */}
              {metrics.cumulative_pnl && metrics.cumulative_pnl.length > 0 && (
                <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border, marginBottom: 24 }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: 18,
                    color: colors.textPrimary,
                    marginBottom: 16,
                  }}>
                    Daily P&L
                  </div>
                  <CumulativePnlChart data={metrics.cumulative_pnl} themeColors={colors} />
                </div>
              )}
            </div>
          )}

          {/* Performance Tab */}
          {activeBreakdown === 'performance' && (
            <div role="tabpanel" id="panel-performance" aria-labelledby="tab-performance">
              {/* Trade Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
                <MetricCard
                  title="Total Trades"
                  value={metrics.total_trades}
                  subtitle={days === 'mtd' ? 'This month' : days === 'ytd' ? 'This year' : `Last ${days} days`}
                  themeColors={colors}
                />
                <MetricCard
                  title="Avg Win"
                  value={formatCurrency(metrics.avg_win)}
                  color={colors.accent}
                  themeColors={colors}
                />
                <MetricCard
                  title="Avg Loss"
                  value={formatCurrency(metrics.avg_loss)}
                  color={colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Best Trade"
                  value={formatCurrency(metrics.best_trade)}
                  color={colors.accent}
                  themeColors={colors}
                />
                <MetricCard
                  title="Worst Trade"
                  value={formatCurrency(metrics.worst_trade)}
                  color={colors.error}
                  themeColors={colors}
                />
                <MetricCard
                  title="Current Streak"
                  value={Math.abs(metrics.current_streak)}
                  subtitle={metrics.current_streak > 0 ? 'Wins' : metrics.current_streak < 0 ? 'Losses' : '—'}
                  color={metrics.current_streak > 0 ? colors.accent : metrics.current_streak < 0 ? colors.error : colors.textMuted}
                  themeColors={colors}
                />
              </div>

              {/* Streaks */}
              <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border, marginBottom: 24 }}>
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
                    <div style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: colors.accent,
                      textShadow: `0 0 20px ${colors.accent}40`,
                    }}>
                      {metrics.max_win_streak}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>Max Loss Streak</div>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: colors.error,
                      textShadow: `0 0 20px ${colors.error}40`,
                    }}>
                      {metrics.max_loss_streak}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk/Reward Visual */}
              <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}>
                  Risk/Reward Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                  <div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>Average Win vs Loss</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        flex: metrics.avg_win ? Math.abs(metrics.avg_win) : 1,
                        height: 24,
                        background: colors.accent,
                        borderRadius: 4,
                        opacity: 0.8,
                      }} />
                      <span style={{ color: colors.accent, fontFamily: fontFamily.mono, fontWeight: 700 }}>
                        {formatCurrency(metrics.avg_win)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <div style={{
                        flex: metrics.avg_loss ? Math.abs(metrics.avg_loss) : 1,
                        height: 24,
                        background: colors.error,
                        borderRadius: 4,
                        opacity: 0.8,
                      }} />
                      <span style={{ color: colors.error, fontFamily: fontFamily.mono, fontWeight: 700 }}>
                        {formatCurrency(metrics.avg_loss)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>Win/Loss Distribution</div>
                    <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        flex: metrics.win_count || 1,
                        background: colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.bgPrimary,
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {metrics.win_count}W
                      </div>
                      <div style={{
                        flex: metrics.loss_count || 1,
                        background: colors.error,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.bgPrimary,
                        fontWeight: 700,
                        fontSize: 12,
                      }}>
                        {metrics.loss_count}L
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, color: colors.textMuted }}>
                      Ratio: {metrics.loss_count ? (metrics.win_count / metrics.loss_count).toFixed(2) : '∞'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown Tab */}
          {activeBreakdown === 'breakdown' && (
            <div role="tabpanel" id="panel-breakdown" aria-labelledby="tab-breakdown" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {/* By Symbol - half width card */}
              <div style={{
                ...cardStyle,
                background: colors.bgCard,
                borderColor: colors.border,
                maxWidth: '100%',
              }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}>
                  P&L by Symbol
                </div>
                {bySymbolData.length === 0 ? (
                  <div style={{ color: colors.textMuted, textAlign: 'center', padding: 40 }}>
                    No symbol data available
                  </div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {bySymbolData.map((d, i) => (
                      <SymbolBar key={d.symbol} data={d} maxPnl={Math.max(...bySymbolData.map(x => Math.abs(x.pnl)))} themeColors={colors} />
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Summary */}
              <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: colors.textPrimary,
                  marginBottom: 16,
                }}>
                  Quick Stats
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <StatRow label="Avg Trade Duration" value={metrics.avg_duration || '—'} themeColors={colors} />
                  <StatRow label="Trades per Day" value={(metrics.total_trades / getActualDays(days)).toFixed(1)} themeColors={colors} />
                  <StatRow label="Profitable Days" value={`${metrics.profitable_days || 0} / ${getActualDays(days)}`} themeColors={colors} />
                  <StatRow
                    label="Expectancy"
                    value={formatCurrency((metrics.win_rate / 100 * metrics.avg_win) - ((100 - metrics.win_rate) / 100 * Math.abs(metrics.avg_loss)))}
                    color={(metrics.win_rate / 100 * metrics.avg_win) - ((100 - metrics.win_rate) / 100 * Math.abs(metrics.avg_loss)) > 0 ? colors.accent : colors.error}
                    themeColors={colors}
                  />
                  <StatRow
                    label="Recovery Factor"
                    value={metrics.max_drawdown ? (metrics.total_pnl / Math.abs(metrics.max_drawdown)).toFixed(2) : '—'}
                    themeColors={colors}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

// Components
function MetricCard({ title, value, subtitle, color, themeColors = darkTheme, glow = false }) {
  const [hovered, setHovered] = useState(false);
  const effectiveColor = color || themeColors.textPrimary;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        background: themeColors.bgCard,
        borderColor: hovered ? themeColors.borderAccent : themeColors.border,
        transition: `all ${transitions.normal}`,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? shadows.lg : shadows.md,
      }}
    >
      <div style={{ color: themeColors.textMuted, fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 900,
        color: effectiveColor,
        fontFamily: fontFamily.mono,
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ color: themeColors.textMuted, fontSize: 12, marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function SymbolBar({ data, maxPnl, themeColors }) {
  const barWidth = Math.abs(data.pnl) / maxPnl * 100;
  const isPositive = data.pnl >= 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 6,
      padding: '6px 0',
      borderBottom: `1px solid ${themeColors.border}20`,
    }}>
      <span style={{
        width: 52,
        fontWeight: 700,
        fontSize: 13,
        color: themeColors.textPrimary,
        letterSpacing: '-0.01em',
      }}>
        {data.symbol}
      </span>
      <div style={{
        flex: 1,
        height: 8,
        background: themeColors.bgSecondary,
        borderRadius: 100,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(barWidth, 3)}%`,
          height: '100%',
          background: isPositive
            ? `linear-gradient(90deg, ${themeColors.accent}90, ${themeColors.accent})`
            : `linear-gradient(90deg, ${themeColors.error}90, ${themeColors.error})`,
          borderRadius: 100,
          boxShadow: `0 0 8px ${isPositive ? themeColors.accent : themeColors.error}40`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        width: 65,
        textAlign: 'right',
        fontFamily: fontFamily.mono,
        fontSize: 12,
        fontWeight: 700,
        color: isPositive ? themeColors.accent : themeColors.error,
      }}>
        {formatCurrency(data.pnl)}
      </span>
    </div>
  );
}

function StatRow({ label, value, color, themeColors }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: `1px solid ${themeColors.border}`,
    }}>
      <span style={{ color: themeColors.textMuted, fontSize: 13 }}>{label}</span>
      <span style={{
        fontFamily: fontFamily.mono,
        fontSize: 14,
        fontWeight: 700,
        color: color || themeColors.textPrimary,
      }}>
        {value}
      </span>
    </div>
  );
}


function CumulativePnlChart({ data, themeColors = darkTheme }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  // Aggregate trades by date
  const dailyData = useMemo(() => {
    if (!data || data.length < 2) return [];

    // Convert cumulative values to per-trade P&L changes
    const changes = data.map((val, i) => i === 0 ? val : val - data[i - 1]);

    // Group by date - assuming trades are chronological
    // For now, we'll simulate days by grouping every N trades
    // In production, you'd have timestamps with each trade
    const tradesPerDay = Math.max(1, Math.ceil(data.length / 30)); // Aim for ~30 days max
    const days = [];

    for (let i = 0; i < data.length; i += tradesPerDay) {
      const dayTrades = changes.slice(i, Math.min(i + tradesPerDay, data.length));
      const dayPnl = dayTrades.reduce((sum, val) => sum + val, 0);
      const cumulative = data[Math.min(i + tradesPerDay - 1, data.length - 1)];
      days.push({
        dayIndex: days.length,
        pnl: dayPnl,
        cumulative,
        tradeCount: dayTrades.length,
      });
    }

    return days;
  }, [data]);

  if (!dailyData || dailyData.length < 1) return null;

  // Theme colors
  const goldColor = 'rgba(212, 165, 116, 0.85)';
  const redColor = 'rgba(248, 81, 73, 0.85)';
  const goldBright = '#D4A574';
  const redBright = '#F85149';

  // Chart dimensions
  const chartHeight = 220;
  const chartWidth = 100;
  const paddingTop = 15;
  const paddingBottom = 15;
  const paddingX = 8;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const usableWidth = chartWidth - paddingX * 2;

  // Calculate bar dimensions
  const barCount = dailyData.length;
  const gapRatio = 0.25; // Gap is 25% of bar+gap width
  const totalBarWidth = usableWidth / barCount;
  const barWidth = totalBarWidth * (1 - gapRatio);
  const barGap = totalBarWidth * gapRatio;

  // Find max absolute value for scaling
  const maxAbsPnl = Math.max(
    Math.abs(Math.max(...dailyData.map(d => d.pnl), 0)),
    Math.abs(Math.min(...dailyData.map(d => d.pnl), 0)),
    1
  );

  // Zero line position (center of chart)
  const zeroY = paddingTop + usableHeight / 2;
  const halfHeight = usableHeight / 2;

  // Calculate bar positions
  const getBarProps = (day, index) => {
    const x = paddingX + index * totalBarWidth + barGap / 2;
    const height = (Math.abs(day.pnl) / maxAbsPnl) * halfHeight * 0.9; // 90% of half height
    const isPositive = day.pnl >= 0;
    const y = isPositive ? zeroY - height : zeroY;

    return { x, y, width: barWidth, height: Math.max(height, 0.5), isPositive };
  };

  const finalPnl = dailyData[dailyData.length - 1]?.cumulative || 0;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ cursor: 'crosshair', borderRadius: 8 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const idx = Math.floor(x * barCount);
          if (idx >= 0 && idx < dailyData.length) {
            setHoverIdx(idx);
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              day: dailyData[idx],
            });
          }
        }}
        onMouseLeave={() => { setTooltip(null); setHoverIdx(null); }}
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id="barChartBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColors.bgSecondary} stopOpacity="0.5" />
            <stop offset="100%" stopColor={themeColors.bgPrimary} stopOpacity="0.8" />
          </linearGradient>

          {/* Gold bar shadow - upward glow */}
          <filter id="goldBarShadow" x="-50%" y="-100%" width="200%" height="300%">
            <feDropShadow dx="0" dy="-1" stdDeviation="1.5"
              floodColor="#D4A574" floodOpacity="0.5"/>
          </filter>

          {/* Red bar shadow - downward glow */}
          <filter id="redBarShadow" x="-50%" y="-50%" width="200%" height="250%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5"
              floodColor="#F85149" floodOpacity="0.5"/>
          </filter>

          {/* Bar gradients for depth */}
          <linearGradient id="goldBarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#E8C19A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="redBarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F85149" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#FF7B73" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F85149" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Chart background */}
        <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#barChartBg)" rx="2" />

        {/* Subtle grid lines */}
        {[0.25, 0.75].map(pct => (
          <line
            key={pct}
            x1={paddingX}
            y1={paddingTop + pct * usableHeight}
            x2={chartWidth - paddingX}
            y2={paddingTop + pct * usableHeight}
            stroke={themeColors.border}
            strokeWidth="0.1"
            strokeOpacity="0.3"
          />
        ))}

        {/* Zero baseline - dashed line */}
        <line
          x1={paddingX}
          y1={zeroY}
          x2={chartWidth - paddingX}
          y2={zeroY}
          stroke={themeColors.border}
          strokeWidth="0.25"
          strokeDasharray="1,1"
          strokeOpacity="0.6"
        />

        {/* Bars */}
        {dailyData.map((day, i) => {
          const { x, y, width, height, isPositive } = getBarProps(day, i);
          const isHovered = hoverIdx === i;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={width}
              height={height}
              fill={isPositive ? 'url(#goldBarGrad)' : 'url(#redBarGrad)'}
              filter={isPositive ? 'url(#goldBarShadow)' : 'url(#redBarShadow)'}
              rx={0.5}
              ry={0.5}
              style={{
                opacity: isHovered ? 1 : 0.9,
                transition: 'opacity 0.15s ease',
              }}
            />
          );
        })}

        {/* Hover indicator line */}
        {hoverIdx !== null && (
          <line
            x1={paddingX + hoverIdx * totalBarWidth + totalBarWidth / 2}
            y1={paddingTop}
            x2={paddingX + hoverIdx * totalBarWidth + totalBarWidth / 2}
            y2={chartHeight - paddingBottom}
            stroke={themeColors.textMuted}
            strokeWidth="0.2"
            strokeDasharray="1,1"
            strokeOpacity="0.4"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && tooltip.day && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 100,
          background: themeColors.bgCard,
          border: `1px solid ${themeColors.border}`,
          padding: '14px 18px',
          borderRadius: 12,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${themeColors.border}`,
          backdropFilter: 'blur(12px)',
          minWidth: 140,
        }}>
          <div style={{
            color: themeColors.textMuted,
            marginBottom: 10,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            borderBottom: `1px solid ${themeColors.border}`,
            paddingBottom: 8,
          }}>
            Day {tooltip.day.dayIndex + 1} • {tooltip.day.tradeCount} trades
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ color: themeColors.textMuted, fontSize: 10, marginBottom: 2 }}>Daily P&L</div>
            <div style={{
              fontWeight: 700,
              fontSize: 18,
              color: tooltip.day.pnl >= 0 ? goldBright : redBright,
              fontFamily: fontFamily.mono,
            }}>
              {tooltip.day.pnl >= 0 ? '+' : ''}{formatCurrency(tooltip.day.pnl)}
            </div>
          </div>

          <div>
            <div style={{ color: themeColors.textMuted, fontSize: 10, marginBottom: 2 }}>Cumulative</div>
            <div style={{
              fontSize: 13,
              color: tooltip.day.cumulative >= 0 ? goldBright : redBright,
              fontFamily: fontFamily.mono,
              opacity: 0.85,
            }}>
              {formatCurrency(tooltip.day.cumulative)}
            </div>
          </div>
        </div>
      )}

      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        padding: '0 4px',
      }}>
        <span style={{ fontSize: 10, color: themeColors.textMuted, opacity: 0.7 }}>
          Day 1
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: finalPnl >= 0 ? `${goldBright}12` : `${redBright}12`,
          borderRadius: 8,
          border: `1px solid ${finalPnl >= 0 ? goldBright : redBright}25`,
        }}>
          <span style={{
            fontSize: 10,
            color: themeColors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Total P&L
          </span>
          <span style={{
            color: finalPnl >= 0 ? goldBright : redBright,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: fontFamily.mono,
          }}>
            {formatCurrency(finalPnl)}
          </span>
        </div>
        <span style={{ fontSize: 10, color: themeColors.textMuted, opacity: 0.7 }}>
          Day {dailyData.length}
        </span>
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
