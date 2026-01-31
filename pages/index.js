// pages/index.js - Flux Dashboard: Quick-Glance Command Center
import { useEffect, useState, useCallback } from 'react';
import {
  fetchStatus,
  fetchAccountSummary,
  fetchActivePositions,
  fetchRecentTrades,
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

      const [accountRes, positionsRes, tradesRes, statusRes] = await Promise.all([
        fetchAccountSummary().catch(() => null),
        fetchActivePositions().catch(() => ({ positions: [] })),
        fetchRecentTrades(10).catch(() => ({ trades: [] })),
        fetchStatus().catch(() => null),
      ]);

      setAccount(accountRes);
      setPositions(positionsRes?.positions || []);
      setTrades(tradesRes?.trades || []);
      setStatus(statusRes);
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

        {/* Toast Notifications */}
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 1000 }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: t.type === 'error' ? colors.error : colors.success,
              color: '#fff',
              padding: `${spacing.sm} ${spacing.md}`,
              borderRadius: borderRadius.md,
              marginBottom: spacing.sm,
              fontFamily: fontFamily.sans,
              fontSize: fontSize.sm,
              boxShadow: shadows.lg,
            }}>
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
            Today's P&L
          </div>

          <div style={{
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
            gap: spacing.lg,
            fontSize: fontSize.sm,
            color: colors.textSecondary,
            fontFamily: fontFamily.sans,
          }}>
            <span style={{ color: pnlColor(todayPnlPct) }}>
              {todayPnlPct >= 0 ? '▲' : '▼'} {Math.abs(todayPnlPct).toFixed(2)}%
            </span>
            <span>•</span>
            <span>{todayTrades} trade{todayTrades !== 1 ? 's' : ''}</span>
            <span>•</span>
            <span>{todayWinRate}% win rate</span>
          </div>
        </section>

        {/* ===== Quick Stats Row ===== */}
        <section className="fadeUp delay-1" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: spacing.md,
          marginBottom: spacing.xl,
        }}>
          {/* Account Equity */}
          <StatCard
            colors={colors}
            label="Account Equity"
            value={fmtNoSign(equity)}
            sublabel="Total Value"
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
              Active Positions
            </h2>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button
                onClick={handleRunCycle}
                disabled={acting}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  background: colors.accent,
                  color: colors.bgPrimary,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontFamily: fontFamily.sans,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  cursor: acting ? 'wait' : 'pointer',
                  opacity: acting ? 0.7 : 1,
                  transition: transitions.fast,
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
            <Link href="/history" style={{
              color: colors.accent,
              fontSize: fontSize.sm,
              fontFamily: fontFamily.sans,
              textDecoration: 'none',
            }}>
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
          gridTemplateColumns: 'repeat(4, 1fr)',
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
  return (
    <div style={{
      padding: spacing.lg,
      background: colors.bgSecondary,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border}`,
    }}>
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
      {/* Time */}
      <div style={{
        width: 80,
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontFamily: fontFamily.mono,
      }}>
        {trade.ts ? new Date(trade.ts).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) : ''}
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
  return (
    <Link href={href} style={{
      display: 'block',
      padding: spacing.md,
      background: colors.bgSecondary,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
      textDecoration: 'none',
      fontFamily: fontFamily.sans,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
      transition: transitions.fast,
    }}>
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
