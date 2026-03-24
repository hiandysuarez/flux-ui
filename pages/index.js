// pages/index.js - Flux Dashboard: Quick-Glance Command Center
import { useEffect, useState, useCallback } from 'react';
import {
  fetchStatus,
  fetchAccountSummary,
  fetchActivePositions,
  fetchRecentTrades,
  fetchUserSettings,
  fetchDailyPnl,
  runDecisionCycle,
  forceExitAll,
} from '../lib/api';
import {
  darkTheme,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
  borderRadius,
} from '../lib/theme';
import Layout from '../components/Layout';
import SubscriptionBanner from '../components/SubscriptionBanner';
import LandingPage from './landing';
import { useAuth } from '../lib/auth';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <LandingPage />;
  }

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
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const colors = darkTheme;

  // State
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [status, setStatus] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [dailyPnl, setDailyPnl] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // First fetch user settings to get trading mode
      const userSettingsRes = await fetchUserSettings().catch((e) => {
        console.error('UserSettings fetch error:', e);
        return { settings: { trading_mode: 'paper' } };
      });

      const settings = userSettingsRes?.settings || { trading_mode: 'paper' };
      const tradingMode = settings.trading_mode || 'paper';

      // Then fetch data based on trading mode
      const [accountRes, positionsRes, tradesRes, statusRes, dailyPnlRes] = await Promise.all([
        fetchAccountSummary(tradingMode).catch((e) => { console.error('Account fetch error:', e); return null; }),
        fetchActivePositions().catch((e) => { console.error('Positions fetch error:', e); return { positions: [] }; }),
        fetchRecentTrades(10, tradingMode).catch((e) => { console.error('Trades fetch error:', e); return { trades: [] }; }),
        fetchStatus().catch((e) => { console.error('Status fetch error:', e); return null; }),
        fetchDailyPnl(14).catch((e) => { console.error('DailyPnl fetch error:', e); return { data: [] }; }),
      ]);

      // Debug: log account data
      if (!silent) {
        console.log('Account Summary:', accountRes);
        console.log('Trading Mode:', tradingMode);
      }

      setUserSettings(settings);
      setAccount(accountRes);
      setPositions(positionsRes?.positions || []);
      setTrades(tradesRes?.trades || []);
      setStatus(statusRes);
      setDailyPnl(dailyPnlRes?.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        load(true);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleRunCycle = async () => {
    setActing(true);
    try {
      await runDecisionCycle(false);
      addToast('Decision cycle completed');
      await load(true);
    } catch (e) {
      addToast('Cycle failed: ' + e.message, 'error');
    }
    setActing(false);
  };

  const handleForceExit = async () => {
    if (!confirm('Force exit ALL positions?')) return;
    setActing(true);
    try {
      await forceExitAll();
      addToast('All positions closed');
      await load(true);
    } catch (e) {
      addToast('Exit failed: ' + e.message, 'error');
    }
    setActing(false);
  };

  // Format currency
  const fmt = (n, decimals = 2) => {
    if (n === null || n === undefined) return '$0.00';
    const num = parseFloat(n);
    const sign = num >= 0 ? '+' : '';
    return sign + '$' + Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const fmtNoSign = (n, decimals = 2) => {
    if (n === null || n === undefined) return '$0.00';
    return '$' + parseFloat(n).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  // Determine P&L color
  const pnlColor = (n) => {
    if (n === null || n === undefined) return colors.textSecondary;
    return parseFloat(n) >= 0 ? colors.accent : colors.error;
  };

  // Format time
  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Skeleton loader
  if (loading && !account) {
    return (
      <Layout>
        <div style={{ padding: spacing.xl, maxWidth: 1200, margin: '0 auto' }}>
          <SkeletonHero colors={colors} />
        </div>
      </Layout>
    );
  }

  const todayPnl = account?.today_pnl || 0;
  const todayPnlPct = account?.today_pnl_pct || 0;
  const todayTrades = account?.today_trades || 0;
  const todayWinRate = account?.today_win_rate || 0;
  const equity = account?.equity || 0;
  const unrealizedPnl = account?.unrealized_pnl || 0;
  const positionCount = account?.position_count || 0;
  const marketOpen = account?.market_open || false;
  const marketCloseTime = account?.market_close_time;
  const statsDate = account?.stats_date; // Date of stats if not today
  const alpacaConfigured = account?.alpaca_configured !== false;
  const alpacaError = account?.alpaca_error;

  // Format date for display (e.g., "Jan 30")
  const formatStatsDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tradingMode = userSettings?.trading_mode || 'paper';

  return (
    <Layout>
      <div style={{
        padding: `${spacing.lg}px ${spacing.xl}px`,
        maxWidth: 1200,
        margin: '0 auto',
        minHeight: 'calc(100vh - 80px)',
      }}>

        {/* Animations */}
        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fadeUp { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
          .delay-1 { animation-delay: 0.1s; }
          .delay-2 { animation-delay: 0.2s; }
          .delay-3 { animation-delay: 0.3s; }
          .delay-4 { animation-delay: 0.4s; }
        `}</style>

        {/* Subscription Limit Banner */}
        <SubscriptionBanner />

        {/* Toast Notifications */}
        <div
          role="region"
          aria-label="Notifications"
          aria-live="polite"
          style={{ position: 'fixed', top: 80, right: 20, zIndex: 1000 }}
        >
          {toasts.map(t => (
            <div
              key={t.id}
              role="alert"
              aria-atomic="true"
              className="animate-slideUp"
              style={{
                background: t.type === 'error' ? colors.error : colors.success,
                color: '#fff',
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                marginBottom: spacing.sm,
                fontFamily: fontFamily.sans,
                fontSize: fontSize.sm,
                fontWeight: fontWeight.medium,
                boxShadow: shadows.lg,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <span aria-hidden="true">{t.type === 'error' ? '!' : '✓'}</span>
              {t.message}
            </div>
          ))}
        </div>

        {/* ===== HERO: Daily P&L - The dominant element ===== */}
        <section className="fadeUp" style={{
          textAlign: 'center',
          padding: `${spacing['3xl']}px 0 ${spacing.lg}px`,
          position: 'relative',
        }}>
          {/* Subtle radial glow behind the number */}
          <div style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            height: 250,
            background: `radial-gradient(ellipse, ${todayPnl >= 0 ? 'rgba(212,165,116,0.06)' : 'rgba(248,81,73,0.06)'} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            fontSize: fontSize.xs,
            color: colors.textMuted,
            fontFamily: fontFamily.sans,
            fontWeight: fontWeight.medium,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: spacing.sm,
          }}>
            {statsDate ? `Last Session (${formatStatsDate(statsDate)})` : "Today's P&L"}
          </div>

          <div className="hero-text" style={{
            fontFamily: fontFamily.mono,
            fontSize: '72px',
            fontWeight: fontWeight.extrabold,
            color: pnlColor(todayPnl),
            letterSpacing: '-0.03em',
            lineHeight: 1,
            marginBottom: spacing.md,
          }}>
            {fmt(todayPnl)}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: spacing.lg,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            fontFamily: fontFamily.sans,
          }}>
            <span style={{ color: pnlColor(todayPnlPct), fontWeight: fontWeight.semibold }}>
              {todayPnlPct >= 0 ? '▲' : '▼'} {Math.abs(todayPnlPct).toFixed(2)}%
            </span>
            <span>{todayTrades} trade{todayTrades !== 1 ? 's' : ''}</span>
            <span>{todayWinRate}% win rate</span>
          </div>

          {/* 14-day P&L Sparkline */}
          {dailyPnl.length >= 2 && (
            <div style={{ marginTop: spacing.lg }}>
              <PnlSparkline data={dailyPnl} colors={colors} width={240} height={36} />
            </div>
          )}
        </section>

        {/* ===== Status Bar: system status, account stats, mode ===== */}
        <section className="fadeUp delay-1" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: spacing.lg,
          padding: `${spacing.md}px 0`,
          marginBottom: spacing.xl,
          borderTop: `1px solid ${colors.border}`,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          {/* Market status dot */}
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: fontSize.xs,
            fontFamily: fontFamily.sans,
            color: colors.textSecondary,
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: marketOpen ? colors.success : colors.error,
              boxShadow: marketOpen ? `0 0 6px ${colors.success}` : 'none',
              animation: marketOpen ? 'pulse 2s infinite' : 'none',
              display: 'inline-block',
            }} />
            Market {marketOpen ? 'Open' : 'Closed'}
            {marketCloseTime && marketOpen ? ` (closes ${fmtTime(marketCloseTime)})` : ''}
          </span>

          <span style={{ color: colors.border }}>|</span>

          {/* System status */}
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: fontSize.xs,
            fontFamily: fontFamily.sans,
            color: colors.textSecondary,
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: status?.running ? colors.success : colors.textMuted,
              display: 'inline-block',
            }} />
            {status?.running ? 'System Active' : 'System Idle'}
          </span>

          <span style={{ color: colors.border }}>|</span>

          {/* Trading mode pill */}
          <span style={{
            fontSize: fontSize.xs,
            fontFamily: fontFamily.mono,
            fontWeight: fontWeight.semibold,
            color: tradingMode === 'live' ? colors.warning : colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {tradingMode}
          </span>

          <span style={{ color: colors.border }}>|</span>

          {/* Last refresh */}
          {lastRefresh && (
            <span style={{
              fontSize: fontSize.xs,
              fontFamily: fontFamily.sans,
              color: colors.textMuted,
            }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </section>

        {/* ===== Account Stats Pills ===== */}
        <section className="fadeUp delay-1" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.xl,
          justifyContent: 'center',
        }}>
          <StatPill
            label="Equity"
            value={!alpacaConfigured ? '—' : fmtNoSign(equity)}
            colors={colors}
            valueColor={alpacaError ? colors.textMuted : colors.textPrimary}
          />
          <StatPill
            label="Unrealized"
            value={fmt(unrealizedPnl)}
            colors={colors}
            valueColor={pnlColor(unrealizedPnl)}
          />
          <StatPill
            label="Positions"
            value={String(positionCount)}
            colors={colors}
          />
          {alpacaError && (
            <StatPill
              label="Broker"
              value="Not Connected"
              colors={colors}
              valueColor={colors.error}
            />
          )}
        </section>

        {/* ===== Active Positions ===== */}
        <section className="fadeUp delay-2" style={{ marginBottom: spacing['3xl'] }}>
          <div className="flex-mobile-col" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
            gap: spacing.sm,
          }}>
            <h2 className="section-title" style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              color: colors.textSecondary,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Active Positions
            </h2>
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              <button
                onClick={handleRunCycle}
                disabled={acting}
                aria-label="Run trading decision cycle"
                aria-busy={acting}
                className="btn-press"
                style={{
                  padding: `${spacing.sm}px ${spacing.lg}px`,
                  background: colors.accent,
                  color: colors.bgPrimary,
                  border: 'none',
                  borderRadius: borderRadius.sm,
                  fontFamily: fontFamily.sans,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.bold,
                  cursor: acting ? 'wait' : 'pointer',
                  opacity: acting ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!acting) {
                    e.currentTarget.style.background = colors.accentHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.accent;
                }}
              >
                {acting ? 'Running...' : 'Run Cycle'}
              </button>
              {positions.length > 0 && (
                <button
                  onClick={handleForceExit}
                  disabled={acting}
                  style={{
                    padding: `${spacing.xs}px ${spacing.md}px`,
                    background: 'transparent',
                    color: colors.error,
                    border: 'none',
                    borderRadius: borderRadius.sm,
                    fontFamily: fontFamily.sans,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.medium,
                    cursor: acting ? 'wait' : 'pointer',
                    opacity: acting ? 0.7 : 1,
                    transition: transitions.fast,
                    textDecoration: 'underline',
                  }}
                >
                  Exit All
                </button>
              )}
            </div>
          </div>

          {positions.length === 0 ? (
            <div style={{
              padding: `${spacing.xl}px 0`,
              textAlign: 'center',
              color: colors.textMuted,
              fontSize: fontSize.sm,
              fontFamily: fontFamily.sans,
              borderTop: `1px solid ${colors.border}`,
            }}>
              No active positions — trades open automatically during market hours
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <ThCell colors={colors}>Symbol</ThCell>
                    <ThCell colors={colors}>Side</ThCell>
                    <ThCell colors={colors}>Qty</ThCell>
                    <ThCell colors={colors}>Entry</ThCell>
                    <ThCell colors={colors}>P&L</ThCell>
                    <ThCell colors={colors}>Type</ThCell>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => {
                    const posPnl = parseFloat(pos.unrealized_pnl || 0);
                    const isProfit = posPnl >= 0;
                    return (
                      <tr key={pos.symbol} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <TdCell style={{
                          fontFamily: fontFamily.mono,
                          fontWeight: fontWeight.bold,
                          color: colors.textPrimary,
                        }}>
                          {pos.symbol}
                        </TdCell>
                        <TdCell>
                          <span style={{
                            color: pos.side === 'LONG' ? colors.success : colors.error,
                            fontWeight: fontWeight.semibold,
                            fontSize: fontSize.xs,
                          }}>
                            {pos.side}
                          </span>
                        </TdCell>
                        <TdCell style={{ fontFamily: fontFamily.mono, color: colors.textSecondary }}>
                          {pos.qty}
                        </TdCell>
                        <TdCell style={{ fontFamily: fontFamily.mono, color: colors.textSecondary }}>
                          ${parseFloat(pos.entry_price).toFixed(2)}
                        </TdCell>
                        <TdCell style={{
                          fontFamily: fontFamily.mono,
                          fontWeight: fontWeight.bold,
                          color: isProfit ? colors.accent : colors.error,
                        }}>
                          {posPnl >= 0 ? '+' : ''}{posPnl.toFixed(2)}
                        </TdCell>
                        <TdCell style={{
                          fontSize: fontSize.xs,
                          color: colors.textMuted,
                          fontFamily: fontFamily.mono,
                        }}>
                          {pos.trade_type || 'LLM'}
                        </TdCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ===== Recent Trades ===== */}
        <section className="fadeUp delay-3" style={{ marginBottom: spacing['3xl'] }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <h2 style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              color: colors.textSecondary,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Recent Trades
            </h2>
            <Link
              href="/history"
              aria-label="View full trade history"
              style={{
                color: colors.textMuted,
                fontSize: fontSize.xs,
                fontFamily: fontFamily.sans,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.textMuted;
              }}
            >
              View All →
            </Link>
          </div>

          {trades.length === 0 ? (
            <div style={{
              padding: `${spacing.xl}px 0`,
              textAlign: 'center',
              color: colors.textMuted,
              fontFamily: fontFamily.sans,
              fontSize: fontSize.sm,
              borderTop: `1px solid ${colors.border}`,
            }}>
              No recent trades
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr>
                    <ThCell colors={colors}>Date</ThCell>
                    <ThCell colors={colors}>Symbol</ThCell>
                    <ThCell colors={colors}>Direction</ThCell>
                    <ThCell colors={colors}>Qty</ThCell>
                    <ThCell colors={colors}>Price</ThCell>
                    <ThCell colors={colors}>P&L</ThCell>
                    <ThCell colors={colors}>P&L %</ThCell>
                    <ThCell colors={colors}>Hold</ThCell>
                    <ThCell colors={colors}>Result</ThCell>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade, i) => (
                    <TradeRow key={trade.id || i} trade={trade} colors={colors} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ===== Quick Links - compact footer row ===== */}
        <section className="fadeUp delay-4" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: spacing.xl,
          paddingTop: spacing.lg,
          borderTop: `1px solid ${colors.border}`,
        }}>
          <QuickLink href="/analytics" label="Analytics" colors={colors} />
          <QuickLink href="/symbols" label="Symbols" colors={colors} />
          <QuickLink href="/timing" label="Timing" colors={colors} />
          <QuickLink href="/settings" label="Settings" colors={colors} />
        </section>
      </div>
    </Layout>
  );
}

// ===== Sub-Components =====

function StatPill({ label, value, colors, valueColor }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: `${spacing.xs}px ${spacing.md}px`,
      borderRadius: borderRadius.full,
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      fontSize: fontSize.xs,
      fontFamily: fontFamily.sans,
    }}>
      <span style={{ color: colors.textMuted, fontWeight: fontWeight.medium }}>
        {label}
      </span>
      <span style={{
        color: valueColor || colors.textPrimary,
        fontWeight: fontWeight.bold,
        fontFamily: fontFamily.mono,
      }}>
        {value}
      </span>
    </span>
  );
}

function ThCell({ children, colors }) {
  return (
    <th style={{
      textAlign: 'left',
      padding: '8px 12px',
      fontSize: '11px',
      fontWeight: fontWeight.semibold,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontFamily: fontFamily.sans,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      {children}
    </th>
  );
}

function TdCell({ children, style = {} }) {
  return (
    <td style={{
      padding: '7px 12px',
      fontSize: fontSize.sm,
      fontFamily: fontFamily.sans,
      ...style,
    }}>
      {children}
    </td>
  );
}

function TradeRow({ trade, colors }) {
  const [hovered, setHovered] = useState(false);
  const pnl = parseFloat(trade.pnl || 0);
  const pnlPct = parseFloat(trade.pnl_pct || 0) * 100;
  const isExit = trade.is_exit;

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: `1px solid ${colors.border}`,
        background: hovered ? colors.bgSecondary : 'transparent',
        transition: 'background 0.1s ease',
      }}
    >
      {/* Date */}
      <TdCell style={{ fontSize: fontSize.xs, color: colors.textMuted, fontFamily: fontFamily.mono }}>
        {trade.ts ? new Date(trade.ts).toLocaleString() : '—'}
      </TdCell>
      {/* Symbol */}
      <TdCell style={{ fontWeight: fontWeight.bold, fontFamily: fontFamily.mono, color: colors.textPrimary }}>
        {trade.symbol}
      </TdCell>
      {/* Direction */}
      <TdCell>
        <span style={{ color: trade.direction === 'LONG' ? colors.success : colors.error, fontWeight: fontWeight.semibold }}>
          {trade.direction || (trade.side === 'SELL' ? 'LONG' : 'SHORT')}
        </span>
      </TdCell>
      {/* Qty */}
      <TdCell style={{ fontFamily: fontFamily.mono }}>{trade.qty}</TdCell>
      {/* Price */}
      <TdCell style={{ fontFamily: fontFamily.mono }}>${Number(trade.fill_price || 0).toFixed(2)}</TdCell>
      {/* P&L */}
      <TdCell style={{
        fontFamily: fontFamily.mono,
        fontWeight: fontWeight.bold,
        color: pnl > 0 ? colors.accent : pnl < 0 ? colors.error : colors.textPrimary,
      }}>
        {isExit ? `$${pnl.toFixed(2)}` : '—'}
      </TdCell>
      {/* P&L % */}
      <TdCell style={{
        fontFamily: fontFamily.mono,
        color: pnlPct > 0 ? colors.accent : pnlPct < 0 ? colors.error : colors.textPrimary,
      }}>
        {isExit ? `${pnlPct.toFixed(2)}%` : '—'}
      </TdCell>
      {/* Hold Time */}
      <TdCell style={{ fontFamily: fontFamily.mono, color: colors.textMuted }}>
        {trade.hold_minutes != null ? `${Math.round(trade.hold_minutes)}m` : '—'}
      </TdCell>
      {/* Result */}
      <TdCell>
        {isExit ? (
          <span style={{
            padding: '2px 8px',
            borderRadius: borderRadius.sm,
            background: trade.win ? colors.accentDark : 'rgba(248, 81, 73, 0.15)',
            color: trade.win ? colors.accent : colors.error,
            fontWeight: fontWeight.bold,
            fontSize: fontSize.xs,
          }}>
            {trade.win ? 'WIN' : 'LOSS'}
          </span>
        ) : (
          <span style={{ color: colors.textMuted, fontSize: fontSize.xs }}>ENTRY</span>
        )}
      </TdCell>
    </tr>
  );
}

function QuickLink({ href, label, colors }) {
  return (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      style={{
        textDecoration: 'none',
        fontFamily: fontFamily.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.textMuted,
        transition: 'color 0.15s ease',
        padding: `${spacing.sm}px 0`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = colors.accent; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; }}
    >
      {label}
    </Link>
  );
}

function SkeletonHero({ colors }) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: ${borderRadius.md};
        }
      `}</style>
      <div style={{ textAlign: 'center', padding: `${spacing.xxl} 0` }}>
        <div className="skeleton" style={{ width: 120, height: 16, margin: '0 auto', marginBottom: spacing.md }} />
        <div className="skeleton" style={{ width: 280, height: 56, margin: '0 auto', marginBottom: spacing.md }} />
        <div className="skeleton" style={{ width: 200, height: 16, margin: '0 auto' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md, marginTop: spacing.xl }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 100 }} />
        ))}
      </div>
    </>
  );
}

// Mini sparkline for daily P&L trend (14 days)
function PnlSparkline({ data, colors, width = 200, height = 40 }) {
  if (!data || data.length < 2) return null;

  // Extract P&L values from data (expecting {date, pnl} objects)
  const values = data.map(d => d.pnl || d.total_pnl || 0);

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const padding = 4;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Generate smooth path
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((v - min) / range) * chartHeight;
    return { x, y, v };
  });

  // Create smooth bezier curve
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Gradient fill path
  const fillPath = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Last value determines color
  const lastVal = values[values.length - 1];
  const strokeColor = lastVal >= 0 ? colors.accent : colors.error;
  const gradientId = `pnl-gradient-${lastVal >= 0 ? 'up' : 'down'}`;

  const trendDirection = lastVal >= 0 ? 'positive' : 'negative';

  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', margin: '0 auto' }}
      role="img"
      aria-label={`14-day P&L trend chart showing ${trendDirection} performance`}
    >
      <title>P&L Trend: {trendDirection}</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={fillPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}
