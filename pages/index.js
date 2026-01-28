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
import {
  colors,
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
} from '../lib/theme';
import Layout from '../components/Layout';

export default function Home() {
  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [err, setErr] = useState(null);
  const [acting, setActing] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSec, setRefreshSec] = useState(10);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [trades, setTrades] = useState([]);
  const [todayPnl, setTodayPnl] = useState(null);
  const [shadowLogs, setShadowLogs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [dailyPnl, setDailyPnl] = useState([]);

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
    setActionMsg(null);
    setActionErr(null);
    try {
      await runDecisionCycle(force);
      setActionMsg(force ? 'Forced cycle ran' : 'Cycle ran');
      await load();
    } catch (e) {
      setActionErr(String(e?.message || e));
    } finally {
      setActing(false);
    }
  }

  async function onForceExitAll() {
    if (!confirm('Force exit ALL positions right now?')) return;
    setActing(true);
    setActionMsg(null);
    setActionErr(null);
    try {
      await forceExitAll();
      setActionMsg('Force exit requested');
      await load();
    } catch (e) {
      setActionErr(String(e?.message || e));
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
      `}</style>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Dashboard
        </h1>
        <p style={{ margin: '10px 0 0', color: colors.textMuted, fontSize: 15 }}>
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

      {actionMsg && (
        <div style={{ marginBottom: 16, color: colors.accent, fontWeight: 700 }}>
          {actionMsg}
        </div>
      )}
      {actionErr && (
        <div style={{ marginBottom: 16, color: colors.error }}>{actionErr}</div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <MetricCard
          title="Latest Cycle"
          value={fmtTime(ts)}
          subtitle={ts ? new Date(ts).toLocaleDateString() : '—'}
        />
        <MetricCard
          title="Unrealized P&L"
          value={unrealized != null ? `$${Number(unrealized).toFixed(2)}` : '—'}
          color={unrealized > 0 ? colors.accent : unrealized < 0 ? colors.error : colors.textPrimary}
        />
        <MetricCard
          title="Today's P&L"
          value={todayPnl != null ? `$${Number(todayPnl).toFixed(2)}` : '—'}
          subtitle="realized"
          color={todayPnl > 0 ? colors.accent : todayPnl < 0 ? colors.error : colors.textPrimary}
        />
        <MetricCard
          title="Active Positions"
          value={`${activePositions}/${total}`}
          subtitle="symbols"
        />
        <MetricCard
          title="Data Health"
          value={`${candlesOkPct}%`}
          subtitle={`${total - noPrice}/${total} candles OK`}
          color={candlesOkPct >= 80 ? colors.accent : candlesOkPct >= 50 ? colors.warning : colors.error}
        />
        <MetricCard
          title="Win Rate"
          value={winRate != null ? `${winRate}%` : '—'}
          subtitle={`${trades.filter(t => t.win).length}/${trades.filter(t => t.win !== undefined).length} wins`}
          color={winRate >= 50 ? colors.accent : winRate != null ? colors.error : colors.textPrimary}
        />
      </div>

      {/* Charts Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
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
                <HoverRow key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <Td style={{ fontWeight: 700 }}>{p.symbol}</Td>
                  <Td>
                    <span style={{ color: p.side === 'LONG' ? colors.accent : colors.error }}>
                      {p.side}
                    </span>
                  </Td>
                  <Td style={{ fontFamily: 'monospace' }}>{p.qty}</Td>
                  <Td style={{ fontFamily: 'monospace' }}>${Number(p.entry_price).toFixed(2)}</Td>
                  <Td style={{ fontFamily: 'monospace' }}>${Number(p.current_price).toFixed(2)}</Td>
                  <Td style={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: p.unrealized_pnl > 0 ? colors.accent : p.unrealized_pnl < 0 ? colors.error : colors.textPrimary,
                  }}>
                    ${Number(p.unrealized_pnl).toFixed(2)}
                  </Td>
                </HoverRow>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tables Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
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
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                    No completed trades yet.
                  </td>
                </tr>
              ) : (
                trades.map((t, i) => (
                  <HoverRow key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
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
                      fontFamily: 'monospace',
                      fontSize: 14,
                      color: t.pnl > 0 ? colors.accent : t.pnl < 0 ? colors.error : colors.textPrimary,
                    }}>
                      ${Number(t.pnl || 0).toFixed(2)}
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
                  </HoverRow>
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
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                    No shadow logs yet.
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
                    <Td style={{ fontFamily: 'monospace', fontSize: 14 }}>
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

    </Layout>
  );
}

// P&L Bar Chart Component
function PnlBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 15 }}>
        No P&L data yet.
      </div>
    );
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const chartHeight = 220;
  const barWidth = 100 / data.length;

  return (
    <div>
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
        {data.map((d, i) => {
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
              />
            </g>
          );
        })}
      </svg>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {data.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              fontSize: 12,
              color: colors.textMuted,
            }}>
              {d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '—'}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: 'monospace',
              fontWeight: 600,
              color: d.pnl > 0 ? colors.accent : d.pnl < 0 ? colors.error : colors.textMuted,
            }}>
              ${d.pnl?.toFixed(0) ?? 0}
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
    return (
      <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 15 }}>
        No ticker data yet.
      </div>
    );
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
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 700,
              color: isPositive ? colors.accent : colors.error,
            }}>
              ${pnl.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Components
function StatusBadge({ label, value, color = colors.textPrimary }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderRadius: borderRadius.full,
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
    }}>
      <span style={{ color: colors.textMuted, fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: 800, fontSize: 15 }}>{String(value ?? '—')}</span>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color = colors.textPrimary }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        ...(hovered ? {
          borderColor: colors.borderAccent,
          boxShadow: `0 0 20px ${colors.accentGlow}`,
        } : {}),
      }}
    >
      <span style={{ color: colors.textMuted, fontSize: 14, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 32, fontWeight: 900, color, marginTop: 6 }}>{value}</span>
      {subtitle && (
        <span style={{ color: colors.textMuted, fontSize: 13, marginTop: 6 }}>{subtitle}</span>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '14px 16px',
      fontSize: 13,
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
    <td style={{ padding: '14px 16px', fontSize: 15, ...style }}>
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
