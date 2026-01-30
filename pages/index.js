// pages/index.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  fetchStatus,
  fetchLatestCycle,
  fetchRecentTrades,
  fetchRecentShadowLogs,
  fetchActivePositions,
  fetchDailyPnl,
  fetchSettings,
  runDecisionCycle,
  forceExitAll,
} from '../lib/api';
import {
  darkTheme,
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
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
  glassStyle,
  visualEffects,
  freshnessColors,
  lookbackOptions,
} from '../lib/theme';
import Layout from '../components/Layout';
import LandingPage from './landing';
import { useAuth } from '../lib/auth';

export default function Home() {
  const { user, loading } = useAuth();

  // Show landing page for unauthenticated users
  if (!loading && !user) {
    return <LandingPage />;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: darkTheme.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${darkTheme.border}`,
          borderTopColor: darkTheme.accent,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Authenticated user - show dashboard
  return <Dashboard />;
}

function Dashboard() {
  const colors = darkTheme;
  const effects = visualEffects;

  const [status, setStatus] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [err, setErr] = useState(null);
  const [acting, setActing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshSec, setRefreshSec] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flux_refresh_sec');
      return saved ? parseInt(saved, 10) : 10;
    }
    return 10;
  });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [trades, setTrades] = useState([]);
  const [todayPnl, setTodayPnl] = useState(null);
  const [shadowLogs, setShadowLogs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [dailyPnl, setDailyPnl] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);

  // Starting funds for % calculation (default $10,000)
  const STARTING_FUNDS = 10000;

  // Lookback controls
  const [tradeLookback, setTradeLookback] = useState(10);
  const [chartDays, setChartDays] = useState(14);
  const [shadowLookback, setShadowLookback] = useState(10);

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

  // Calculate data freshness
  const getFreshnessColor = useCallback((lastUpdate) => {
    if (!lastUpdate) return freshnessColors.old;
    const elapsed = Date.now() - new Date(lastUpdate).getTime();
    if (elapsed < 30000) return freshnessColors.fresh;
    if (elapsed < 120000) return freshnessColors.stale;
    return freshnessColors.old;
  }, []);

  const getFreshnessLabel = useCallback((lastUpdate) => {
    if (!lastUpdate) return 'No data';
    const elapsed = Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000);
    if (elapsed < 60) return `${elapsed}s ago`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    return `${Math.floor(elapsed / 3600)}h ago`;
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setErr(null);
      const s = await fetchStatus();
      setStatus(s);
      const latest = await fetchLatestCycle();
      setCycle(latest?.cycle ?? null);

      // Use lookback values for fetches
      const tradesLimit = tradeLookback === 'today' ? 100 : tradeLookback === 'week' ? 500 : tradeLookback;
      const tradesRes = await fetchRecentTrades(tradesLimit);
      let filteredTrades = tradesRes?.trades || [];

      // Filter by date if needed
      if (tradeLookback === 'today') {
        const today = new Date().toDateString();
        filteredTrades = filteredTrades.filter(t => t.ts && new Date(t.ts).toDateString() === today);
      } else if (tradeLookback === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredTrades = filteredTrades.filter(t => t.ts && new Date(t.ts) >= weekAgo);
      }

      setTrades(filteredTrades);
      setTodayPnl(tradesRes?.today_pnl ?? null);

      const shadowLimit = shadowLookback === 'all' ? 100 : shadowLookback;
      const shadowRes = await fetchRecentShadowLogs(shadowLimit);
      setShadowLogs(shadowRes?.logs || []);

      const posRes = await fetchActivePositions();
      setPositions(posRes?.positions || []);

      const pnlRes = await fetchDailyPnl(chartDays);
      setDailyPnl(pnlRes?.data || []);
      setLastRefresh(new Date().toISOString());

      // Fetch active profile from system settings (non-critical)
      try {
        const settingsRes = await fetchSettings();
        const preset = settingsRes?.settings?.preset_id || settingsRes?.preset_id;
        setActiveProfile(preset || 'custom');
      } catch (profileErr) {
        console.log('Could not fetch profile:', profileErr);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, [tradeLookback, chartDays, shadowLookback]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      await load({ silent: true });
    };
    const ms = Math.max(3, Number(refreshSec || 10)) * 1000;
    const id = setInterval(tick, ms);
    return () => clearInterval(id);
  }, [autoRefresh, refreshSec, load]);

  // Persist refresh interval to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('flux_refresh_sec', String(refreshSec));
    }
  }, [refreshSec]);

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

  // Calculate consecutive losses (current streak)
  const consecutiveLosses = useMemo(() => {
    const completed = trades.filter(t => t.win !== undefined);
    if (!completed.length) return 0;
    // Trades should be sorted newest first
    let streak = 0;
    for (const t of completed) {
      if (!t.win) streak++;
      else break;
    }
    return streak;
  }, [trades]);

  // Calculate max consecutive losses
  const maxConsecutiveLosses = useMemo(() => {
    const completed = trades.filter(t => t.win !== undefined);
    if (!completed.length) return 0;
    let maxStreak = 0;
    let currentStreak = 0;
    for (const t of completed) {
      if (!t.win) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.3); }
          50% { box-shadow: 0 0 15px rgba(0, 255, 136, 0.5); }
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
        <StatusBadge
          label="PROFILE"
          value={activeProfile ? activeProfile.toUpperCase() : '—'}
          color={colors.accent}
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
        {/* Data freshness indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: borderRadius.full,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: getFreshnessColor(lastRefresh),
            animation: autoRefresh ? 'pulse 2s infinite' : 'none',
            boxShadow: `0 0 6px ${getFreshnessColor(lastRefresh)}`,
          }} />
          <span style={{ color: colors.textMuted, fontSize: 12 }}>
            {getFreshnessLabel(lastRefresh)}
          </span>
        </div>
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
          glow={unrealized !== 0}
        />
        <MetricCard
          title="Today's P&L"
          value={formatCurrency(todayPnl)}
          subtitle={todayPnl != null
            ? `realized • ${((todayPnl / STARTING_FUNDS) * 100) >= 0 ? '+' : ''}${((todayPnl / STARTING_FUNDS) * 100).toFixed(2)}%`
            : "realized"}
          color={todayPnl > 0 ? colors.accent : todayPnl < 0 ? colors.error : colors.textPrimary}
          trend={todayPnl != null ? (todayPnl > 0 ? 1 : todayPnl < 0 ? -1 : 0) : null}
          sparklineData={dailyPnl.slice(-7).map(d => d.pnl || 0)}
          themeColors={colors}
          glassStyle={glassStyle}
          glow={todayPnl !== 0}
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
        <MetricCard
          title="Loss Streak"
          value={consecutiveLosses}
          subtitle={`max: ${maxConsecutiveLosses}`}
          color={consecutiveLosses >= 3 ? colors.error : consecutiveLosses >= 2 ? colors.warning : colors.textPrimary}
          themeColors={colors}
          glassStyle={glassStyle}
          icon={consecutiveLosses >= 3 ? '⚠' : null}
        />
        <MetricCard
          title="Total Trades"
          value={trades.length}
          subtitle={tradeLookback === 'today' ? 'today' : tradeLookback === 'week' ? 'this week' : `last ${tradeLookback}`}
          themeColors={colors}
          glassStyle={glassStyle}
        />
      </div>

      {/* Charts Section */}
      <SectionHeader title="Charts" isOpen={chartsOpen} onToggle={() => setChartsOpen(!chartsOpen)} themeColors={colors} />
      {chartsOpen && (
        <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          {/* Top Tickers Chart */}
          <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary }}>Top Performers</span>
              <span style={{ fontSize: 14, color: colors.textMuted }}>By P&L</span>
            </div>
            <TopTickersChart data={topTickers} themeColors={colors} />
          </div>

          {/* P&L History Chart */}
          <div style={{ ...cardStyle, background: colors.bgCard, borderColor: colors.border }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ fontWeight: 800, fontSize: 18, color: colors.textPrimary }}>P&L History</span>
              <LookbackSelector
                options={lookbackOptions.charts}
                value={chartDays}
                onChange={setChartDays}
                themeColors={colors}
              />
            </div>
            <PnlBarChart data={dailyPnl} themeColors={colors} />
          </div>
        </div>
      )}

      {/* Active Positions Panel */}
      {positions.length > 0 && (
        <div style={{
          ...cardStyle,
          background: colors.bgCard,
          borderColor: colors.border,
          padding: 0,
          overflow: 'hidden',
          marginTop: 24,
          boxShadow: `${shadows.md}, 0 0 20px rgba(0, 255, 136, 0.1)`,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: colors.accent,
              animation: 'pulse 2s infinite',
              boxShadow: `0 0 8px ${colors.accent}`,
            }} />
            <span style={{ fontWeight: 800, color: colors.textPrimary }}>Active Positions</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>Live from Alpaca</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.bgSecondary }}>
                <Th themeColors={colors}>Symbol</Th>
                <Th themeColors={colors}>Side</Th>
                <Th themeColors={colors}>Qty</Th>
                <Th themeColors={colors}>Entry</Th>
                <Th themeColors={colors}>Current</Th>
                <Th themeColors={colors}>Unrealized P&L</Th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <PnlRow key={i} pnl={p.unrealized_pnl} style={{ borderTop: `1px solid ${colors.border}` }} themeColors={colors}>
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
      <SectionHeader title="Activity" isOpen={tablesOpen} onToggle={() => setTablesOpen(!tablesOpen)} themeColors={colors} />
      {tablesOpen && (
      <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {/* Recent Trades Table */}
        <div style={{
          ...cardStyle,
          background: colors.bgCard,
          borderColor: colors.border,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>Recent Trades</span>
            <LookbackSelector
              options={lookbackOptions.trades}
              value={tradeLookback}
              onChange={setTradeLookback}
              themeColors={colors}
            />
          </div>
          {/* Scrollable table container - shows 15 rows max when 25+ selected */}
          <div style={{
            maxHeight: (typeof tradeLookback === 'number' && tradeLookback >= 25) ? 540 : 'none',
            overflowY: (typeof tradeLookback === 'number' && tradeLookback >= 25) ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: colors.bgSecondary }}>
                  <Th themeColors={colors}>Time</Th>
                  <Th themeColors={colors}>Symbol</Th>
                  <Th themeColors={colors}>Side</Th>
                  <Th themeColors={colors}>P&L</Th>
                  <Th themeColors={colors}>Result</Th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No completed trades yet" icon="~" themeColors={colors} />
                    </td>
                  </tr>
                ) : (
                  trades.map((t, i) => (
                    <PnlRow key={i} pnl={t.pnl} style={{ borderTop: `1px solid ${colors.border}` }} themeColors={colors}>
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
                          background: t.win ? colors.accentDark : colors.errorDark,
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
        </div>

        {/* Shadow Logs Table */}
        <div style={{
          ...cardStyle,
          background: colors.bgCard,
          borderColor: colors.border,
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 16, color: colors.textPrimary }}>Shadow Logs</span>
              <span style={{ marginLeft: 8, fontSize: 13, color: colors.textMuted }}>ML Predictions</span>
            </div>
            <LookbackSelector
              options={[
                { value: 10, label: '10' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
              ]}
              value={shadowLookback}
              onChange={setShadowLookback}
              themeColors={colors}
            />
          </div>
          {/* Scrollable table container - shows 15 rows max when 25+ selected */}
          <div style={{
            maxHeight: (typeof shadowLookback === 'number' && shadowLookback >= 25) ? 540 : 'none',
            overflowY: (typeof shadowLookback === 'number' && shadowLookback >= 25) ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: colors.bgSecondary }}>
                  <Th themeColors={colors}>Time</Th>
                  <Th themeColors={colors}>Symbol</Th>
                  <Th themeColors={colors}>Label</Th>
                  <Th themeColors={colors}>Win %</Th>
                  <Th themeColors={colors}>Action</Th>
                </tr>
              </thead>
              <tbody>
                {shadowLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState message="No shadow logs yet" icon="~" themeColors={colors} />
                    </td>
                  </tr>
                ) : (
                  shadowLogs.map((s, i) => (
                    <HoverRow key={i} style={{ borderTop: `1px solid ${colors.border}` }} themeColors={colors}>
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
      </div>
      )}

    </Layout>
  );
}

// Lookback Selector Component
function LookbackSelector({ options, value, onChange, themeColors = darkTheme }) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      background: themeColors.bgSecondary,
      padding: 3,
      borderRadius: borderRadius.md,
      border: `1px solid ${themeColors.border}`,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 10px',
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            borderRadius: borderRadius.sm,
            border: 'none',
            cursor: 'pointer',
            background: value === opt.value ? themeColors.accent : 'transparent',
            color: value === opt.value ? themeColors.bgPrimary : themeColors.textMuted,
            transition: `all ${transitions.fast}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// P&L Bar Chart Component with Tooltips
function PnlBarChart({ data, themeColors = darkTheme }) {
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
    return <EmptyState message="No P&L data yet" icon="~" themeColors={themeColors} />;
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
          stroke={themeColors.border}
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
                fill={isPositive ? themeColors.accent : themeColors.error}
                rx="4"
                opacity="0.8"
                style={{ cursor: 'pointer', filter: `drop-shadow(0 0 4px ${isPositive ? themeColors.accent : themeColors.error}40)` }}
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
            {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: tooltip.pnl >= 0 ? themeColors.accent : themeColors.error }}>
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
              color: themeColors.textMuted,
            }}>
              {d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }) : '—'}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: fontFamily.mono,
              fontWeight: 600,
              color: d.pnl > 0 ? themeColors.accent : d.pnl < 0 ? themeColors.error : themeColors.textMuted,
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
function TopTickersChart({ data, themeColors = darkTheme }) {
  if (!data || data.length === 0) {
    return <EmptyState message="No ticker data yet" icon="~" themeColors={themeColors} />;
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)), 1);
  const barHeight = 36;

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
              color: themeColors.textPrimary,
            }}>
              {d.symbol}
            </span>
            <div style={{
              flex: 1,
              height: barHeight,
              background: themeColors.bgSecondary,
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${Math.max(barWidth, 2)}%`,
                height: '100%',
                background: isPositive ? themeColors.accent : themeColors.error,
                opacity: 0.8,
                borderRadius: 6,
                transition: 'width 0.3s ease',
                boxShadow: `0 0 10px ${isPositive ? themeColors.accent : themeColors.error}40`,
              }} />
            </div>
            <span style={{
              width: 80,
              textAlign: 'right',
              fontFamily: fontFamily.mono,
              fontSize: 15,
              fontWeight: 700,
              color: isPositive ? themeColors.accent : themeColors.error,
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
function SectionHeader({ title, isOpen, onToggle, themeColors = darkTheme }) {
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
        borderBottom: `1px solid ${themeColors.border}`,
        cursor: 'pointer',
        color: themeColors.textPrimary,
      }}
    >
      <span style={{
        fontSize: 12,
        color: themeColors.textMuted,
        transition: 'transform 0.2s ease',
        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      }}>
        {'>'}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </span>
      <span style={{ fontSize: 12, color: themeColors.textMuted, marginLeft: 4 }}>
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

function MetricCard({ title, value, subtitle, color, trend, sparklineData, themeColors = darkTheme, glassStyle, glow = false, icon = null }) {
  const [hovered, setHovered] = useState(false);
  const effectiveColor = color || themeColors.textPrimary;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        ...(glassStyle || {}),
        background: themeColors.bgCard,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'default',
        transition: `all ${transitions.normal}`,
        borderColor: hovered ? themeColors.borderAccent : themeColors.border,
        boxShadow: hovered ? shadows.lg : shadows.md,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          color: themeColors.textMuted,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.semibold,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>{title}</span>
        {icon && (
          <span style={{ fontSize: fontSize.md }}>{icon}</span>
        )}
      </div>
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

function Th({ children, themeColors = darkTheme }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '14px 16px',
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: themeColors.textMuted,
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

function HoverRow({ children, style = {}, themeColors = darkTheme }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: hovered ? themeColors.bgHover : 'transparent',
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
function EmptyState({ message, icon = '~', themeColors = darkTheme }) {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      color: themeColors.textMuted,
    }}>
      <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  );
}

// Color-coded row based on P&L
function PnlRow({ children, pnl, style = {}, themeColors = darkTheme }) {
  const [hovered, setHovered] = useState(false);
  const bgTint = pnl > 0 ? themeColors.accentDark
               : pnl < 0 ? themeColors.errorDark
               : 'transparent';
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        background: hovered ? themeColors.bgHover : bgTint,
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
