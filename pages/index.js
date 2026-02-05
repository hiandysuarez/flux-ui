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

  return (
    <Layout>
      <div style={{
        padding: spacing.xl,
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
                padding: `${spacing.sm} ${spacing.md}`,
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

        {/* ===== HERO: Today's P&L ===== */}
        <section className="fadeUp" style={{
          textAlign: 'center',
          padding: `${spacing.xxl} 0`,
          marginBottom: spacing.xl,
          position: 'relative',
        }}>
          {/* Subtle radial glow behind the number */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            height: 200,
            background: `radial-gradient(ellipse, ${todayPnl >= 0 ? 'rgba(212,165,116,0.08)' : 'rgba(248,81,73,0.08)'} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            fontFamily: fontFamily.sans,
            fontWeight: fontWeight.medium,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: spacing.sm,
          }}>
            {statsDate ? `Last Session (${formatStatsDate(statsDate)})` : "Today's P&L"}
          </div>

          <div className="hero-text" style={{
            fontFamily: fontFamily.display,
            fontSize: fontSize.hero,
            fontWeight: fontWeight.bold,
            color: pnlColor(todayPnl),
            letterSpacing: '-0.02em',
            lineHeight: 1,
            marginBottom: spacing.md,
          }}>
            {fmt(todayPnl)}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: spacing.sm,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            fontFamily: fontFamily.sans,
          }}>
            <span style={{ color: pnlColor(todayPnlPct) }}>
              {todayPnlPct >= 0 ? '▲' : '▼'} {Math.abs(todayPnlPct).toFixed(2)}%
            </span>
            <span className="hide-mobile">•</span>
            <span>{todayTrades} trade{todayTrades !== 1 ? 's' : ''}</span>
            <span className="hide-mobile">•</span>
            <span>{todayWinRate}% win rate</span>
          </div>

          {/* 14-day P&L Sparkline */}
          {dailyPnl.length >= 2 && (
            <div style={{ marginTop: spacing.lg }}>
              <div style={{
                fontSize: fontSize.xs,
                color: colors.textMuted,
                fontFamily: fontFamily.sans,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: spacing.xs,
              }}>
                14-Day Trend
              </div>
              <PnlSparkline data={dailyPnl} colors={colors} width={200} height={40} />
            </div>
          )}
        </section>

        {/* ===== Quick Stats Row ===== */}
        <section className="fadeUp delay-1 responsive-grid-3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}>
          {/* Account Equity */}
          <StatCard
            colors={colors}
            label="Account Equity"
            value={!alpacaConfigured ? '—' : fmtNoSign(equity)}
            sublabel={alpacaError ? 'Broker not connected' : 'Total Value'}
            valueColor={alpacaError ? colors.textMuted : undefined}
          />

          {/* Unrealized P&L */}
          <StatCard
            colors={colors}
            label="Unrealized"
            value={fmt(unrealizedPnl)}
            valueColor={pnlColor(unrealizedPnl)}
            sublabel={`${positionCount} position${positionCount !== 1 ? 's' : ''}`}
          />

          {/* Market Status */}
          <StatCard
            colors={colors}
            label="Market"
            value={
              <span style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: marketOpen ? colors.success : colors.error,
                  boxShadow: marketOpen ? `0 0 8px ${colors.success}` : 'none',
                  animation: marketOpen ? 'pulse 2s infinite' : 'none',
                }} />
                {marketOpen ? 'Open' : 'Closed'}
              </span>
            }
            sublabel={marketCloseTime ? `Closes ${fmtTime(marketCloseTime)}` : ''}
          />
        </section>

        {/* ===== Active Positions ===== */}
        <section className="fadeUp delay-2" style={{ marginBottom: spacing.xl }}>
          <div className="flex-mobile-col" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
            gap: spacing.sm,
          }}>
            <h2 className="section-title" style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.textPrimary,
              margin: 0,
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
                  padding: `${spacing.md} ${spacing.xl}`,
                  background: colors.accent,
                  color: colors.bgPrimary,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontFamily: fontFamily.sans,
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.bold,
                  cursor: acting ? 'wait' : 'pointer',
                  opacity: acting ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 2px 8px rgba(212, 165, 116, 0.3)`,
                }}
                onMouseEnter={(e) => {
                  if (!acting) {
                    e.currentTarget.style.background = colors.accentHover;
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 165, 116, 0.4)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.accent;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 165, 116, 0.3)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {acting ? 'Running...' : 'Run Cycle'}
              </button>
              {positions.length > 0 && (
                <button
                  onClick={handleForceExit}
                  disabled={acting}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    background: 'transparent',
                    color: colors.error,
                    border: `1px solid ${colors.error}`,
                    borderRadius: borderRadius.md,
                    fontFamily: fontFamily.sans,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                    cursor: acting ? 'wait' : 'pointer',
                    opacity: acting ? 0.7 : 1,
                    transition: transitions.fast,
                  }}
                >
                  Exit All
                </button>
              )}
            </div>
          </div>

          {positions.length === 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: spacing.md,
            }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  padding: spacing.lg,
                  background: colors.bgSecondary,
                  borderRadius: borderRadius.lg,
                  border: `1px dashed ${colors.border}`,
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    color: colors.textMuted,
                    fontSize: fontSize.sm,
                    fontFamily: fontFamily.sans,
                  }}>
                    No position
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: spacing.md,
            }}>
              {positions.map((pos, i) => (
                <PositionCard key={pos.symbol} position={pos} colors={colors} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ===== Recent Activity ===== */}
        <section className="fadeUp delay-3" style={{ marginBottom: spacing.xl }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <h2 style={{
              fontFamily: fontFamily.sans,
              fontSize: fontSize.lg,
              fontWeight: fontWeight.semibold,
              color: colors.textPrimary,
              margin: 0,
            }}>
              Recent Activity
            </h2>
            <Link
              href="/history"
              aria-label="View full trade history"
              style={{
                color: colors.accent,
                fontSize: fontSize.sm,
                fontFamily: fontFamily.sans,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.accentHover;
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.accent;
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              View Full History →
            </Link>
          </div>

          <div style={{
            background: colors.bgSecondary,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
          }}>
            {trades.length === 0 ? (
              <div style={{
                padding: spacing.xl,
                textAlign: 'center',
                color: colors.textMuted,
                fontFamily: fontFamily.sans,
                fontSize: fontSize.sm,
              }}>
                No recent trades
              </div>
            ) : (
              trades.slice(0, 5).map((trade, i) => (
                <ActivityRow key={trade.id || i} trade={trade} colors={colors} index={i} />
              ))
            )}
          </div>
        </section>

        {/* ===== Quick Links ===== */}
        <section className="fadeUp delay-4" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: spacing.md,
        }}>
          <QuickLink href="/analytics" label="Analytics" colors={colors} />
          <QuickLink href="/symbols" label="Symbols" colors={colors} />
          <QuickLink href="/timing" label="Timing" colors={colors} />
          <QuickLink href="/settings" label="Settings" colors={colors} />
        </section>

        {/* Last updated indicator */}
        {lastRefresh && (
          <div style={{
            marginTop: spacing.xl,
            textAlign: 'center',
            color: colors.textMuted,
            fontSize: fontSize.xs,
            fontFamily: fontFamily.sans,
          }}>
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ===== Sub-Components =====

function StatCard({ colors, label, value, sublabel, valueColor }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: spacing.lg,
        background: colors.bgSecondary,
        borderRadius: borderRadius.lg,
        border: `1px solid ${hovered ? colors.borderLight : colors.border}`,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
      }}
    >
      <div style={{
        fontSize: fontSize.xs,
        color: colors.textMuted,
        fontFamily: fontFamily.sans,
        fontWeight: fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: spacing.xs,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: fontFamily.display,
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        color: valueColor || colors.textPrimary,
        marginBottom: spacing.xs,
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          fontFamily: fontFamily.sans,
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function PositionCard({ position, colors, index }) {
  const pnl = parseFloat(position.unrealized_pnl || 0);
  const isProfit = pnl >= 0;
  const borderColor = isProfit ? 'rgba(212, 165, 116, 0.4)' : 'rgba(248, 81, 73, 0.4)';

  return (
    <div style={{
      padding: spacing.lg,
      background: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      border: `1px solid ${borderColor}`,
      animation: 'slideIn 0.3s ease-out forwards',
      animationDelay: `${index * 0.1}s`,
      opacity: 0,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
      }}>
        <span style={{
          fontFamily: fontFamily.mono,
          fontSize: fontSize.lg,
          fontWeight: fontWeight.bold,
          color: colors.textPrimary,
        }}>
          {position.symbol}
        </span>
        <span style={{
          fontSize: fontSize.xs,
          color: position.side === 'LONG' ? colors.success : colors.error,
          fontFamily: fontFamily.sans,
          fontWeight: fontWeight.medium,
          padding: `2px ${spacing.xs}`,
          background: position.side === 'LONG' ? colors.successDark : colors.errorDark,
          borderRadius: borderRadius.sm,
        }}>
          {position.side}
        </span>
      </div>

      <div style={{
        fontFamily: fontFamily.mono,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: isProfit ? colors.accent : colors.error,
        marginBottom: spacing.xs,
      }}>
        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
      </div>

      <div style={{
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontFamily: fontFamily.sans,
      }}>
        {position.qty} shares @ ${parseFloat(position.entry_price).toFixed(2)}
      </div>
    </div>
  );
}

function ActivityRow({ trade, colors, index }) {
  const isExit = trade.is_exit;
  const pnl = parseFloat(trade.pnl || 0);
  const isWin = trade.win === true;
  const confidence = parseFloat(trade.confidence || 0) * 100;

  // Format date as MM-DD-YY
  const formatDateTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${month}-${day}-${year} ${time}`;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: `${spacing.md} ${spacing.lg}`,
      borderBottom: `1px solid ${colors.border}`,
      animation: 'slideIn 0.3s ease-out forwards',
      animationDelay: `${index * 0.1}s`,
      opacity: 0,
    }}>
      {/* Date & Time */}
      <div style={{
        width: 130,
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontFamily: fontFamily.mono,
      }}>
        {formatDateTime(trade.ts)}
      </div>

      {/* Action */}
      <div style={{
        width: 60,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: trade.side === 'BUY' ? colors.success : colors.error,
        fontFamily: fontFamily.sans,
      }}>
        {trade.side}
      </div>

      {/* Symbol */}
      <div style={{
        flex: 1,
        fontFamily: fontFamily.mono,
        fontSize: fontSize.base,
        fontWeight: fontWeight.medium,
        color: colors.textPrimary,
      }}>
        {trade.symbol}
      </div>

      {/* P&L (exits only) */}
      {isExit ? (
        <>
          <div style={{
            width: 80,
            fontFamily: fontFamily.mono,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: pnl >= 0 ? colors.accent : colors.error,
            textAlign: 'right',
          }}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
          </div>
          <div style={{
            width: 50,
            marginLeft: spacing.md,
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: isWin ? colors.success : colors.error,
            textAlign: 'center',
          }}>
            {isWin ? 'WIN' : 'LOSS'}
          </div>
        </>
      ) : (
        <div style={{
          width: 130,
          fontSize: fontSize.sm,
          color: colors.textSecondary,
          fontFamily: fontFamily.sans,
          textAlign: 'right',
        }}>
          Entry @ ${parseFloat(trade.fill_price || 0).toFixed(2)}
        </div>
      )}

      {/* Confidence Bar */}
      {confidence > 0 && (
        <div style={{
          width: 60,
          marginLeft: spacing.md,
          height: 6,
          background: colors.bgTertiary,
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${confidence}%`,
            height: '100%',
            background: colors.accent,
            borderRadius: 3,
          }} />
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, label, colors }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Go to ${label}`}
      style={{
        display: 'block',
        padding: spacing.md,
        background: hovered ? colors.bgTertiary : colors.bgSecondary,
        borderRadius: borderRadius.md,
        border: `1px solid ${hovered ? colors.borderAccent : colors.border}`,
        textAlign: 'center',
        textDecoration: 'none',
        fontFamily: fontFamily.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: hovered ? colors.accent : colors.textSecondary,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 12px rgba(0, 0, 0, 0.2)' : 'none',
        cursor: 'pointer',
      }}
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
