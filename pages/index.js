// pages/index.js
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchStatus,
  fetchLatestCycle,
  fetchRecentTrades,
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
  decisionColors,
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
  const prevRowsRef = useRef(new Map());

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

  // Filter out outside_window and only show valid decisions (HOLD, BUY, SELL)
  const rows = rawRows.filter((r) => {
    if (r?.hold_reason === 'outside_window') return false;
    const d = r?.decision;
    return d === 'HOLD' || d === 'BUY' || d === 'SELL';
  });

  const { candlesOkPct, mqPresentPct, noPrice, mqNull, total, activePositions } = useMemo(() => {
    const total = rawRows.length || 0;
    const noPrice = rawRows.filter((r) => r?.last_price == null).length;
    const mqNull = rawRows.filter((r) => r?.mq_ok == null).length;
    const activePositions = rawRows.filter((r) => r?.position_qty && r.position_qty !== 0).length;
    const candlesOkPct = total ? Math.round(((total - noPrice) / total) * 100) : 0;
    const mqPresentPct = total ? Math.round(((total - mqNull) / total) * 100) : 0;
    return { candlesOkPct, mqPresentPct, noPrice, mqNull, total, activePositions };
  }, [rawRows]);

  const changedSymbols = useMemo(() => {
    const changed = new Set();
    const prevMap = prevRowsRef.current;
    for (const r of rows) {
      const sym = r?.symbol;
      if (!sym) continue;
      const prev = prevMap.get(sym);
      if (!prev) continue;
      if (rowSignature(r) !== rowSignature(prev)) changed.add(sym);
    }
    return changed;
  }, [rows, ts]);

  useEffect(() => {
    const nextMap = new Map();
    for (const r of rows) {
      if (r?.symbol) nextMap.set(r.symbol, r);
    }
    prevRowsRef.current = nextMap;
  }, [rows, ts]);

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

  return (
    <Layout active="dashboard">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Dashboard
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
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
      </div>

      {/* Trading Table */}
      <div style={{
        ...cardStyle,
        padding: 0,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              <Th>Symbol</Th>
              <Th>Decision</Th>
              <Th>Confidence</Th>
              <Th>Hold Reason</Th>
              <Th>Price</Th>
              <Th>Position</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>
                  No data yet. Run a cycle to see results.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isChanged = changedSymbols.has(r.symbol);
                const decisionColor = decisionColors[r.decision] || colors.textMuted;

                return (
                  <tr
                    key={r.symbol}
                    style={{
                      borderTop: `1px solid ${colors.border}`,
                      background: isChanged ? 'rgba(0, 255, 136, 0.05)' : 'transparent',
                      transition: 'background 0.3s ease',
                    }}
                  >
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700 }}>{r.symbol}</span>
                        {isChanged && (
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: colors.accent,
                          }} />
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span style={{
                        fontWeight: 800,
                        color: decisionColor,
                        padding: '2px 8px',
                        borderRadius: borderRadius.sm,
                        background: `${decisionColor}15`,
                      }}>
                        {r.decision ?? '—'}
                      </span>
                    </Td>
                    <Td>
                      <ConfidenceBar value={r.confidence} />
                    </Td>
                    <Td style={{ color: colors.textMuted, fontSize: 12 }}>
                      {r.hold_reason ?? '—'}
                    </Td>
                    <Td style={{ fontFamily: 'monospace' }}>
                      {r.last_price ? `$${Number(r.last_price).toFixed(2)}` : '—'}
                    </Td>
                    <Td>
                      {r.position_qty ? (
                        <span style={{
                          color: r.position_side === 'long' ? colors.accent : colors.error,
                          fontWeight: 600,
                        }}>
                          {r.position_side} ({r.position_qty})
                        </span>
                      ) : (
                        <span style={{ color: colors.textMuted }}>flat</span>
                      )}
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Trades Table */}
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
          <span style={{ fontWeight: 800, color: colors.textPrimary }}>Recent Trades</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: colors.bgSecondary }}>
              <Th>Time</Th>
              <Th>Symbol</Th>
              <Th>Side</Th>
              <Th>P&L</Th>
              <Th>Result</Th>
              <Th>Exit Reason</Th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: colors.textMuted }}>
                  No completed trades yet.
                </td>
              </tr>
            ) : (
              trades.map((t, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${colors.border}` }}>
                  <Td style={{ fontSize: 12, color: colors.textMuted }}>
                    {t.ts ? new Date(t.ts).toLocaleTimeString() : '—'}
                  </Td>
                  <Td style={{ fontWeight: 700 }}>{t.symbol}</Td>
                  <Td>
                    <span style={{ color: t.side === 'BUY' ? colors.accent : colors.error }}>
                      {t.side}
                    </span>
                  </Td>
                  <Td style={{
                    fontFamily: 'monospace',
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
                      fontSize: 12,
                    }}>
                      {t.win ? 'WIN' : 'LOSS'}
                    </span>
                  </Td>
                  <Td style={{ fontSize: 12, color: colors.textMuted }}>
                    {t.exit_reason || '—'}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

// Components
function StatusBadge({ label, value, color = colors.textPrimary }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      borderRadius: borderRadius.full,
      background: colors.bgCard,
      border: `1px solid ${colors.border}`,
    }}>
      <span style={{ color: colors.textMuted, fontSize: 11, fontWeight: 600 }}>{label}</span>
      <span style={{ color, fontWeight: 800, fontSize: 13 }}>{String(value ?? '—')}</span>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color = colors.textPrimary }) {
  return (
    <div style={{
      ...cardStyle,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <span style={{ color: colors.textMuted, fontSize: 12, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 24, fontWeight: 900, color, marginTop: 4 }}>{value}</span>
      {subtitle && (
        <span style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>{subtitle}</span>
      )}
    </div>
  );
}

function ConfidenceBar({ value }) {
  const pct = typeof value === 'number' ? Math.round(value * 100) : 0;
  const color = pct >= 70 ? colors.accent : pct >= 50 ? colors.warning : colors.textMuted;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 60,
        height: 6,
        borderRadius: 3,
        background: colors.bgSecondary,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 35 }}>
        {pct}%
      </span>
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '12px 16px',
      fontSize: 11,
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
    <td style={{ padding: '12px 16px', ...style }}>
      {children}
    </td>
  );
}

// Helpers
function rowSignature(r) {
  return JSON.stringify([
    r?.last_price ?? null,
    r?.decision ?? null,
    typeof r?.confidence === 'number' ? Number(r.confidence.toFixed(3)) : null,
    r?.hold_reason ?? null,
    r?.position_side ?? null,
    typeof r?.position_qty === 'number' ? Number(r.position_qty.toFixed(6)) : null,
  ]);
}

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
