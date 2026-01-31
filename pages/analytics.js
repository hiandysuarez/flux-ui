// pages/analytics.js
import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { fetchPerformanceMetrics } from '../lib/api';
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
        <div style={{
          display: 'flex',
          gap: 4,
          background: colors.bgSecondary,
          padding: 4,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}>
          {lookbackOptions.analytics.filter(opt => opt.value !== 'custom').map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
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
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        background: colors.bgSecondary,
        padding: 4,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        width: 'fit-content',
      }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'performance', label: 'Performance' },
          { id: 'breakdown', label: 'Breakdown' },
        ].map(tab => (
          <button
            key={tab.id}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} colors={colors} />
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
            <>
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
                    Cumulative P&L
                  </div>
                  <CumulativePnlChart data={metrics.cumulative_pnl} themeColors={colors} />
                </div>
              )}
            </>
          )}

          {/* Performance Tab */}
          {activeBreakdown === 'performance' && (
            <>
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
            </>
          )}

          {/* Breakdown Tab */}
          {activeBreakdown === 'breakdown' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
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

function SkeletonCard({ colors }) {
  return (
    <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
      <div style={{
        ...skeletonStyle,
        width: '60%',
        height: 14,
        marginBottom: 8,
        background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        ...skeletonStyle,
        width: '80%',
        height: 28,
        marginBottom: 8,
        background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        ...skeletonStyle,
        width: '40%',
        height: 12,
        background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
    </div>
  );
}

function CumulativePnlChart({ data, themeColors = darkTheme }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  if (!data || data.length < 2) return null;

  // Theme colors - subtle for fills, bright for line
  const goldColor = '#D4A574';
  const redColor = '#F85149';
  const goldBright = '#F5C76D';  // Brighter gold for line
  const redBright = '#FF6B6B';   // Brighter red for line

  const max = Math.max(...data, 0);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const chartHeight = 220;
  const chartWidth = 100;
  const padding = 10;
  const bottomY = chartHeight - padding;

  // Calculate daily changes for segment coloring
  const dailyChanges = data.map((val, i) => i === 0 ? val : val - data[i - 1]);

  // Generate smooth curve path using bezier curves
  const getPoint = (i) => {
    const x = padding + ((i / (data.length - 1)) * (chartWidth - padding * 2));
    const y = padding + ((1 - (data[i] - min) / range) * (chartHeight - padding * 2));
    return { x, y };
  };

  // Get bezier control points for smooth curve between two points
  const getBezierSegment = (i) => {
    const p0 = getPoint(Math.max(0, i - 1));
    const p1 = getPoint(i);
    const p2 = getPoint(i + 1);
    const p3 = getPoint(Math.min(data.length - 1, i + 2));

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    return { p1, p2, cp1: { x: cp1x, y: cp1y }, cp2: { x: cp2x, y: cp2y } };
  };

  // Create full smooth bezier path for the main line
  let pathD = `M ${getPoint(0).x},${getPoint(0).y}`;
  for (let i = 0; i < data.length - 1; i++) {
    const seg = getBezierSegment(i);
    pathD += ` C ${seg.cp1.x},${seg.cp1.y} ${seg.cp2.x},${seg.cp2.y} ${seg.p2.x},${seg.p2.y}`;
  }

  // Generate segmented area and line paths - each segment colored by daily change
  const segmentPaths = [];
  for (let i = 0; i < data.length - 1; i++) {
    const seg = getBezierSegment(i);
    const isPositive = dailyChanges[i + 1] >= 0;

    // Area path: curve from p1 to p2, then down to bottom, across, back up
    const areaPath = `M ${seg.p1.x},${seg.p1.y} C ${seg.cp1.x},${seg.cp1.y} ${seg.cp2.x},${seg.cp2.y} ${seg.p2.x},${seg.p2.y} L ${seg.p2.x},${bottomY} L ${seg.p1.x},${bottomY} Z`;
    // Line path: just the curve
    const linePath = `M ${seg.p1.x},${seg.p1.y} C ${seg.cp1.x},${seg.cp1.y} ${seg.cp2.x},${seg.cp2.y} ${seg.p2.x},${seg.p2.y}`;

    segmentPaths.push({
      areaPath,
      linePath,
      fillColor: isPositive ? goldColor : redColor,
      lineColor: isPositive ? goldBright : redBright,
    });
  }

  const finalPnl = data[data.length - 1];
  const lastPoint = getPoint(data.length - 1);
  const lineColor = finalPnl >= 0 ? goldColor : redColor;

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
          const idx = Math.round(x * (data.length - 1));
          if (idx >= 0 && idx < data.length) {
            setHoverIdx(idx);
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              trade: idx + 1,
              pnl: data[idx],
              dailyChange: dailyChanges[idx],
            });
          }
        }}
        onMouseLeave={() => { setTooltip(null); setHoverIdx(null); }}
      >
        <defs>
          {/* Background gradient */}
          <linearGradient id="chartBgGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColors.bgSecondary} stopOpacity="0.5" />
            <stop offset="100%" stopColor={themeColors.bgPrimary} stopOpacity="0.8" />
          </linearGradient>

          {/* Segment gradients - subtle fading shadow */}
          <linearGradient id="segGradGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={goldColor} stopOpacity="0.15" />
            <stop offset="50%" stopColor={goldColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={goldColor} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="segGradRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={redColor} stopOpacity="0.15" />
            <stop offset="50%" stopColor={redColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={redColor} stopOpacity="0" />
          </linearGradient>

          {/* Line glow filter - subtle */}
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Subtle inner shadow for depth */}
          <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feComponentTransfer in="SourceAlpha">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="1" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feFlood floodColor="rgba(0,0,0,0.3)" result="color" />
            <feComposite in2="offsetblur" operator="in" />
            <feComposite in2="SourceAlpha" operator="in" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode />
            </feMerge>
          </filter>
        </defs>

        {/* Chart background */}
        <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#chartBgGradient)" rx="2" />

        {/* Subtle horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + pct * (chartHeight - padding * 2)}
            x2={chartWidth - padding}
            y2={padding + pct * (chartHeight - padding * 2)}
            stroke={themeColors.border}
            strokeWidth="0.15"
            strokeOpacity="0.4"
          />
        ))}

        {/* Segmented area fills with gradient shadows */}
        {segmentPaths.map((seg, i) => (
          <path
            key={`area-${i}`}
            d={seg.areaPath}
            fill={seg.fillColor === goldColor ? 'url(#segGradGold)' : 'url(#segGradRed)'}
          />
        ))}

        {/* Segmented line - bright colors for visibility */}
        {segmentPaths.map((seg, i) => (
          <path
            key={`line-${i}`}
            d={seg.linePath}
            fill="none"
            stroke={seg.lineColor}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#lineGlow)"
          />
        ))}

        {/* Hover vertical line */}
        {hoverIdx !== null && (
          <line
            x1={getPoint(hoverIdx).x}
            y1={padding}
            x2={getPoint(hoverIdx).x}
            y2={bottomY}
            stroke={themeColors.textMuted}
            strokeWidth="0.4"
            strokeDasharray="2,2"
            strokeOpacity="0.6"
          />
        )}

        {/* Hover point */}
        {hoverIdx !== null && (
          <circle
            cx={getPoint(hoverIdx).x}
            cy={getPoint(hoverIdx).y}
            r="1.5"
            fill={dailyChanges[hoverIdx] >= 0 ? goldBright : redBright}
            stroke={themeColors.bgCard}
            strokeWidth="0.8"
          />
        )}

        {/* End point marker */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2"
          fill={dailyChanges[data.length - 1] >= 0 ? goldBright : redBright}
          stroke={themeColors.bgCard}
          strokeWidth="0.8"
          filter="url(#lineGlow)"
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 80,
          background: themeColors.bgCard,
          border: `1px solid ${themeColors.border}`,
          padding: '12px 16px',
          borderRadius: 10,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${themeColors.border}`,
          backdropFilter: 'blur(12px)',
          minWidth: 120,
        }}>
          <div style={{ color: themeColors.textMuted, marginBottom: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Trade #{tooltip.trade}
          </div>
          <div style={{
            fontWeight: 700,
            fontSize: 16,
            color: tooltip.pnl >= 0 ? goldColor : redColor,
            fontFamily: fontFamily.mono,
            marginBottom: 6,
          }}>
            {formatCurrency(tooltip.pnl)}
          </div>
          <div style={{
            fontSize: 11,
            color: tooltip.dailyChange >= 0 ? goldColor : redColor,
            fontFamily: fontFamily.mono,
            opacity: 0.85,
          }}>
            {tooltip.dailyChange >= 0 ? '+' : ''}{formatCurrency(tooltip.dailyChange)}
            <span style={{ color: themeColors.textMuted, marginLeft: 4 }}>change</span>
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
        <span style={{ fontSize: 10, color: themeColors.textMuted, opacity: 0.7 }}>Trade 1</span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: finalPnl >= 0 ? `${goldColor}12` : `${redColor}12`,
          borderRadius: 8,
          border: `1px solid ${finalPnl >= 0 ? goldColor : redColor}25`,
        }}>
          <span style={{ fontSize: 10, color: themeColors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final P&L</span>
          <span style={{
            color: finalPnl >= 0 ? goldColor : redColor,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: fontFamily.mono,
          }}>
            {formatCurrency(finalPnl)}
          </span>
        </div>
        <span style={{ fontSize: 10, color: themeColors.textMuted, opacity: 0.7 }}>Trade {data.length}</span>
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
