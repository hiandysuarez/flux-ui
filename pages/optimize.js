import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  darkTheme,
  borderRadius,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  transitions,
  cardStyle,
  typography,
} from '../lib/theme';
import {
  fetchQuickBacktest,
  fetchFluxSettings,
  runCycleReplay,
  runParameterOptimization,
  saveToFluxSettings,
} from '../lib/api';

const colors = darkTheme;

// Helper to format relative time (e.g., "2 days ago")
function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Setting display names for parameter display
const SETTING_META = {
  // LLM settings (with and without prefix)
  conf_threshold: {
    name: 'Confidence',
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
  },
  llm_conf_threshold: {
    name: 'Confidence',
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
  },
  mom_entry_pct: {
    name: 'Momentum',
    format: (v) => `${(Number(v) * 100).toFixed(2)}%`,
  },
  llm_mom_entry_pct: {
    name: 'Momentum',
    format: (v) => `${(Number(v) * 100).toFixed(2)}%`,
  },
  // Risk settings
  stop_loss_pct: {
    name: 'Stop Loss',
    format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  },
  take_profit_pct: {
    name: 'Take Profit',
    format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  },
  // Trailing stop
  trailing_stop_activation: {
    name: 'Trail Activation',
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
  },
  trailing_stop_distance: {
    name: 'Trail Distance',
    format: (v) => `${Number(v).toFixed(2)}x`,
  },
  // Time
  max_hold_min: {
    name: 'Max Hold',
    format: (v) => `${v} min`,
  },
};

export default function OptimizePage() {
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [days, setDays] = useState(30);

  // What-If Analysis state
  const [whatIfRunning, setWhatIfRunning] = useState(false);
  const [whatIfResults, setWhatIfResults] = useState(null);
  const [whatIfConfig, setWhatIfConfig] = useState({
    conf_threshold: 0.60,
    win_prob_min: 0,
    mq_required: true,
    stop_loss_pct: 0.01,
    take_profit_pct: 0.02,
    max_hold_min: 120,
    trailing_enabled: true,
    trailing_activation: 0.70,
    trailing_distance: 1.0,
    max_trades_per_day: 5,
    max_trades_per_symbol_per_day: 2,
  });

  // Backtest (Parameter Optimizer) state
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  const [savingToFlux, setSavingToFlux] = useState(false);
  const [savedFluxSettings, setSavedFluxSettings] = useState(null);

  // Debug: raw API response
  const [fluxApiResponse, setFluxApiResponse] = useState(null);

  // Load initial backtest data
  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [bt, fluxRes] = await Promise.all([
        fetchQuickBacktest(days),
        fetchFluxSettings(),
      ]);

      if (bt?.ok === false) {
        throw new Error(bt.error || 'Backtest API returned error');
      }
      const mappedBacktest = {
        current: bt.current_performance || bt.current,
        optimized: bt.proposed_performance || bt.proposed || bt.optimized_performance || bt.optimized,
        improvement: bt.improvement,
      };
      setBacktest(mappedBacktest);

      // Store raw API response for debugging
      setFluxApiResponse(fluxRes);

      // Load saved flux settings if available
      if (fluxRes?.ok && fluxRes.source === 'backtest' && fluxRes.backtest_info) {
        const info = fluxRes.backtest_info;
        const savedResults = {
          best_params: fluxRes.settings,
          best_metrics: {
            total_trades: info.trade_count,
            win_rate: info.win_rate,
            total_return_pct: info.pnl,
            profit_factor: info.profit_factor,
            max_drawdown_pct: info.drawdown,
          },
          backtest_days: info.days,
          ran_at: info.ran_at,
          source: 'saved',
        };
        setSavedFluxSettings(savedResults);

        // Pre-populate backtestResults with saved data
        // This will be overwritten when user runs a new backtest
        setBacktestResults(prev => {
          // If there's already a fresh (non-saved) result, keep it
          if (prev && prev.source !== 'saved') {
            return prev;
          }
          return savedResults;
        });
      }
    } catch (e) {
      setError(`Failed to load: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  // Run What-If Analysis
  async function handleWhatIfAnalysis() {
    setWhatIfRunning(true);
    setError(null);
    try {
      const result = await runCycleReplay({
        days,
        ...whatIfConfig,
      });
      if (result?.ok === false) {
        throw new Error(result.error || 'What-If analysis failed');
      }
      setWhatIfResults(result);
      setSuccess('What-If analysis complete!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(`What-If analysis failed: ${e.message || 'Please try again.'}`);
    } finally {
      setWhatIfRunning(false);
    }
  }

  // Update What-If config
  function updateWhatIfConfig(key, value) {
    setWhatIfConfig(prev => ({ ...prev, [key]: value }));
  }

  // Run Backtest (Parameter Optimization)
  async function handleRunBacktest() {
    setBacktestRunning(true);
    setError(null);
    try {
      const result = await runParameterOptimization({ days });
      if (result?.ok === false) {
        throw new Error(result.error || 'Backtest failed');
      }
      setBacktestResults(result);
      setSuccess('Backtest complete! Optimal parameters found.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(`Backtest failed: ${e.message || 'Please try again.'}`);
    } finally {
      setBacktestRunning(false);
    }
  }

  // Save backtest results to Flux Settings
  async function handleSaveToFluxSettings() {
    if (!backtestResults?.best_params) return;
    setSavingToFlux(true);
    setError(null);
    try {
      const settings = { ...backtestResults.best_params };
      const metrics = backtestResults.best_metrics || {};
      const result = await saveToFluxSettings(settings, {
        win_rate: metrics.win_rate,
        total_pnl: metrics.total_return_pct,
        max_drawdown: metrics.max_drawdown_pct,
        profit_factor: metrics.profit_factor,
        trade_count: metrics.total_trades,
      }, days);
      if (result?.ok === false) {
        throw new Error(result.error || 'Failed to save Flux Settings');
      }
      setSuccess('Saved to Flux Settings! These optimized parameters are now your default.');
      setTimeout(() => setSuccess(null), 5000);
      await loadData();
    } catch (e) {
      setError(`Failed to save: ${e.message || 'Unknown error'}`);
    } finally {
      setSavingToFlux(false);
    }
  }

  return (
    <Layout active="optimize">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .optimize-card {
          animation: fadeInUp 0.5s ease-out both;
        }
        .metric-card {
          transition: all 0.2s ease;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          border-color: ${colors.borderAccent} !important;
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: ${colors.bgTertiary};
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: ${colors.accent};
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 8px ${colors.accent};
        }
        input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: ${colors.accent};
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        flexWrap: 'wrap',
        gap: spacing.md,
      }}>
        <div>
          <h1 style={{
            ...typography.h1,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}>
            Optimize Trading
          </h1>
          <p style={{
            ...typography.bodySmall,
            marginTop: spacing.xs,
          }}>
            Backtest and analyze your trading parameters
          </p>
        </div>

        {/* Period selector */}
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          background: colors.bgSecondary,
          padding: 4,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}>
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '8px 16px',
                borderRadius: borderRadius.md,
                border: 'none',
                background: days === d ? colors.accentDark : 'transparent',
                color: days === d ? colors.accent : colors.textSecondary,
                fontWeight: days === d ? fontWeight.bold : fontWeight.medium,
                fontSize: fontSize.sm,
                fontFamily: fontFamily.sans,
                cursor: 'pointer',
                transition: `all ${transitions.fast}`,
              }}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderRadius: borderRadius.md,
          background: colors.errorDark,
          border: `1px solid rgba(248, 81, 73, 0.3)`,
          color: colors.error,
          fontSize: fontSize.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <span>Warning</span>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: colors.error,
              cursor: 'pointer',
              fontSize: fontSize.lg,
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div style={{
          padding: spacing.md,
          marginBottom: spacing.lg,
          borderRadius: borderRadius.md,
          background: colors.successDark,
          border: `1px solid rgba(63, 185, 80, 0.3)`,
          color: colors.success,
          fontSize: fontSize.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <span>OK</span>
          {success}
          <button
            onClick={() => setSuccess(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: colors.success,
              cursor: 'pointer',
              fontSize: fontSize.lg,
            }}
          >
            x
          </button>
        </div>
      )}

      {/* Saved Flux Settings Card - Dashboard Style */}
      {fluxApiResponse?.ok && fluxApiResponse.source === 'backtest' && fluxApiResponse.backtest_info && (() => {
        const info = fluxApiResponse.backtest_info;
        const pnl = info.pnl || 0;
        const winRate = (info.win_rate || 0) * 100;
        const profitFactor = info.profit_factor || 0;
        const drawdown = (info.drawdown || 0) * 100;
        const tradeCount = info.trade_count || 0;
        const backtestDays = info.days || 30;
        const ranAt = info.ran_at ? new Date(info.ran_at) : null;

        const formatDate = (d) => d ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

        return (
          <div style={{
            background: colors.bgSecondary,
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            marginBottom: spacing.xl,
            border: `1px solid ${colors.borderAccent}`,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle radial glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 300,
              height: 200,
              background: `radial-gradient(ellipse at top right, ${pnl >= 0 ? 'rgba(212,165,116,0.1)' : 'rgba(248,81,73,0.1)'} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.lg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <h2 style={{
                  fontFamily: fontFamily.sans,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.semibold,
                  color: colors.textPrimary,
                  margin: 0,
                }}>
                  Your Flux Settings
                </h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: borderRadius.full,
                  background: colors.successDark,
                  color: colors.success,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Active
                </span>
              </div>
              {ranAt && (
                <span style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                }}>
                  Optimized {formatDate(ranAt)}
                </span>
              )}
            </div>

            {/* Hero Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.lg,
            }}>
              {/* Total P&L - Hero */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Total P&L
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: pnl >= 0 ? colors.accent : colors.error,
                }}>
                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                </div>
              </div>

              {/* Win Rate */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Win Rate
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: winRate >= 50 ? colors.success : colors.warning,
                }}>
                  {winRate.toFixed(1)}%
                </div>
              </div>

              {/* Profit Factor */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Profit Factor
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: profitFactor >= 1.5 ? colors.success : profitFactor >= 1 ? colors.accent : colors.warning,
                }}>
                  {profitFactor.toFixed(2)}
                </div>
              </div>

              {/* Max Drawdown */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Max Drawdown
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: colors.error,
                }}>
                  {drawdown.toFixed(1)}%
                </div>
              </div>

              {/* Trades */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Trades
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: colors.textPrimary,
                }}>
                  {tradeCount}
                </div>
              </div>

              {/* Backtest Period */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  fontFamily: fontFamily.sans,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: spacing.xs,
                }}>
                  Period
                </div>
                <div style={{
                  fontFamily: fontFamily.mono,
                  fontSize: fontSize['2xl'],
                  fontWeight: fontWeight.bold,
                  color: colors.textSecondary,
                }}>
                  {backtestDays}d
                </div>
              </div>
            </div>

            {/* Parameters Grid */}
            <div style={{
              background: colors.bgTertiary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
            }}>
              <div style={{
                fontSize: fontSize.xs,
                color: colors.textMuted,
                fontFamily: fontFamily.sans,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: spacing.sm,
              }}>
                Optimized Parameters
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: spacing.sm,
              }}>
                {Object.entries(fluxApiResponse.settings || {})
                  .filter(([key]) => {
                    // Only show keys defined in SETTING_META (trading parameters)
                    // Exclude system fields
                    const excludedKeys = ['user_id', 'updated_at', 'created_at', 'id', 'backtest_days', 'backtest_win_rate', 'backtest_pnl', 'backtest_drawdown', 'backtest_profit_factor', 'backtest_trade_count'];
                    return SETTING_META[key] && !excludedKeys.includes(key);
                  })
                  .map(([key, value]) => {
                    const meta = SETTING_META[key];
                    return (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: `${spacing.xs} 0`,
                        borderBottom: `1px solid ${colors.border}`,
                      }}>
                        <span style={{
                          fontSize: fontSize.sm,
                          color: colors.textSecondary,
                        }}>
                          {meta.name}
                        </span>
                        <span style={{
                          fontFamily: fontFamily.mono,
                          fontSize: fontSize.sm,
                          fontWeight: fontWeight.semibold,
                          color: colors.accent,
                        }}>
                          {meta.format(value)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Loading state */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: spacing.lg,
        }}>
          {[1, 2].map(i => (
            <div
              key={i}
              style={{
                ...cardStyle,
                height: 200,
                background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Backtest Section */}
          <div className="optimize-card" style={{
            ...cardStyle,
            marginBottom: spacing.xl,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.lg,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                <span style={{ fontSize: '20px' }}>Chart</span>
                <h2 style={typography.h2}>Backtest</h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: borderRadius.full,
                  background: colors.successDark,
                  color: colors.success,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                }}>
                  Grid Search
                </span>
              </div>
              <button
                onClick={handleRunBacktest}
                disabled={backtestRunning}
                style={{
                  padding: '10px 20px',
                  borderRadius: borderRadius.md,
                  border: 'none',
                  background: backtestRunning ? colors.bgTertiary : `linear-gradient(135deg, ${colors.success}, #2d8f40)`,
                  color: backtestRunning ? colors.textMuted : colors.bgPrimary,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.bold,
                  fontFamily: fontFamily.sans,
                  cursor: backtestRunning ? 'wait' : 'pointer',
                  transition: `all ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {backtestRunning ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>Loading</span>
                    Running...
                  </>
                ) : (
                  `Run Backtest (${days}D)`
                )}
              </button>
            </div>

            <p style={{
              ...typography.bodySmall,
              marginBottom: spacing.lg,
            }}>
              Find the optimal parameters using grid search optimization over {days} days of historical data.
            </p>

            {/* Current vs Optimized Cards */}
            {backtest && backtest.current?.total_trades > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: spacing.lg,
                marginBottom: spacing.lg,
              }}>
                {/* Current Performance */}
                <div style={{
                  padding: spacing.lg,
                  background: colors.bgSecondary,
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.border}`,
                }}>
                  <h3 style={{
                    ...typography.h3,
                    color: colors.textSecondary,
                    marginBottom: spacing.md,
                  }}>
                    Current Settings
                  </h3>
                  <div style={{ display: 'grid', gap: spacing.sm }}>
                    <MetricRow label="Win Rate" value={`${(backtest.current?.win_rate * 100 || 0).toFixed(1)}%`} color={colors.textPrimary} />
                    <MetricRow label="Total Return" value={`${(backtest.current?.total_return_pct || 0).toFixed(2)}%`} color={backtest.current?.total_return_pct >= 0 ? colors.success : colors.error} />
                    <MetricRow label="Profit Factor" value={(backtest.current?.profit_factor || 0).toFixed(2)} color={colors.textPrimary} />
                    <MetricRow label="Trades" value={backtest.current?.total_trades || 0} color={colors.textMuted} />
                  </div>
                </div>

                {/* Optimized Performance (if available) */}
                {backtest.optimized && (
                  <div style={{
                    padding: spacing.lg,
                    background: colors.bgSecondary,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.borderAccent}`,
                  }}>
                    <h3 style={{
                      ...typography.h3,
                      color: colors.accent,
                      marginBottom: spacing.md,
                    }}>
                      Optimized Settings
                    </h3>
                    <div style={{ display: 'grid', gap: spacing.sm }}>
                      <MetricRow label="Win Rate" value={`${(backtest.optimized?.win_rate * 100 || 0).toFixed(1)}%`} color={colors.success} />
                      <MetricRow label="Total Return" value={`${(backtest.optimized?.total_return_pct || 0).toFixed(2)}%`} color={backtest.optimized?.total_return_pct >= 0 ? colors.success : colors.error} />
                      <MetricRow label="Profit Factor" value={(backtest.optimized?.profit_factor || 0).toFixed(2)} color={colors.textPrimary} />
                      <MetricRow label="Trades" value={backtest.optimized?.total_trades || 0} color={colors.textMuted} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Backtest Results (after running) */}
            {backtestResults && (
              <div style={{
                background: colors.bgTertiary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                border: `1px solid ${colors.borderAccent}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <h3 style={{
                    ...typography.h3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}>
                    Optimal Parameters Found
                    {backtestResults.source === 'saved' && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: borderRadius.full,
                        background: colors.bgTertiary,
                        border: `1px solid ${colors.border}`,
                        color: colors.textMuted,
                        fontSize: fontSize.xs,
                        fontWeight: fontWeight.medium,
                      }}>
                        Saved
                      </span>
                    )}
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: spacing.xs,
                  }}>
                    {backtestResults.total_combinations && (
                      <span style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        fontFamily: fontFamily.mono,
                      }}>
                        {backtestResults.total_combinations} combos tested
                      </span>
                    )}
                    {backtestResults.ran_at && (
                      <span style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                      }}>
                        Last run: {formatTimeAgo(backtestResults.ran_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Best Parameters */}
                {backtestResults.best_params && Object.keys(backtestResults.best_params).length > 0 && (
                  <div style={{ marginBottom: spacing.lg }}>
                    <h4 style={{
                      fontSize: fontSize.sm,
                      color: colors.textSecondary,
                      fontWeight: fontWeight.semibold,
                      marginBottom: spacing.sm,
                    }}>
                      Best Parameters:
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: spacing.sm,
                    }}>
                      {Object.entries(backtestResults.best_params).map(([key, value]) => {
                        const meta = SETTING_META[key] || { name: key, format: null };
                        return (
                          <div key={key} style={{
                            padding: spacing.sm,
                            background: colors.bgSecondary,
                            borderRadius: borderRadius.sm,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <span style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                              {meta.name || key}
                            </span>
                            <span style={{
                              fontFamily: fontFamily.mono,
                              fontSize: fontSize.sm,
                              fontWeight: fontWeight.bold,
                              color: colors.accent,
                            }}>
                              {meta.format ? meta.format(value) : typeof value === 'number' ? value.toFixed(4) : value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Metrics Grid */}
                {backtestResults.best_metrics && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: spacing.md,
                    marginBottom: spacing.lg,
                  }}>
                    <MetricCard label="Total Trades" value={backtestResults.best_metrics.total_trades || 0} color={colors.textPrimary} />
                    <MetricCard label="Win Rate" value={`${((backtestResults.best_metrics.win_rate || 0) * 100).toFixed(1)}%`} color={(backtestResults.best_metrics.win_rate || 0) >= 0.5 ? colors.success : colors.warning} />
                    <MetricCard label="Total Return" value={`${(backtestResults.best_metrics.total_return_pct || 0).toFixed(2)}%`} color={(backtestResults.best_metrics.total_return_pct || 0) >= 0 ? colors.success : colors.error} />
                    <MetricCard label="Profit Factor" value={(backtestResults.best_metrics.profit_factor || 0).toFixed(2)} color={(backtestResults.best_metrics.profit_factor || 0) >= 1 ? colors.success : colors.warning} />
                    <MetricCard label="Max Drawdown" value={`${(backtestResults.best_metrics.max_drawdown_pct || 0).toFixed(2)}%`} color={colors.error} />
                  </div>
                )}

                {/* Save Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  {backtestResults.source === 'saved' ? (
                    <div style={{
                      padding: '14px 40px',
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.border}`,
                      background: colors.bgSecondary,
                      color: colors.textMuted,
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.medium,
                      fontFamily: fontFamily.sans,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                    }}>
                      Already Saved
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveToFluxSettings}
                      disabled={savingToFlux || !backtestResults.best_params}
                      style={{
                        padding: '14px 40px',
                        borderRadius: borderRadius.md,
                        border: 'none',
                        background: `linear-gradient(135deg, #3b82f6, #2563eb)`,
                        color: '#fff',
                        fontSize: fontSize.base,
                        fontWeight: fontWeight.bold,
                        fontFamily: fontFamily.sans,
                        cursor: savingToFlux ? 'wait' : 'pointer',
                        opacity: savingToFlux ? 0.7 : 1,
                        transition: `all ${transitions.fast}`,
                        boxShadow: shadows.md,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                      }}
                    >
                      {savingToFlux ? 'Saving...' : 'Save to Flux Settings'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* No trades message */}
            {(!backtest?.current?.total_trades || backtest.current.total_trades === 0) && !backtestResults && (
              <div style={{
                padding: spacing.xl,
                textAlign: 'center',
                color: colors.textMuted,
              }}>
                <p style={{ margin: 0, fontSize: fontSize.sm }}>
                  No completed trades found in the last <strong>{days} days</strong>.
                  <br />
                  Try selecting a longer period or wait for more trading data.
                </p>
              </div>
            )}
          </div>

          {/* What-If Analysis Section */}
          <div className="optimize-card" style={{
            ...cardStyle,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}>
              <span style={{ fontSize: '20px' }}>Lab</span>
              <h2 style={typography.h2}>What-If Analysis</h2>
              <span style={{
                padding: '4px 10px',
                borderRadius: borderRadius.full,
                background: colors.infoDark || colors.bgTertiary,
                color: colors.info,
                fontSize: fontSize.xs,
                fontWeight: fontWeight.semibold,
              }}>
                Cycle Replay
              </span>
            </div>

            <p style={{
              ...typography.bodySmall,
              marginBottom: spacing.lg,
            }}>
              Replay historical decisions with different settings. See how parameter changes
              would have affected your trading performance over the last {days} days.
            </p>

            {/* Config Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.md,
              marginBottom: spacing.lg,
            }}>
              {/* Confidence Threshold */}
              <ConfigSlider
                label="Confidence Threshold"
                value={whatIfConfig.conf_threshold}
                min={0.40}
                max={0.90}
                step={0.05}
                format={(v) => `${(v * 100).toFixed(0)}%`}
                color={colors.accent}
                onChange={(v) => updateWhatIfConfig('conf_threshold', v)}
              />

              {/* Stop Loss */}
              <ConfigSlider
                label="Stop Loss %"
                value={whatIfConfig.stop_loss_pct}
                min={0.005}
                max={0.03}
                step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}%`}
                color={colors.error}
                onChange={(v) => updateWhatIfConfig('stop_loss_pct', v)}
              />

              {/* Take Profit */}
              <ConfigSlider
                label="Take Profit %"
                value={whatIfConfig.take_profit_pct}
                min={0.01}
                max={0.05}
                step={0.005}
                format={(v) => `${(v * 100).toFixed(1)}%`}
                color={colors.success}
                onChange={(v) => updateWhatIfConfig('take_profit_pct', v)}
              />

              {/* Max Hold Time */}
              <ConfigSlider
                label="Max Hold (min)"
                value={whatIfConfig.max_hold_min}
                min={30}
                max={240}
                step={15}
                format={(v) => `${v}m`}
                color={colors.textPrimary}
                onChange={(v) => updateWhatIfConfig('max_hold_min', v)}
              />

              {/* Max Trades Per Day */}
              <ConfigSlider
                label="Max Trades/Day"
                value={whatIfConfig.max_trades_per_day}
                min={1}
                max={10}
                step={1}
                format={(v) => `${v}`}
                color={colors.textPrimary}
                onChange={(v) => updateWhatIfConfig('max_trades_per_day', v)}
              />

              {/* Toggles */}
              <div style={{
                padding: spacing.md,
                background: colors.bgSecondary,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm,
              }}>
                <label style={{
                  fontSize: fontSize.sm,
                  color: colors.textSecondary,
                }}>
                  Filters
                </label>
                <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    cursor: 'pointer',
                    fontSize: fontSize.sm,
                    color: colors.textPrimary,
                  }}>
                    <input
                      type="checkbox"
                      checked={whatIfConfig.mq_required}
                      onChange={(e) => updateWhatIfConfig('mq_required', e.target.checked)}
                    />
                    MQ Required
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    cursor: 'pointer',
                    fontSize: fontSize.sm,
                    color: colors.textPrimary,
                  }}>
                    <input
                      type="checkbox"
                      checked={whatIfConfig.trailing_enabled}
                      onChange={(e) => updateWhatIfConfig('trailing_enabled', e.target.checked)}
                    />
                    Trailing Stop
                  </label>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: spacing.lg,
            }}>
              <button
                onClick={handleWhatIfAnalysis}
                disabled={whatIfRunning}
                style={{
                  padding: '12px 32px',
                  borderRadius: borderRadius.md,
                  border: 'none',
                  background: whatIfRunning ? colors.bgTertiary : colors.info,
                  color: whatIfRunning ? colors.textMuted : colors.bgPrimary,
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.bold,
                  fontFamily: fontFamily.sans,
                  cursor: whatIfRunning ? 'wait' : 'pointer',
                  transition: `all ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                {whatIfRunning ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>Loading</span>
                    Running Analysis...
                  </>
                ) : (
                  'Run What-If Analysis'
                )}
              </button>
            </div>

            {/* Results */}
            {whatIfResults && (
              <div style={{
                background: colors.bgTertiary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                border: `1px solid ${colors.borderAccent}`,
              }}>
                <h3 style={{
                  ...typography.h3,
                  marginBottom: spacing.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}>
                  Analysis Results
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: spacing.md,
                  marginBottom: spacing.lg,
                }}>
                  <MetricCard label="Total Trades" value={whatIfResults.total_trades || 0} color={colors.textPrimary} />
                  <MetricCard label="Win Rate" value={`${((whatIfResults.win_rate || 0) * 100).toFixed(1)}%`} color={(whatIfResults.win_rate || 0) >= 0.5 ? colors.success : colors.warning} />
                  <MetricCard label="Total P&L %" value={`${((whatIfResults.total_pnl_pct || 0) * 100).toFixed(2)}%`} color={(whatIfResults.total_pnl_pct || 0) >= 0 ? colors.success : colors.error} />
                  <MetricCard label="Profit Factor" value={(whatIfResults.profit_factor || 0).toFixed(2)} color={(whatIfResults.profit_factor || 0) >= 1 ? colors.success : colors.warning} />
                  <MetricCard label="Max Drawdown" value={`${((whatIfResults.max_drawdown_pct || 0) * 100).toFixed(2)}%`} color={colors.error} />
                  <MetricCard label="Avg Hold (min)" value={(whatIfResults.avg_hold_minutes || 0).toFixed(0)} color={colors.textPrimary} />
                </div>

                {/* Trade Summary */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: spacing.lg,
                  marginBottom: spacing.md,
                  fontSize: fontSize.sm,
                }}>
                  <span style={{ color: colors.success }}>
                    {whatIfResults.winning_trades || 0} Wins
                  </span>
                  <span style={{ color: colors.textMuted }}>|</span>
                  <span style={{ color: colors.error }}>
                    {whatIfResults.losing_trades || 0} Losses
                  </span>
                </div>

                {/* Decision Stats */}
                <div style={{
                  fontSize: fontSize.xs,
                  color: colors.textMuted,
                  textAlign: 'center',
                }}>
                  Analyzed {whatIfResults.total_decisions || 0} historical decisions
                </div>

                {/* Zero Trades Diagnostic */}
                {whatIfResults.total_trades === 0 && whatIfResults.blocking_filter_message && (
                  <div style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    background: colors.warningDark,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.warning}30`,
                  }}>
                    <div style={{
                      fontSize: fontSize.sm,
                      color: colors.warning,
                      marginBottom: spacing.sm,
                      fontWeight: fontWeight.semibold,
                    }}>
                      Why no trades?
                    </div>
                    <div style={{
                      fontSize: fontSize.base,
                      color: colors.textPrimary,
                      padding: spacing.sm,
                      background: `${colors.warning}15`,
                      borderRadius: borderRadius.sm,
                      borderLeft: `3px solid ${colors.warning}`,
                    }}>
                      {whatIfResults.blocking_filter_message}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

// Metric row component
function MetricRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span style={{
        fontSize: fontSize.sm,
        color: colors.textMuted,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: fontFamily.mono,
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: color,
      }}>
        {value}
      </span>
    </div>
  );
}

// Metric card component
function MetricCard({ label, value, color }) {
  return (
    <div className="metric-card" style={{
      padding: spacing.md,
      background: colors.bgSecondary,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.border}`,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginBottom: spacing.xs,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: color,
        fontFamily: fontFamily.mono,
      }}>
        {value}
      </div>
    </div>
  );
}

// Config slider component
function ConfigSlider({ label, value, min, max, step, format, color, onChange }) {
  return (
    <div style={{
      padding: spacing.md,
      background: colors.bgSecondary,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.border}`,
    }}>
      <label style={{
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        display: 'block',
        marginBottom: spacing.xs,
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{
          fontFamily: fontFamily.mono,
          fontSize: fontSize.sm,
          color: color,
          minWidth: 50,
          textAlign: 'right',
        }}>
          {format(value)}
        </span>
      </div>
    </div>
  );
}
