// pages/analytics.js
import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import { fetchPerformanceMetrics } from '../lib/api';
import { useTheme } from '../lib/themeContext';
import {
  darkTheme,
  lightTheme,
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
  getVisualEffects,
  lookbackOptions,
  getGlassStyle,
} from '../lib/theme';

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const effects = getVisualEffects(theme);
  const glassStyle = getGlassStyle(theme);

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

      {/* Grid pattern background overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: effects.gridPattern,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {/* By Symbol */}
              <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
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
        boxShadow: hovered
          ? `${shadows.md}, ${shadows.glow}`
          : glow && effectiveColor !== themeColors.textPrimary
            ? `${shadows.md}, 0 0 15px ${effectiveColor}20`
            : shadows.md,
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
      marginBottom: 8,
      padding: '8px 0',
      borderBottom: `1px solid ${themeColors.border}`,
    }}>
      <span style={{
        width: 60,
        fontWeight: 700,
        fontSize: 14,
        color: themeColors.textPrimary,
      }}>
        {data.symbol}
      </span>
      <div style={{
        flex: 1,
        height: 20,
        background: themeColors.bgSecondary,
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.max(barWidth, 2)}%`,
          height: '100%',
          background: isPositive ? themeColors.accent : themeColors.error,
          opacity: 0.8,
          borderRadius: 4,
        }} />
      </div>
      <span style={{
        width: 70,
        textAlign: 'right',
        fontFamily: fontFamily.mono,
        fontSize: 13,
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

  const finalPnl = data[data.length - 1];

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        style={{ cursor: 'crosshair' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const idx = Math.round(x * (data.length - 1));
          if (idx >= 0 && idx < data.length) {
            setTooltip({
              x: e.clientX,
              y: e.clientY,
              trade: idx + 1,
              pnl: data[idx],
            });
          }
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line
            key={pct}
            x1="0"
            y1={chartHeight * pct}
            x2={chartWidth}
            y2={chartHeight * pct}
            stroke={themeColors.border}
            strokeWidth="0.3"
          />
        ))}
        {/* Zero line */}
        <line
          x1="0"
          y1={zeroY}
          x2={chartWidth}
          y2={zeroY}
          stroke={themeColors.border}
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
        {/* Gradient fill */}
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={finalPnl >= 0 ? themeColors.accent : themeColors.error} stopOpacity="0.3" />
            <stop offset="100%" stopColor={finalPnl >= 0 ? themeColors.accent : themeColors.error} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${zeroY} ${points} ${chartWidth},${zeroY}`}
          fill="url(#pnlGradient)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={finalPnl >= 0 ? themeColors.accent : themeColors.error}
          strokeWidth="1.5"
          style={{ filter: `drop-shadow(0 0 4px ${finalPnl >= 0 ? themeColors.accent : themeColors.error}60)` }}
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 10,
          top: tooltip.y - 50,
          background: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <div style={{ color: themeColors.textMuted, marginBottom: 4 }}>
            Trade #{tooltip.trade}
          </div>
          <div style={{
            fontWeight: 700,
            fontSize: 14,
            color: tooltip.pnl >= 0 ? themeColors.accent : themeColors.error,
          }}>
            {formatCurrency(tooltip.pnl)}
          </div>
        </div>
      )}

      {/* Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 8,
        fontSize: 12,
        color: themeColors.textMuted,
      }}>
        <span>Trade 1</span>
        <span style={{
          color: finalPnl >= 0 ? themeColors.accent : themeColors.error,
          fontWeight: 700,
        }}>
          Final: {formatCurrency(finalPnl)}
        </span>
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
