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
  glassStyle,
  cardStyle,
  typography,
} from '../lib/theme';
import {
  fetchQuickBacktest,
  fetchSettingsSuggestions,
  runBacktest,
  logSuggestionAction,
  saveUserSettings,
  fetchUserSettings,
} from '../lib/api';

const colors = darkTheme;

// Setting display names and descriptions
const SETTING_META = {
  stop_loss_pct: {
    name: 'Stop Loss',
    unit: '%',
    description: 'Maximum loss before position closes',
    icon: '🛡️',
  },
  take_profit_pct: {
    name: 'Take Profit',
    unit: '%',
    description: 'Target profit to lock in gains',
    icon: '🎯',
  },
  entry_momentum_threshold: {
    name: 'Entry Momentum',
    unit: '%',
    description: 'Minimum momentum for trade entry',
    icon: '📈',
  },
  trailing_stop_activation: {
    name: 'Trailing Activation',
    unit: '%',
    description: 'Profit level to activate trailing stop',
    icon: '🔄',
  },
  trailing_stop_distance: {
    name: 'Trailing Distance',
    unit: '%',
    description: 'Distance from peak before stop triggers',
    icon: '📏',
  },
  max_hold_hours: {
    name: 'Max Hold Time',
    unit: 'hrs',
    description: 'Maximum time to hold a position',
    icon: '⏱️',
  },
};

// Confidence level styling
function getConfidenceStyle(confidence) {
  if (confidence >= 0.8) return { color: colors.success, label: 'High', bg: colors.successDark };
  if (confidence >= 0.6) return { color: colors.accent, label: 'Medium', bg: colors.accentDark };
  return { color: colors.warning, label: 'Low', bg: colors.warningDark };
}

// Format percentage change
function formatDelta(value, isPercent = true) {
  const sign = value > 0 ? '+' : '';
  const suffix = isPercent ? '%' : '';
  return `${sign}${value.toFixed(2)}${suffix}`;
}

export default function OptimizePage() {
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [runningBacktest, setRunningBacktest] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [bt, sugg] = await Promise.all([
        fetchQuickBacktest(days),
        fetchSettingsSuggestions(days),
      ]);
      setBacktest(bt);
      setSuggestions(sugg?.suggestions || []);
      // Pre-select high confidence suggestions
      const highConf = new Set(
        (sugg?.suggestions || [])
          .filter(s => s.confidence >= 0.7)
          .map(s => s.setting_name)
      );
      setSelectedSuggestions(highConf);
    } catch (e) {
      console.error('Failed to load optimization data:', e);
      setError('Failed to load optimization data. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Toggle suggestion selection
  function toggleSuggestion(settingName) {
    const next = new Set(selectedSuggestions);
    if (next.has(settingName)) {
      next.delete(settingName);
    } else {
      next.add(settingName);
    }
    setSelectedSuggestions(next);
  }

  // Run custom backtest with selected suggestions
  async function handleRunBacktest() {
    if (selectedSuggestions.size === 0) return;
    setRunningBacktest(true);
    try {
      const settings = {};
      suggestions.forEach(s => {
        if (selectedSuggestions.has(s.setting_name)) {
          settings[s.setting_name] = s.suggested_value;
        }
      });
      const result = await runBacktest(settings, days, true);
      setBacktest(result);
    } catch (e) {
      console.error('Backtest failed:', e);
      setError('Backtest failed. Please try again.');
    } finally {
      setRunningBacktest(false);
    }
  }

  // Apply selected suggestions
  async function handleApply() {
    if (selectedSuggestions.size === 0) return;
    setApplying(true);
    try {
      // Build settings payload
      const payload = {};
      for (const s of suggestions) {
        if (selectedSuggestions.has(s.setting_name)) {
          payload[s.setting_name] = s.suggested_value;
          // Log action
          await logSuggestionAction(
            s.setting_name,
            s.current_value,
            s.suggested_value,
            'accepted'
          );
        }
      }
      await saveUserSettings(payload);
      setShowConfirm(false);
      // Reload to show updated values
      loadData();
    } catch (e) {
      console.error('Failed to apply settings:', e);
      setError('Failed to apply settings. Please try again.');
    } finally {
      setApplying(false);
    }
  }

  // Dismiss a suggestion
  async function handleDismiss(suggestion) {
    try {
      await logSuggestionAction(
        suggestion.setting_name,
        suggestion.current_value,
        suggestion.suggested_value,
        'dismissed'
      );
      setSuggestions(prev => prev.filter(s => s.setting_name !== suggestion.setting_name));
      selectedSuggestions.delete(suggestion.setting_name);
      setSelectedSuggestions(new Set(selectedSuggestions));
    } catch (e) {
      console.error('Failed to dismiss suggestion:', e);
    }
  }

  return (
    <Layout active="optimize">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 165, 116, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(212, 165, 116, 0); }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .optimize-card {
          animation: fadeInUp 0.5s ease-out both;
        }

        .optimize-card:nth-child(1) { animation-delay: 0.1s; }
        .optimize-card:nth-child(2) { animation-delay: 0.2s; }
        .optimize-card:nth-child(3) { animation-delay: 0.3s; }

        .suggestion-row {
          transition: all 0.2s ease;
        }

        .suggestion-row:hover {
          background: ${colors.bgHover} !important;
          transform: translateX(4px);
        }

        .metric-card {
          transition: all 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          border-color: ${colors.borderAccent} !important;
        }

        .apply-btn {
          animation: pulse-gold 2s infinite;
        }

        .apply-btn:hover {
          animation: none;
        }

        .gradient-border {
          position: relative;
        }

        .gradient-border::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1px;
          background: linear-gradient(135deg, ${colors.accent}, ${colors.success}, ${colors.accent});
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          pointer-events: none;
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
            <span style={{ fontSize: '28px' }}>✨</span>
            Optimize Settings
          </h1>
          <p style={{
            ...typography.bodySmall,
            marginTop: spacing.xs,
          }}>
            ML-powered suggestions based on your trading history
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
          <span>⚠️</span>
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
            ×
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: spacing.lg,
        }}>
          {[1, 2, 3].map(i => (
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
          {/* Backtest Comparison Cards */}
          {backtest && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}>
              {/* Current Performance Card */}
              <div className="optimize-card" style={{
                ...cardStyle,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: colors.textMuted,
                  opacity: 0.5,
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.lg,
                }}>
                  <span style={{ fontSize: '20px' }}>📊</span>
                  <h2 style={{ ...typography.h3, color: colors.textSecondary }}>
                    Current Settings
                  </h2>
                </div>

                <div style={{ display: 'grid', gap: spacing.md }}>
                  <MetricRow
                    label="Win Rate"
                    value={`${(backtest.current?.win_rate * 100 || 0).toFixed(1)}%`}
                    color={colors.textPrimary}
                  />
                  <MetricRow
                    label="Total Return"
                    value={`${(backtest.current?.total_return_pct || 0).toFixed(2)}%`}
                    color={backtest.current?.total_return_pct >= 0 ? colors.success : colors.error}
                  />
                  <MetricRow
                    label="Max Drawdown"
                    value={`${(backtest.current?.max_drawdown_pct || 0).toFixed(2)}%`}
                    color={colors.error}
                  />
                  <MetricRow
                    label="Profit Factor"
                    value={(backtest.current?.profit_factor || 0).toFixed(2)}
                    color={colors.textPrimary}
                  />
                  <MetricRow
                    label="Total Trades"
                    value={backtest.current?.total_trades || 0}
                    color={colors.textMuted}
                  />
                </div>
              </div>

              {/* Optimized Performance Card */}
              <div className="optimize-card gradient-border" style={{
                ...cardStyle,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: `linear-gradient(90deg, ${colors.accent}, ${colors.success})`,
                }} />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.lg,
                }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <h2 style={{ ...typography.h3, color: colors.accent }}>
                    ML Optimized
                  </h2>
                  {backtest.improvement?.win_rate_delta > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '4px 10px',
                      borderRadius: borderRadius.full,
                      background: colors.successDark,
                      color: colors.success,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.bold,
                    }}>
                      +{(backtest.improvement.win_rate_delta * 100).toFixed(1)}% Win Rate
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: spacing.md }}>
                  <MetricRow
                    label="Win Rate"
                    value={`${(backtest.optimized?.win_rate * 100 || 0).toFixed(1)}%`}
                    color={colors.success}
                    delta={backtest.improvement?.win_rate_delta ? formatDelta(backtest.improvement.win_rate_delta * 100) : null}
                  />
                  <MetricRow
                    label="Total Return"
                    value={`${(backtest.optimized?.total_return_pct || 0).toFixed(2)}%`}
                    color={backtest.optimized?.total_return_pct >= 0 ? colors.success : colors.error}
                    delta={backtest.improvement?.return_delta ? formatDelta(backtest.improvement.return_delta) : null}
                  />
                  <MetricRow
                    label="Max Drawdown"
                    value={`${(backtest.optimized?.max_drawdown_pct || 0).toFixed(2)}%`}
                    color={colors.warning}
                    delta={backtest.improvement?.drawdown_delta ? formatDelta(backtest.improvement.drawdown_delta) : null}
                  />
                  <MetricRow
                    label="Profit Factor"
                    value={(backtest.optimized?.profit_factor || 0).toFixed(2)}
                    color={colors.textPrimary}
                    delta={backtest.improvement?.profit_factor_delta ? formatDelta(backtest.improvement.profit_factor_delta, false) : null}
                  />
                  <MetricRow
                    label="Total Trades"
                    value={backtest.optimized?.total_trades || 0}
                    color={colors.textMuted}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Section */}
          <div className="optimize-card" style={{
            ...cardStyle,
            marginBottom: spacing.xl,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.lg,
              flexWrap: 'wrap',
              gap: spacing.md,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <h2 style={typography.h2}>Suggested Changes</h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: borderRadius.full,
                  background: colors.bgTertiary,
                  color: colors.textSecondary,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                }}>
                  {suggestions.length} suggestions
                </span>
              </div>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button
                  onClick={() => {
                    if (selectedSuggestions.size === suggestions.length) {
                      setSelectedSuggestions(new Set());
                    } else {
                      setSelectedSuggestions(new Set(suggestions.map(s => s.setting_name)));
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgTertiary,
                    color: colors.textSecondary,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                    fontFamily: fontFamily.sans,
                    cursor: 'pointer',
                    transition: `all ${transitions.fast}`,
                  }}
                >
                  {selectedSuggestions.size === suggestions.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleRunBacktest}
                  disabled={runningBacktest || selectedSuggestions.size === 0}
                  style={{
                    padding: '8px 16px',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgTertiary,
                    color: selectedSuggestions.size === 0 ? colors.textMuted : colors.info,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.medium,
                    fontFamily: fontFamily.sans,
                    cursor: selectedSuggestions.size === 0 ? 'not-allowed' : 'pointer',
                    opacity: runningBacktest ? 0.7 : 1,
                    transition: `all ${transitions.fast}`,
                  }}
                >
                  {runningBacktest ? 'Running...' : 'Run Backtest'}
                </button>
              </div>
            </div>

            {suggestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: spacing['3xl'],
                color: colors.textMuted,
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: spacing.md }}>📭</span>
                <p>No suggestions available. Need more trade data to analyze.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: spacing.sm }}>
                {suggestions.map((suggestion, idx) => {
                  const meta = SETTING_META[suggestion.setting_name] || {
                    name: suggestion.setting_name,
                    unit: '',
                    description: '',
                    icon: '⚙️',
                  };
                  const confStyle = getConfidenceStyle(suggestion.confidence);
                  const isSelected = selectedSuggestions.has(suggestion.setting_name);
                  const delta = suggestion.suggested_value - suggestion.current_value;
                  const deltaPercent = suggestion.current_value !== 0
                    ? ((delta / suggestion.current_value) * 100).toFixed(1)
                    : 0;

                  return (
                    <div
                      key={suggestion.setting_name}
                      className="suggestion-row"
                      onClick={() => toggleSuggestion(suggestion.setting_name)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto auto',
                        alignItems: 'center',
                        gap: spacing.lg,
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        background: isSelected ? colors.accentDark : colors.bgSecondary,
                        border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                        cursor: 'pointer',
                        animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: borderRadius.sm,
                        border: `2px solid ${isSelected ? colors.accent : colors.border}`,
                        background: isSelected ? colors.accent : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.bgPrimary,
                        fontWeight: fontWeight.bold,
                        fontSize: fontSize.xs,
                        transition: `all ${transitions.fast}`,
                      }}>
                        {isSelected && '✓'}
                      </div>

                      {/* Setting info */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginBottom: 2,
                        }}>
                          <span style={{ fontSize: fontSize.md }}>{meta.icon}</span>
                          <span style={{
                            fontWeight: fontWeight.semibold,
                            color: colors.textPrimary,
                            fontSize: fontSize.base,
                          }}>
                            {meta.name}
                          </span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: borderRadius.full,
                            background: confStyle.bg,
                            color: confStyle.color,
                            fontSize: fontSize.xs,
                            fontWeight: fontWeight.semibold,
                          }}>
                            {confStyle.label}
                          </span>
                        </div>
                        <p style={{
                          fontSize: fontSize.sm,
                          color: colors.textMuted,
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {suggestion.reason || meta.description}
                        </p>
                      </div>

                      {/* Value change */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                      }}>
                        <span style={{ color: colors.textMuted }}>
                          {suggestion.current_value}{meta.unit}
                        </span>
                        <span style={{ color: colors.accent }}>→</span>
                        <span style={{ color: colors.accent, fontWeight: fontWeight.bold }}>
                          {suggestion.suggested_value}{meta.unit}
                        </span>
                      </div>

                      {/* Impact estimate */}
                      <div style={{
                        textAlign: 'right',
                        minWidth: 80,
                      }}>
                        {suggestion.impact_estimate && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: borderRadius.full,
                            background: suggestion.impact_estimate > 0 ? colors.successDark : colors.errorDark,
                            color: suggestion.impact_estimate > 0 ? colors.success : colors.error,
                            fontSize: fontSize.xs,
                            fontWeight: fontWeight.semibold,
                            fontFamily: fontFamily.mono,
                          }}>
                            {formatDelta(suggestion.impact_estimate)}
                          </span>
                        )}
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(suggestion);
                        }}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: borderRadius.full,
                          border: 'none',
                          background: 'transparent',
                          color: colors.textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: fontSize.md,
                          transition: `all ${transitions.fast}`,
                        }}
                        title="Dismiss suggestion"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Apply Button */}
          {suggestions.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: spacing.xl,
            }}>
              <button
                className="apply-btn"
                onClick={() => setShowConfirm(true)}
                disabled={selectedSuggestions.size === 0}
                style={{
                  padding: '16px 48px',
                  borderRadius: borderRadius.lg,
                  border: 'none',
                  background: selectedSuggestions.size === 0
                    ? colors.bgTertiary
                    : `linear-gradient(135deg, ${colors.accent}, #C4956A)`,
                  color: selectedSuggestions.size === 0 ? colors.textMuted : colors.bgPrimary,
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.bold,
                  fontFamily: fontFamily.sans,
                  cursor: selectedSuggestions.size === 0 ? 'not-allowed' : 'pointer',
                  transition: `all ${transitions.normal}`,
                  boxShadow: selectedSuggestions.size > 0 ? shadows.lg : 'none',
                }}
              >
                Apply {selectedSuggestions.size} Change{selectedSuggestions.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            padding: spacing.lg,
            borderRadius: borderRadius.md,
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: fontSize.xs,
              color: colors.textMuted,
              margin: 0,
              lineHeight: 1.6,
            }}>
              <strong style={{ color: colors.warning }}>⚠️ Important:</strong>{' '}
              Past performance does not guarantee future results. ML suggestions are based on historical
              trade analysis and market conditions may change. Always review changes before applying
              and trade responsibly.
            </p>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: spacing.lg,
        }}>
          <div style={{
            ...cardStyle,
            maxWidth: 480,
            width: '100%',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h2 style={typography.h2}>Confirm Changes</h2>
            </div>

            <p style={{
              ...typography.bodySmall,
              marginBottom: spacing.lg,
            }}>
              You are about to apply {selectedSuggestions.size} setting change{selectedSuggestions.size !== 1 ? 's' : ''}
              to your trading configuration. These changes will take effect immediately.
            </p>

            {/* Changes summary */}
            <div style={{
              background: colors.bgSecondary,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {suggestions
                .filter(s => selectedSuggestions.has(s.setting_name))
                .map(s => {
                  const meta = SETTING_META[s.setting_name] || { name: s.setting_name, unit: '' };
                  return (
                    <div
                      key={s.setting_name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: `1px solid ${colors.border}`,
                        fontSize: fontSize.sm,
                      }}
                    >
                      <span style={{ color: colors.textSecondary }}>{meta.name}</span>
                      <span style={{ fontFamily: fontFamily.mono }}>
                        <span style={{ color: colors.textMuted }}>{s.current_value}</span>
                        {' → '}
                        <span style={{ color: colors.accent, fontWeight: fontWeight.bold }}>
                          {s.suggested_value}{meta.unit}
                        </span>
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Warning */}
            <div style={{
              padding: spacing.md,
              borderRadius: borderRadius.md,
              background: colors.warningDark,
              border: `1px solid rgba(210, 153, 34, 0.3)`,
              marginBottom: spacing.lg,
              fontSize: fontSize.sm,
              color: colors.warning,
            }}>
              <strong>Remember:</strong> Past performance does not guarantee future results.
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: spacing.md,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={applying}
                style={{
                  padding: '12px 24px',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.border}`,
                  background: colors.bgTertiary,
                  color: colors.textSecondary,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  fontFamily: fontFamily.sans,
                  cursor: 'pointer',
                  transition: `all ${transitions.fast}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                style={{
                  padding: '12px 24px',
                  borderRadius: borderRadius.md,
                  border: 'none',
                  background: colors.accent,
                  color: colors.bgPrimary,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.bold,
                  fontFamily: fontFamily.sans,
                  cursor: applying ? 'wait' : 'pointer',
                  opacity: applying ? 0.7 : 1,
                  transition: `all ${transitions.fast}`,
                }}
              >
                {applying ? 'Applying...' : 'Confirm & Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// Metric row component
function MetricRow({ label, value, color, delta }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{
          fontFamily: fontFamily.mono,
          fontSize: fontSize.md,
          fontWeight: fontWeight.bold,
          color: color,
        }}>
          {value}
        </span>
        {delta && (
          <span style={{
            fontSize: fontSize.xs,
            fontFamily: fontFamily.mono,
            color: delta.startsWith('+') ? colors.success : colors.error,
            background: delta.startsWith('+') ? colors.successDark : colors.errorDark,
            padding: '2px 6px',
            borderRadius: borderRadius.sm,
          }}>
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
