// pages/index.js
import { useEffect, useMemo, useState } from 'react';
import {
  fetchStatus,
  fetchLatestCycle,
  fetchRecentTrades,
  fetchRecentShadowLogs,
  fetchActivePositions,
  fetchDailyPnl,
  runDecisionCycle,
  forceExitAll,
} from '../lib/api';
import { useTheme } from '../lib/themeContext';
import {
  colors,
  darkTheme,
  lightTheme,
  borderRadius,
  cardStyle,
  buttonStyle,
  buttonPrimaryStyle,
  buttonDangerStyle,
  buttonGhostStyle,
  toggleOnStyle,
  toggleOffStyle,
  tableRowHoverBg,
  skeletonStyle,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
  getGlassStyle,
} from '../lib/theme';
import Layout from '../components/Layout';

export default function Home() {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const glassStyle = getGlassStyle(theme);

  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [err, setErr] = useState(null);
  const [acting, setActing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSec, setRefreshSec] = useState(10);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [trades, setTrades] = useState([]);
  const [todayPnl, setTodayPnl] = useState(null);
  const [shadowLogs, setShadowLogs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [dailyPnl, setDailyPnl] = useState([]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // Collapsible sections
  const [chartsOpen, setChartsOpen] = useState(true);
  const [tablesOpen, setTablesOpen] = useState(true);

  async function load({ silent = false } = {}) {
    try {
      if (!silent) setErr(null);
      const s = await fetchStatus();
      setStatus(s);
      const latest = await fetchLatestCycle();
      setCycle(latest?.cycle ?? null);
      const tradesRes = await fetchRecentTrades(10);
      setTrades(tradesRes?.trades || []);
      setTodayPnl(tradesRes?.today_pnl ?? null);
      const shadowRes = await fetchRecentShadowLogs(10);
      setShadowLogs(shadowRes?.logs || []);
      const posRes = await fetchActivePositions();
      setPositions(posRes?.positions || []);
      const pnlRes = await fetchDailyPnl(14);
      setDailyPnl(pnlRes?.data || []);
      setLastRefresh(new Date().toISOString());
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await load({ silent: true });
    };
    const ms = Math.max(3, Number(refreshSec || 10)) * 1000;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [autoRefresh, refreshSec]);

  const rawRows = Array.isArray(cycle?.rows) ? cycle.rows : [];
  const ts = cycle?.ts ?? null;
  const unrealized = cycle?.unrealized ?? null;

  const { candlesOkPct, noPrice, total, activePositions } = useMemo(() => {
    const total = rawRows.length || 0;
    const noPrice = rawRows.filter((r) => r?.last_price == null).length;
    const activePositions = rawRows.filter((r) => r?.position_qty && r.position_qty !== 0).length;
    const candlesOkPct = total ? Math.round(((total - noPrice) / total) * 100) : 0;
    return { candlesOkPct, noPrice, total, activePositions };
  }, [rawRows]);

  const winRate = useMemo(() => {
    const completed = trades.filter(t => t.win !== undefined);
    if (!completed.length) return null;
    const wins = completed.filter(t => t.win).length;
    return Math.round((wins / completed.length) * 100);
  }, [trades]);

  // Calculate top performing tickers from trades
  const topTickers = useMemo(() => {
    const bySymbol = {};
    trades.forEach(t => {
      const sym = t.symbol;
      if (!sym) return;
      if (!bySymbol[sym]) bySymbol[sym] = 0;
      bySymbol[sym] += Number(t.pnl || 0);
    });
    return Object.entries(bySymbol)
      .map(([symbol, pnl]) => ({ symbol, pnl }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);
  }, [trades]);

  async function onRunCycle(force = false) {
    setActing(true);
    try {
      await runDecisionCycle(force);
      addToast(force ? 'Forced cycle ran successfully' : 'Cycle ran successfully', 'success');
      await load();
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setActing(false);
    }
  }

  async function onForceExitAll() {
    if (!confirm('Force exit ALL positions right now?')) return;
    setActing(true);
    try {
      await forceExitAll();
      addToast('Force exit requested', 'success');
      await load();
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setActing(false);
    }
  }

  // Show loading skeleton on initial load
  if (status === null) {
    return (
      <Layout active="dashboard">
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
        <div style={{ marginBottom: 24 }}>
          <Skeleton width={180} height={32} />
          <div style={{ marginTop: 8 }}><Skeleton width={280} height={14} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <Skeleton width={100} height={36} />
          <Skeleton width={80} height={36} />
          <Skeleton width={120} height={36} />
          <Skeleton width={80} height={36} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="dashboard">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: spacing.xxl }}>
        <h1 style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.black,
          margin: 0,
          color: colors.textPrimary,
          letterSpacing: '-0.02em',
        }}>
          Dashboard
        </h1>
        <p style={{ margin: `${spacing.sm}px 0 0`, color: colors.textMuted, fontSize: fontSize.base }}>
          Real-time trading overview and controls
        </p>
      </div>

      {err && (
        <div style={{
          ...cardStyle,
          background: '#1a0a0a',
          borderColor: colors.error,
          color: colors.error,
          marginBottom: 16,
        }}>
          {err}
        </div>
      )}

      {/* Status Badges */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatusBadge label="MODE" value={status?.mode} color={status?.mode === 'live' ? colors.warning : colors.accent} />
        <StatusBadge
          label="KILL"
          value={status?.kill_switch}
          color={status?.kill_switch === 'on' ? colors.error : colors.accent}
        />
        <StatusBadge label="LAST CYCLE" value={fmtLocal(status?.last_cycle_ts)} />
        <StatusBadge
          label="POSITIONS"
          value={status?.has_positions ? 'ACTIVE' : 'NONE'}
          color={status?.has_positions ? colors.warning : colors.textMuted}
        />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => onRunCycle(false)} disabled={acting} style={buttonPrimaryStyle}>
          {acting ? 'Working...' : 'Run Cycle'}
        </button>
        <button onClick={() => onRunCycle(true)} disabled={acting} style={buttonStyle}>
          {acting ? 'Working...' : 'Force Cycle'}
        </button>
        <button onClick={onForceExitAll} disabled={acting} style={buttonDangerStyle}>
          {acting ? 'Working...' : 'Force Exit All'}
        </button>
        <button onClick={() => load()} disabled={acting} style={buttonGhostStyle}>
          Refresh
        </button>
      </div>

      {/* Auto-refresh controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: borderRadius.full,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
        }}>
          <span style={{ color: colors.textMuted, fontSize: 13 }}>Auto-refresh</span>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            style={autoRefresh ? toggleOnStyle : toggleOffStyle}
          >
            {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: borderRadius.full,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
        }}>
          <span style={{ color: colors.textMuted, fontSize: 13 }}>Every</span>
          <input
            type="number"
            min="3"
            step="1"
            value={refreshSec}
            onChange={(e) => setRefreshSec(Number(e.target.value || 10))}
            style={{
              width: 60,
              padding: '4px 8px',
              borderRadius: borderRadius.sm,
              border: `1px solid ${colors.border}`,
              background: colors.bgPrimary,
              color: colors.textPrimary,
              textAlign: 'center',
            }}
          />
          <span style={{ color: colors.textMuted, fontSize: 13 }}>sec</span>
        </div>
        <span style={{ color: colors.textMuted, fontSize: 12 }}>
          Last: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : '—'}
        </span>
      </div>

      {/* Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <MetricCard
          title="Latest Cycle"
          value={fmtTime(ts)}
          subtitle={ts ? new Date(ts).toLocaleDateString() : '—'}
          themeColors={colors}
          glassStyle={glassStyle}
        />
        <MetricCard
          title="Unrealized P&L"
          value={formatCurrency(unrealized)}
          color={unrealized > 0 ? colors.accent : unrealized < 0 ? colors.error : colors.textPrimary}
          trend={unrealized != null ? (unrealized > 0 ? 1 : unrealized < 0 ? -1 : 0) : null}
          themeColors={colors}
          glassStyle={glassStyle}
        />
        <MetricCard
          title="Today's P&L"
          value={formatCurrency(todayPnl)}
          subtitle="realized"
          color={todayPnl > 0 ? colors.accent : todayPnl < 0 ? colors.error : colors.textPrimary}
          trend={todayPnl != null ? (todayPnl > 0 ? 1 : todayPnl < 0 ? -1 : 0) : null}
          sparklineData={dailyPnl.slice(-7).map(d => d.pnl || 0)}
          themeColors={colors}
          glassStyle={glassStyle}
        />
        <MetricCard
          title="Active Positions"
          value={`${activePositions}/${total}`}
          subtitle="symbols"
          themeColors={colors}
          glassStyle={glassStyle}
        />
        <MetricCard
          title="Data Health"
          value={`${candlesOkPct}%`}
          subtitle={`${total - noPrice}/${total} candles OK`}
          color={candlesOkPct >= 80 ? colors.accent : candlesOkPct >= 50 ? colors.warning : colors.error}
          themeColors={colors}
          glassStyle={glassStyle}
        />
        <MetricCard
          title="Win Rate"
          value={winRate != null ? `${winRate}%` : '—'}
          subtitle={`${trades.filter(t => t.win).length}/${trades.filter(t => t.win !== undefined).length} wins`}
          color={winRate >= 50 ? colors.accent : winRate != null ? colors.error : colors.textPrimary}
          themeColors={colors}
          glassStyle={glassStyle}
        />
      </div>

      {/* Charts Section */}
      <SectionHeader title="Charts" isOpen={chartsOpen} onToggle={() => setChartsOpen(!chartsOpen)} />
      {chartsOpen && (
        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          {/* P&L History Chart */}
          <div style={cardStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary }}>P&L History</span>
              <span style={{ fontSize: 14, color: colors.textMuted }}>Last 14 days</span>
            </div>
            <PnlBarChart data={dailyPnl} />
          </div>

          {/* Top Tickers Chart */}
          <div style={cardStyle}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary }}>Top Performers</span>
              <span style={{ fontSize: 14, color: colors.textMuted }}>By P&L</span>
            </div>
            <TopTickersChart data={topTickers} />
          </div>
        </div>
      )}

      {/* Active Positions Panel */}
      {positions.length > 0 && (
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'hidden',
          marginTop: 24,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontWeight: 800, color: colors.textPrimary }}>Active Positions</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: colors.textMuted }}>Live from Alpaca</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <Th>Symbol</Th>
                <Th>Side</Th>
                <Th>Qty</Th>
                <Th>Entry</Th>
                <Th>Current</Th>
                <Th>Unrealized P&L</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <PnlRow key={i} pnl={p.unrealized_pnl} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <Td style={{ fontWeight: 700 }}>{p.symbol}</Td>
                  <Td>
                    <span style={{ color: p.side === 'LONG' ? colors.accent : colors.error }}>
                      {p.side}
                    </span>
                  </Td>
                  <Td style={{ fontFamily: fontFamily.mono }}>{p.qty}</Td>
                  <Td style={{ fontFamily: fontFamily.mono }}>{formatCurrency(p.entry_price, false)}</Td>
                  <Td style={{ fontFamily: fontFamily.mono }}>{formatCurrency(p.current_price, false)}</Td>
                  <Td style={{
                    fontFamily: fontFamily.mono,
                    fontWeight: 700,
                    color: p.unrealized_pnl > 0 ? colors.accent : p.unrealized_pnl < 0 ? colors.error : colors.textPrimary,
                  }}>
                    {formatCurrency(p.unrealized_pnl)}
                  </Td>
                </PnlRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tables Section */}
      <SectionHeader title="Activity" isOpen={tablesOpen} onToggle={() => setTablesOpen(!tablesOpen)} />
      {tablesOpen && (
      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {/* Recent Trades Table */}
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>Recent Trades</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <Th>Time</Th>
                <Th>Symbol</Th>
                <Th>Side</Th>
                <Th>P&L</Th>
                <Th>Result</Th>
              </tr>
            </thead>
            <tbody>
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No completed trades yet" icon="~" />
                  </td>
                </tr>
              ) : (
                trades.map((t, i) => (
                  <PnlRow key={i} pnl={t.pnl} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <Td style={{ fontSize: 13, color: colors.textMuted }}>
                      {t.ts ? new Date(t.ts).toLocaleTimeString() : '—'}
                    </Td>
                    <Td style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</Td>
                    <Td style={{ fontSize: 14 }}>
                      <span style={{ color: t.side === 'BUY' ? colors.accent : colors.error }}>
                        {t.side}
                      </span>
                    </Td>
                    <Td style={{
                      fontFamily: fontFamily.mono,
                      fontSize: 14,
                      color: t.pnl > 0 ? colors.accent : t.pnl < 0 ? colors.error : colors.textPrimary,
                    }}>
                      {formatCurrency(t.pnl)}
                    </Td>
                    <Td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: t.win ? colors.accentDark : '#1a0a0a',
                        color: t.win ? colors.accent : colors.error,
                        fontWeight: 700,
                        fontSize: 13,
                      }}>
                        {t.win ? 'WIN' : 'LOSS'}
                      </span>
                    </Td>
                  </PnlRow>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Shadow Logs Table */}
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>Shadow Logs</span>
            <span style={{ marginLeft: 8, fontSize: 13, color: colors.textMuted }}>ML Predictions</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <Th>Time</Th>
                <Th>Symbol</Th>
                <Th>Label</Th>
                <Th>Win %</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {shadowLogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message="No shadow logs yet" icon="~" />
                  </td>
                </tr>
              ) : (
                shadowLogs.map((s, i) => (
                  <HoverRow key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                    <Td style={{ fontSize: 13, color: colors.textMuted }}>
                      {s.ts ? new Date(s.ts).toLocaleTimeString() : '—'}
                    </Td>
                    <Td style={{ fontWeight: 700, fontSize: 14 }}>{s.symbol}</Td>
                    <Td style={{ fontSize: 14 }}>
                      <span style={{
                        color: s.ml_label === 'BUY' ? colors.accent : s.ml_label === 'SELL' ? colors.error : colors.textMuted,
                        fontWeight: 700,
                      }}>
                        {s.ml_label || '—'}
                      </span>
                    </Td>
                    <Td style={{ fontFamily: fontFamily.mono, fontSize: 14 }}>
                      {s.ml_win_prob != null ? `${(s.ml_win_prob * 100).toFixed(0)}%` : '—'}
                    </Td>
                    <Td style={{ fontSize: 14 }}>
                      <span style={{
                        color: s.bot_action === 'BUY' ? colors.accent : s.bot_action === 'SELL' ? colors.error : colors.textMuted,
                      }}>
                        {s.bot_action || '—'}
                      </span>
                    </Td>
                  </HoverRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

    </Layout>
  );
}

// P&L Bar Chart Component with Tooltips
function PnlBarChart({ data }) {
  const [tooltip, setTooltip] = useState(null);

  // Filter out weekends and zero PnL days
  const filtered = (data || []).filter(d => {
    if (!d.date) return false;
    const date = new Date(d.date + 'T00:00:00');
    const day = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday) and zero PnL
    return day !== 0 && day !== 6 && d.pnl !== 0;
  });

  if (filtered.length === 0) {
    return <EmptyState message="No P&L data yet" icon="~" />;
  }

  const maxAbs = Math.max(...filtered.map(d => Math.abs(d.pnl)), 1);
  const chartHeight = 220;
  const barWidth = 100 / filtered.length;

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" height={chartHeight} style={{ display: 'block' }}>
        {/* Zero line */}
        <line
          x1="0"
          y1={chartHeight / 2}
          x2="100%"
          y2={chartHeight / 2}
          stroke={colors.border}
          strokeWidth="1"
        />
        {/* Bars */}
        {filtered.map((d, i) => {
          const pnl = d.pnl || 0;
          const barHeight = Math.abs(pnl) / maxAbs * (chartHeight / 2 - 4);
          const isPositive = pnl >= 0;
          const y = isPositive ? chartHeight / 2 - barHeight : chartHeight / 2;
          const x = `${i * barWidth + barWidth * 0.1}%`;
          const width = `${barWidth * 0.8}%`;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={width}
                height={Math.max(barHeight, 2)}
                fill={isPositive ? colors.accent : colors.error}
                rx="4"
                opacity="0.8"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, date: d.date, pnl })}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}
      </svg>
      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 10,
          top: tooltip.y - 50,
          background: colors.bgSecondary,
          border: `1px solid ${colors.border}`,
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <div style={{ color: colors.textMuted, marginBottom: 4 }}>
            {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: tooltip.pnl >= 0 ? colors.accent : colors.error }}>
            {formatCurrency(tooltip.pnl, false)}
          </div>
        </div>
      )}
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {filtered.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: 12,
              color: colors.textMuted,
            }}>
              {d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '—'}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: fontFamily.mono,
              fontWeight: 600,
              color: d.pnl > 0 ? colors.accent : d.pnl < 0 ? colors.error : colors.textMuted,
            }}>
              {formatCurrency(d.pnl, true)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Top Tickers Horizontal Bar Chart
function TopTickersChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No ticker data yet" icon="~" />;
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const barHeight = 36;
  const chartHeight = data.length * (barHeight + 12);

  return (
    <div style={{ minHeight: 220 }}>
      {data.map((d, i) => {
        const pnl = d.pnl || 0;
        const barWidth = Math.abs(pnl) / maxAbs * 100;
        const isPositive = pnl >= 0;

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}>
            <span style={{
              width: 60,
              fontWeight: 700,
              fontSize: 15,
              color: colors.textPrimary,
            }}>
              {d.symbol}
            </span>
            <div style={{
              flex: 1,
              height: barHeight,
              background: colors.bgSecondary,
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${Math.max(barWidth, 2)}%`,
                height: '100%',
                background: isPositive ? colors.accent : colors.error,
                opacity: 0.8,
                borderRadius: 6,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              width: 80,
              textAlign: 'right',
              fontFamily: fontFamily.mono,
              fontSize: 15,
              fontWeight: 700,
              color: isPositive ? colors.accent : colors.error,
            }}>
              {formatCurrency(pnl)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Components

// Toast notification
function Toast({ message, type = 'success', onClose }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      padding: '14px 18px',
      borderRadius: borderRadius.lg,
      background: type === 'error' ? colors.errorDark : colors.accentDark,
      border: `1px solid ${type === 'error' ? 'rgba(255, 95, 109, 0.3)' : colors.accentMuted}`,
      color: type === 'error' ? colors.error : colors.accent,
      boxShadow: shadows.lg,
      animation: 'slideIn 0.3s ease',
      minWidth: 280,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold }}>{type === 'error' ? '!' : '+'}</span>
      <span style={{ flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.semibold }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: 4,
          opacity: 0.7,
          fontSize: fontSize.md,
          transition: `opacity ${transitions.fast}`,
        }}
      >
        x
      </button>
    </div>
  );
}

// Collapsible section header
function SectionHeader({ title, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '12px 0',
        marginBottom: 12,
        background: 'none',
        border: 'none',
        borderBottom: `1px solid ${colors.border}`,
        cursor: 'pointer',
        color: colors.textPrimary,
      }}
    >
      <span style={{
        fontSize: 12,
        color: colors.textMuted,
        transition: 'transform 0.2s ease',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      }}>
        {'>'}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </span>
      <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>
        {isOpen ? 'collapse' : 'expand'}
      </span>
    </button>
  );
}

function StatusBadge({ label, value, color = colors.textPrimary }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.md,
      padding: '10px 18px',
      borderRadius: borderRadius.full,
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.sm,
    }}>
      <span style={{
        color: colors.textMuted,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>{label}</span>
      <span style={{
        color,
        fontWeight: fontWeight.bold,
        fontSize: fontSize.sm,
        fontFamily: fontFamily.mono,
      }}>{String(value ?? '—')}</span>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color, trend, sparklineData, themeColors = darkTheme, glassStyle }) {
  const [hovered, setHovered] = useState(false);
  const effectiveColor = color || themeColors.textPrimary;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        ...(glassStyle || {}),
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        transition: `all ${transitions.normal}`,
        borderColor: hovered ? themeColors.borderAccent : themeColors.border,
        boxShadow: hovered ? `${shadows.md}, ${shadows.glow}` : shadows.md,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <span style={{
        color: themeColors.textMuted,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: spacing.sm }}>
        <span style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.black,
          color: effectiveColor,
          fontFamily: fontFamily.mono,
          letterSpacing: '-0.02em',
        }}>{value}</span>
        {trend != null && (
          <span style={{
            marginLeft: spacing.sm,
            fontSize: fontSize.lg,
            color: trend > 0 ? themeColors.accent : trend < 0 ? themeColors.error : themeColors.textMuted
          }}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
          </span>
        )}
      </div>
      {sparklineData && <Sparkline data={sparklineData} color={effectiveColor !== themeColors.textPrimary ? effectiveColor : themeColors.accent} />}
      {subtitle && (
        <span style={{ color: themeColors.textMuted, fontSize: fontSize.xs, marginTop: spacing.sm }}>{subtitle}</span>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '14px 16px',
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {children}
    </th>
  );
}

function Td({ children, style = {} }) {
  return (
    <td style={{ padding: '14px 16px', fontSize: fontSize.sm, ...style }}>
      {children}
    </td>
  );
}

function HoverRow({ children, style = {} }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: hovered ? tableRowHoverBg : 'transparent',
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </tr>
  );
}

function Skeleton({ width = '100%', height = 20 }) {
  return (
    <div style={{
      ...skeletonStyle,
      width,
      height,
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

function SkeletonCard() {
  return (
    <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Skeleton width="60%" height={14} />
      <Skeleton width="80%" height={28} />
      <Skeleton width="40%" height={12} />
    </div>
  );
}

// Currency formatting helper
function formatCurrency(val, compact = true) {
  if (val == null) return '—';
  const num = Number(val);
  if (!compact || Math.abs(num) < 1000) {
    return `$${num.toFixed(2)}`;
  }
  return `$${(num / 1000).toFixed(1)}K`;
}

// Sparkline component
function Sparkline({ data, color = colors.accent }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * 60},${20 - ((v - min) / range) * 18}`
  ).join(' ');

  return (
    <svg width="60" height="20" style={{ marginTop: 8 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

// Empty state component
function EmptyState({ message, icon = '~' }) {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: colors.textMuted,
    }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

// Color-coded row based on P&L
function PnlRow({ children, pnl, style = {} }) {
  const [hovered, setHovered] = useState(false);
  const bgTint = pnl > 0 ? 'rgba(0, 255, 136, 0.05)'
               : pnl < 0 ? 'rgba(255, 71, 87, 0.05)'
               : 'transparent';
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: hovered ? tableRowHoverBg : bgTint,
        transition: 'background 0.15s ease',
      }}
    >
      {children}
    </tr>
  );
}

// Helpers
function parseTs(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const normalized = String(v).includes('T') ? String(v) : String(v).replace(' ', 'T');
  const d = new Date(normalized);
  return isFinite(d.getTime()) ? d : null;
}

function fmtLocal(v) {
  const d = parseTs(v);
  return d ? d.toLocaleString() : '—';
}

function fmtTime(v) {
  const d = parseTs(v);
  return d ? d.toLocaleTimeString() : '—';
}
