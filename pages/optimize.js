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
  runCycleReplay,
  compareCycleReplay,
  runParameterOptimization,
  fetchQuickOptimization,
  compareVsOptimal,
  saveToFluxSettings,
  saveToCustomSettings,
} from '../lib/api';

const colors = darkTheme;

// Setting display names and descriptions
const SETTING_META = {
  conf_threshold: {
    name: 'Confidence Threshold',
    unit: '%',
    description: 'Minimum LLM confidence required for trade entry.',
    icon: '🎚️',
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
  },
  stop_loss_pct: {
    name: 'Stop Loss',
    unit: '%',
    description: 'Distance from entry to stop loss. Lower = tighter protection, higher = more room.',
    icon: '🛑',
    format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  },
  take_profit_pct: {
    name: 'Take Profit',
    unit: '%',
    description: 'Distance from entry to take profit. Higher = more profit potential.',
    icon: '🎯',
    format: (v) => `${(Number(v) * 100).toFixed(1)}%`,
  },
  mom_entry_pct: {
    name: 'Momentum Threshold',
    unit: '%',
    description: 'Minimum momentum required for entry. Higher = stronger moves only.',
    icon: '🚀',
    format: (v) => `${(Number(v) * 100).toFixed(2)}%`,
  },
  trailing_stop_activation: {
    name: 'Trailing Stop Activation',
    unit: '%',
    description: 'Profit level to activate trailing stop (as % of TP target).',
    icon: '📈',
    format: (v) => `${(Number(v) * 100).toFixed(0)}%`,
  },
  trailing_stop_distance: {
    name: 'Trailing Stop Distance',
    unit: 'x',
    description: 'Distance for trailing stop as multiple of entry risk.',
    icon: '📏',
    format: (v) => `${Number(v).toFixed(2)}x`,
  },
  max_hold_min: {
    name: 'Max Hold Time',
    unit: 'min',
    description: 'Maximum minutes to hold a position before force exit.',
    icon: '⏱️',
    format: (v) => `${v} min`,
  },
};

// Get setting meta
function getSettingMeta() {
  return SETTING_META;
}

// Confidence level styling
function getConfidenceStyle(confidence) {
  if (confidence >= 0.8) return { color: colors.success, label: 'High', bg: colors.successDark };
  if (confidence >= 0.6) return { color: colors.accent, label: 'Medium', bg: colors.accentDark };
  return { color: colors.warning, label: 'Low', bg: colors.warningDark };
}

// Format percentage change (for numeric deltas)
function formatDelta(value, isPercent = true) {
  const num = Number(value) || 0;
  const sign = num > 0 ? '+' : '';
  const suffix = isPercent ? '%' : '';
  return `${sign}${num.toFixed(2)}${suffix}`;
}

// Check if a string represents a positive impact (starts with + or contains positive keywords)
function isPositiveImpact(impactStr) {
  if (!impactStr || typeof impactStr !== 'string') return false;
  // Check if starts with + or doesn't start with -
  return impactStr.trim().startsWith('+') ||
         (!impactStr.trim().startsWith('-') && impactStr.includes('protection'));
}

// Calculate delta string between two values
function calcDelta(current, previous, isPercent = true, higherIsBetter = true) {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.001) return null; // No meaningful change

  const sign = diff > 0 ? '+' : '';
  const suffix = isPercent ? '%' : '';
  const formatted = `${sign}${diff.toFixed(isPercent ? 2 : 2)}${suffix}`;

  // For metrics where lower is better (like drawdown), invert the color logic
  if (!higherIsBetter) {
    return diff < 0 ? `+${Math.abs(diff).toFixed(2)}${suffix}` : `-${Math.abs(diff).toFixed(2)}${suffix}`;
  }
  return formatted;
}

export default function OptimizePage() {
  const [loading, setLoading] = useState(true);
  const [backtest, setBacktest] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [applying, setApplying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [days, setDays] = useState(30);
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [isCustomBacktest, setIsCustomBacktest] = useState(false);
  const [showCustomBanner, setShowCustomBanner] = useState(false);
  const [previousBacktest, setPreviousBacktest] = useState(null);

  // Parameter Finder state
  const [paramFinderExpanded, setParamFinderExpanded] = useState(false);
  const [paramFinderRunning, setParamFinderRunning] = useState(false);
  const [paramFinderResults, setParamFinderResults] = useState(null);

  // What-If Analysis state
  const [whatIfExpanded, setWhatIfExpanded] = useState(false);
  const [whatIfRunning, setWhatIfRunning] = useState(false);
  const [whatIfResults, setWhatIfResults] = useState(null);
  const [whatIfConfig, setWhatIfConfig] = useState({
    conf_threshold: 0.60,
    win_prob_min: 0,
    mq_required: true,
    stop_loss_pct: 0.01,  // Match defaults.py DEFAULT_STOP_LOSS_PCT
    take_profit_pct: 0.02,
    max_hold_min: 120,
    trailing_enabled: true,
    trailing_activation: 0.70,
    trailing_distance: 1.0,
    max_trades_per_day: 5,
    max_trades_per_symbol_per_day: 2,
  });

  // Saving state
  const [savingToFlux, setSavingToFlux] = useState(false);
  const [savingToCustom, setSavingToCustom] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [days]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      console.log('[Optimize] Loading data for', days, 'days');
      const [bt, sugg] = await Promise.all([
        fetchQuickBacktest(days),
        fetchSettingsSuggestions(days),
      ]);
      console.log('[Optimize] Backtest response:', bt);
      console.log('[Optimize] Suggestions response:', sugg);

      // Check for API error responses
      if (bt?.ok === false) {
        throw new Error(bt.error || 'Backtest API returned error');
      }
      if (sugg?.ok === false) {
        throw new Error(sugg.error || 'Suggestions API returned error');
      }

      // Map backend response to expected frontend structure
      const mappedBacktest = {
        current: bt.current_performance || bt.current,
        optimized: bt.proposed_performance || bt.proposed || bt.optimized_performance || bt.optimized,
        improvement: bt.improvement,
        has_suggestions: bt.has_suggestions,
        trade_reduction_pct: bt.trade_reduction_pct || 0,
      };
      console.log('[Optimize] Mapped backtest:', mappedBacktest);

      setBacktest(mappedBacktest);
      setSuggestions(sugg?.suggestions || []);
      // Pre-select high confidence suggestions
      const highConf = new Set(
        (sugg?.suggestions || [])
          .filter(s => s.confidence >= 0.7)
          .map(s => s.setting_name)
      );
      setSelectedSuggestions(highConf);
    } catch (e) {
      console.error('[Optimize] Error details:', e);
      console.error('[Optimize] Error message:', e.message);
      console.error('[Optimize] Error stack:', e.stack);
      // Show the actual error message
      const errorMsg = e.message || 'Unknown error';
      setError(`Failed to load: ${errorMsg}`);
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
    setError(null);
    try {
      // Save current values to show delta after backtest
      setPreviousBacktest(backtest);

      const settings = {};
      suggestions.forEach(s => {
        if (selectedSuggestions.has(s.setting_name)) {
          settings[s.setting_name] = s.suggested_value;
        }
      });

      console.log('[Optimize] Running backtest with settings:', settings);
      const result = await runBacktest(settings, days, true);
      console.log('[Optimize] Backtest result:', result);

      if (result?.ok === false) {
        throw new Error(result.error || 'Backtest failed');
      }

      // Map the result to expected structure
      const mappedResult = {
        current: result.current,
        optimized: result.proposed || result.optimized,
        improvement: result.improvement,
        has_suggestions: true,
        trade_reduction_pct: result.trade_reduction_pct || 0,
      };

      setBacktest(mappedResult);
      setIsCustomBacktest(true);
      setShowCustomBanner(true);
      setSuccess('Backtest complete! Review the updated metrics below.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      console.error('Backtest failed:', e);
      setError(`Backtest failed: ${e.message || 'Please try again.'}`);
    } finally {
      setRunningBacktest(false);
    }
  }

  // Reset to initial comparison
  function handleResetBacktest() {
    setIsCustomBacktest(false);
    setShowCustomBanner(false);
    setPreviousBacktest(null);
    loadData();
  }

  // Just dismiss the banner overlay (keep custom backtest data)
  function handleDismissBanner() {
    setShowCustomBanner(false);
  }

  // Apply selected suggestions
  async function handleApply() {
    if (selectedSuggestions.size === 0) return;
    setApplying(true);
    setError(null);
    try {
      // Build settings payload with selected suggestions
      const payload = {};
      const appliedSettings = [];
      for (const s of suggestions) {
        if (selectedSuggestions.has(s.setting_name)) {
          payload[s.setting_name] = s.suggested_value;
          appliedSettings.push(s.setting_name);
        }
      }

      console.log('[Optimize] Applying settings:', payload);

      // Save to backend (partial update - only these fields)
      const result = await saveUserSettings(payload);

      console.log('[Optimize] Save result:', result);

      // Check for errors in response
      if (result?.ok === false) {
        throw new Error(result.error || 'Failed to save settings');
      }

      // Log accepted actions after successful save
      for (const s of suggestions) {
        if (selectedSuggestions.has(s.setting_name)) {
          await logSuggestionAction(
            s.setting_name,
            s.current_value,
            s.suggested_value,
            'accepted'
          ).catch(e => console.warn('Failed to log suggestion action:', e));
        }
      }

      setShowConfirm(false);
      setError(null);

      // Show success message
      setSuccess(`Successfully applied ${appliedSettings.length} setting${appliedSettings.length !== 1 ? 's' : ''}!`);
      setTimeout(() => setSuccess(null), 5000);

      // Reload to show updated values
      await loadData();

      // Clear selections since they've been applied
      setSelectedSuggestions(new Set());

    } catch (e) {
      console.error('Failed to apply settings:', e);
      setError(`Failed to apply settings: ${e.message || 'Unknown error'}`);
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

  // Run What-If Analysis
  async function handleWhatIfAnalysis() {
    setWhatIfRunning(true);
    setError(null);
    try {
      console.log('[Optimize] Running What-If analysis with config:', whatIfConfig);
      const result = await runCycleReplay({
        days,
        ...whatIfConfig,
      });
      console.log('[Optimize] What-If result:', result);

      if (result?.ok === false) {
        throw new Error(result.error || 'What-If analysis failed');
      }

      setWhatIfResults(result);
      setSuccess('What-If analysis complete!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      console.error('What-If analysis failed:', e);
      setError(`What-If analysis failed: ${e.message || 'Please try again.'}`);
    } finally {
      setWhatIfRunning(false);
    }
  }

  // Update What-If config
  function updateWhatIfConfig(key, value) {
    setWhatIfConfig(prev => ({ ...prev, [key]: value }));
  }

  // Run Parameter Finder (Grid Search Optimization)
  async function handleParamFinderRun() {
    setParamFinderRunning(true);
    setError(null);
    try {
      console.log('[Optimize] Running Parameter Finder for', days, 'days');
      const result = await runParameterOptimization({ days });
      console.log('[Optimize] Parameter Finder result:', result);

      if (result?.ok === false) {
        throw new Error(result.error || 'Parameter optimization failed');
      }

      setParamFinderResults(result);
      setSuccess('Parameter optimization complete! Best parameters found.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      console.error('Parameter finder failed:', e);
      setError(`Parameter optimization failed: ${e.message || 'Please try again.'}`);
    } finally {
      setParamFinderRunning(false);
    }
  }

  // Apply optimal parameters from Parameter Finder
  async function handleApplyOptimalParams() {
    if (!paramFinderResults?.best_params) return;
    setApplying(true);
    setError(null);
    try {
      const payload = { ...paramFinderResults.best_params };
      console.log('[Optimize] Applying optimal params:', payload);

      const result = await saveUserSettings(payload);
      if (result?.ok === false) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setSuccess('Successfully applied optimal parameters!');
      setTimeout(() => setSuccess(null), 5000);
      await loadData();
    } catch (e) {
      console.error('Failed to apply optimal params:', e);
      setError(`Failed to apply settings: ${e.message || 'Unknown error'}`);
    } finally {
      setApplying(false);
    }
  }

  // Save Parameter Finder results to Flux Settings
  async function handleSaveToFluxSettings() {
    if (!paramFinderResults?.best_params) return;
    setSavingToFlux(true);
    setError(null);
    try {
      const settings = { ...paramFinderResults.best_params };
      const metrics = paramFinderResults.best_metrics || {};

      console.log('[Optimize] Saving to Flux Settings:', { settings, metrics, days });

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

      // Reload data to reflect updated preset_id
      await loadData();
    } catch (e) {
      console.error('Failed to save to Flux Settings:', e);
      setError(`Failed to save: ${e.message || 'Unknown error'}`);
    } finally {
      setSavingToFlux(false);
    }
  }

  // Save What-If results to Custom Settings
  async function handleSaveToCustomSettings() {
    if (!whatIfResults || whatIfResults.total_trades === 0) return;
    setSavingToCustom(true);
    setError(null);
    try {
      // Build settings from whatIfConfig
      const settings = {
        llm_conf_threshold: whatIfConfig.conf_threshold,
        stop_loss_pct: whatIfConfig.stop_loss_pct,
        take_profit_pct: whatIfConfig.take_profit_pct,
        max_hold_min: whatIfConfig.max_hold_min,
        trailing_stop_enabled: whatIfConfig.trailing_enabled,
        trailing_stop_activation: whatIfConfig.trailing_activation,
        trailing_stop_distance: whatIfConfig.trailing_distance,
        trades_per_ticker_per_day: whatIfConfig.max_trades_per_symbol_per_day,
      };

      console.log('[Optimize] Saving to Custom Settings:', settings);

      const result = await saveToCustomSettings(settings);

      if (result?.ok === false) {
        throw new Error(result.error || 'Failed to save Custom Settings');
      }

      setSuccess('Saved to Custom Settings! Trading now uses these parameters.');
      setTimeout(() => setSuccess(null), 5000);

      // Reload data to reflect updated preset_id
      await loadData();
    } catch (e) {
      console.error('Failed to save to Custom Settings:', e);
      setError(`Failed to save: ${e.message || 'Unknown error'}`);
    } finally {
      setSavingToCustom(false);
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

        @keyframes bannerDropDown {
          0% {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          60% {
            transform: translate(-50%, 8px);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
            Data-driven suggestions to tune your trading parameters
          </p>
        </div>

        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
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
          <span>✓</span>
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
              {/* Show info banner if no trades in period */}
              {(!backtest.current?.total_trades || backtest.current.total_trades === 0) && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: spacing.lg,
                  borderRadius: borderRadius.md,
                  background: colors.bgSecondary,
                  border: `1px solid ${colors.border}`,
                  textAlign: 'center',
                  color: colors.textMuted,
                }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: spacing.sm }}>📊</span>
                  <p style={{ margin: 0, fontSize: fontSize.sm }}>
                    No completed trades found in the last <strong>{days} days</strong>.
                    <br />
                    Try selecting a longer period or wait for more trading data.
                  </p>
                </div>
              )}

              {/* Custom Backtest Overlay + Banner */}
              {showCustomBanner && (
                <>
                  {/* Backdrop Overlay */}
                  <div
                    onClick={handleDismissBanner}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998,
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      background: 'rgba(13, 17, 23, 0.7)',
                      animation: 'overlayFadeIn 0.3s ease-out forwards',
                      cursor: 'pointer',
                    }}
                  />

                  {/* Floating Banner */}
                  <div style={{
                    position: 'fixed',
                    top: spacing.xl,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 999,
                    width: 'calc(100% - 48px)',
                    maxWidth: '580px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing.lg} ${spacing.xl}`,
                    borderRadius: borderRadius.lg,
                    background: `linear-gradient(135deg, ${colors.accent}22, ${colors.bgCard})`,
                    border: `1px solid ${colors.accent}50`,
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${colors.accent}20`,
                    animation: 'bannerDropDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                      <span style={{ fontSize: '28px' }}>✨</span>
                      <div>
                        <span style={{ color: colors.accent, fontSize: fontSize.lg, fontWeight: fontWeight.bold, display: 'block' }}>
                          Custom Backtest Results
                        </span>
                        <span style={{
                          fontSize: fontSize.sm,
                          color: colors.textSecondary,
                        }}>
                          Comparing selected suggestions
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                      <button
                        onClick={handleResetBacktest}
                        style={{
                          padding: `${spacing.sm} ${spacing.md}`,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.accent}50`,
                          background: 'transparent',
                          color: colors.accent,
                          fontSize: fontSize.sm,
                          fontWeight: fontWeight.medium,
                          cursor: 'pointer',
                          transition: `all ${transitions.fast}`,
                        }}
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleDismissBanner}
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.textMuted}50`,
                          background: colors.bgSecondary,
                          color: colors.textPrimary,
                          fontSize: '18px',
                          cursor: 'pointer',
                          transition: `all ${transitions.fast}`,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Current Performance Card - only show if we have trades */}
              {backtest.current?.total_trades > 0 && (
                <>
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
                  background: isCustomBacktest ? colors.accent : colors.textMuted,
                  opacity: isCustomBacktest ? 1 : 0.5,
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
                  {isCustomBacktest && previousBacktest && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                    }}>
                      vs. initial
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gap: spacing.md }}>
                  <MetricRow
                    label="Win Rate"
                    value={`${(backtest.current?.win_rate * 100 || 0).toFixed(1)}%`}
                    color={colors.textPrimary}
                    delta={isCustomBacktest && previousBacktest ? calcDelta(
                      backtest.current?.win_rate * 100,
                      previousBacktest.current?.win_rate * 100
                    ) : null}
                  />
                  <MetricRow
                    label="Total Return"
                    value={`${(backtest.current?.total_return_pct || 0).toFixed(2)}%`}
                    color={backtest.current?.total_return_pct >= 0 ? colors.success : colors.error}
                    delta={isCustomBacktest && previousBacktest ? calcDelta(
                      backtest.current?.total_return_pct,
                      previousBacktest.current?.total_return_pct
                    ) : null}
                  />
                  <MetricRow
                    label="Profit Factor"
                    value={(backtest.current?.profit_factor || 0).toFixed(2)}
                    color={colors.textPrimary}
                    delta={isCustomBacktest && previousBacktest ? calcDelta(
                      backtest.current?.profit_factor,
                      previousBacktest.current?.profit_factor,
                      false
                    ) : null}
                  />
                  <MetricRow
                    label="Filtered Trades"
                    value={`${backtest.current?.filtered_trades || backtest.current?.total_trades || 0}`}
                    color={colors.textMuted}
                    subtitle={backtest.current?.total_trades ? `of ${backtest.current.total_trades} total` : null}
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
                    {isCustomBacktest ? 'With Selected Changes' : 'ML Optimized'}
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
                    delta={
                      isCustomBacktest && previousBacktest
                        ? calcDelta(backtest.optimized?.win_rate * 100, previousBacktest.optimized?.win_rate * 100)
                        : (backtest.improvement?.win_rate ? formatDelta(backtest.improvement.win_rate * 100) : null)
                    }
                  />
                  <MetricRow
                    label="Total Return"
                    value={`${(backtest.optimized?.total_return_pct || 0).toFixed(2)}%`}
                    color={backtest.optimized?.total_return_pct >= 0 ? colors.success : colors.error}
                    delta={
                      isCustomBacktest && previousBacktest
                        ? calcDelta(backtest.optimized?.total_return_pct, previousBacktest.optimized?.total_return_pct)
                        : (backtest.improvement?.total_return_pct ? formatDelta(backtest.improvement.total_return_pct) : null)
                    }
                  />
                  <MetricRow
                    label="Profit Factor"
                    value={(backtest.optimized?.profit_factor || 0).toFixed(2)}
                    color={colors.textPrimary}
                    delta={
                      isCustomBacktest && previousBacktest
                        ? calcDelta(backtest.optimized?.profit_factor, previousBacktest.optimized?.profit_factor, false)
                        : (backtest.improvement?.profit_factor ? formatDelta(backtest.improvement.profit_factor, false) : null)
                    }
                  />
                  <MetricRow
                    label="Filtered Trades"
                    value={`${backtest.optimized?.filtered_trades || backtest.optimized?.total_trades || 0}`}
                    color={colors.textMuted}
                    subtitle={backtest.trade_reduction_pct > 0 ? `${(backtest.trade_reduction_pct * 100).toFixed(0)}% fewer trades` : null}
                  />
                </div>
              </div>
                </>
              )}
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
                  const settingMeta = getSettingMeta();
                  const meta = settingMeta[suggestion.setting_name] || {
                    name: suggestion.setting_name,
                    unit: '',
                    description: '',
                    icon: '⚙️',
                  };
                  const confStyle = getConfidenceStyle(suggestion.confidence);
                  const isSelected = selectedSuggestions.has(suggestion.setting_name);
                  const currentVal = Number(suggestion.current_value) || 0;
                  const suggestedVal = Number(suggestion.suggested_value) || 0;
                  const delta = suggestedVal - currentVal;
                  const deltaPercent = currentVal !== 0
                    ? ((delta / currentVal) * 100).toFixed(1)
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
                          {meta.format ? meta.format(suggestion.current_value) : `${suggestion.current_value}${meta.unit}`}
                        </span>
                        <span style={{ color: colors.accent }}>→</span>
                        <span style={{ color: colors.accent, fontWeight: fontWeight.bold }}>
                          {meta.format ? meta.format(suggestion.suggested_value) : `${suggestion.suggested_value}${meta.unit}`}
                        </span>
                      </div>

                      {/* Impact estimate - displayed as string from backend */}
                      <div style={{
                        textAlign: 'right',
                        minWidth: 100,
                      }}>
                        {suggestion.impact_estimate && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: borderRadius.full,
                            background: isPositiveImpact(suggestion.impact_estimate) ? colors.successDark : colors.warningDark,
                            color: isPositiveImpact(suggestion.impact_estimate) ? colors.success : colors.warning,
                            fontSize: fontSize.xs,
                            fontWeight: fontWeight.semibold,
                          }}>
                            {suggestion.impact_estimate}
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

          {/* What-If Analysis Section */}
          <div className="optimize-card" style={{
            ...cardStyle,
            marginTop: spacing.xl,
          }}>
            <div
              onClick={() => setWhatIfExpanded(!whatIfExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: whatIfExpanded ? spacing.lg : 0,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                <span style={{ fontSize: '20px' }}>🔬</span>
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
              <button style={{
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                fontSize: fontSize.xl,
                cursor: 'pointer',
                transform: whatIfExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${transitions.fast}`,
              }}>
                ▼
              </button>
            </div>

            {whatIfExpanded && (
              <>
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
                      Confidence Threshold
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <input
                        type="range"
                        min="0.40"
                        max="0.90"
                        step="0.05"
                        value={whatIfConfig.conf_threshold}
                        onChange={(e) => updateWhatIfConfig('conf_threshold', parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                        color: colors.accent,
                        minWidth: 50,
                        textAlign: 'right',
                      }}>
                        {(whatIfConfig.conf_threshold * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Stop Loss */}
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
                      Stop Loss %
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <input
                        type="range"
                        min="0.005"
                        max="0.03"
                        step="0.005"
                        value={whatIfConfig.stop_loss_pct}
                        onChange={(e) => updateWhatIfConfig('stop_loss_pct', parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                        color: colors.error,
                        minWidth: 50,
                        textAlign: 'right',
                      }}>
                        {(whatIfConfig.stop_loss_pct * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Take Profit */}
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
                      Take Profit %
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <input
                        type="range"
                        min="0.01"
                        max="0.05"
                        step="0.005"
                        value={whatIfConfig.take_profit_pct}
                        onChange={(e) => updateWhatIfConfig('take_profit_pct', parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                        color: colors.success,
                        minWidth: 50,
                        textAlign: 'right',
                      }}>
                        {(whatIfConfig.take_profit_pct * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Max Hold Time */}
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
                      Max Hold (min)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <input
                        type="range"
                        min="30"
                        max="240"
                        step="15"
                        value={whatIfConfig.max_hold_min}
                        onChange={(e) => updateWhatIfConfig('max_hold_min', parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                        color: colors.textPrimary,
                        minWidth: 50,
                        textAlign: 'right',
                      }}>
                        {whatIfConfig.max_hold_min}m
                      </span>
                    </div>
                  </div>

                  {/* Max Trades Per Day */}
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
                      Max Trades/Day
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={whatIfConfig.max_trades_per_day}
                        onChange={(e) => updateWhatIfConfig('max_trades_per_day', parseInt(e.target.value))}
                        style={{ flex: 1 }}
                      />
                      <span style={{
                        fontFamily: fontFamily.mono,
                        fontSize: fontSize.sm,
                        color: colors.textPrimary,
                        minWidth: 50,
                        textAlign: 'right',
                      }}>
                        {whatIfConfig.max_trades_per_day}
                      </span>
                    </div>
                  </div>

                  {/* Toggles Row */}
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
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        Running Analysis...
                      </>
                    ) : (
                      <>
                        <span>🔬</span>
                        Run What-If Analysis
                      </>
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
                      <span>📊</span>
                      Analysis Results
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: spacing.md,
                      marginBottom: spacing.lg,
                    }}>
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
                          Total Trades
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: colors.textPrimary,
                          fontFamily: fontFamily.mono,
                        }}>
                          {whatIfResults.total_trades || 0}
                        </div>
                      </div>

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
                          Win Rate
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: (whatIfResults.win_rate || 0) >= 0.5 ? colors.success : colors.warning,
                          fontFamily: fontFamily.mono,
                        }}>
                          {((whatIfResults.win_rate || 0) * 100).toFixed(1)}%
                        </div>
                      </div>

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
                          Total P&L %
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: (whatIfResults.total_pnl_pct || 0) >= 0 ? colors.success : colors.error,
                          fontFamily: fontFamily.mono,
                        }}>
                          {((whatIfResults.total_pnl_pct || 0) * 100).toFixed(2)}%
                        </div>
                      </div>

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
                          Profit Factor
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: (whatIfResults.profit_factor || 0) >= 1 ? colors.success : colors.warning,
                          fontFamily: fontFamily.mono,
                        }}>
                          {(whatIfResults.profit_factor || 0).toFixed(2)}
                        </div>
                      </div>

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
                          Max Drawdown
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: colors.error,
                          fontFamily: fontFamily.mono,
                        }}>
                          {((whatIfResults.max_drawdown_pct || 0) * 100).toFixed(2)}%
                        </div>
                      </div>

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
                          Avg Hold (min)
                        </div>
                        <div style={{
                          fontSize: fontSize.xl,
                          fontWeight: fontWeight.bold,
                          color: colors.textPrimary,
                          fontFamily: fontFamily.mono,
                        }}>
                          {(whatIfResults.avg_hold_minutes || 0).toFixed(0)}
                        </div>
                      </div>
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
                      <span style={{ color: colors.textMuted }}>|</span>
                      <span style={{ color: colors.textSecondary }}>
                        Avg P&L: {((whatIfResults.avg_pnl_pct || 0) * 100).toFixed(3)}%
                      </span>
                    </div>

                    {/* Decision Stats */}
                    <div style={{
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                      textAlign: 'center',
                    }}>
                      Analyzed {whatIfResults.total_decisions || 0} historical decisions
                      {whatIfResults.filtered_decisions > 0 && whatIfResults.filtered_decisions !== whatIfResults.total_decisions && (
                        <> ({whatIfResults.filtered_decisions} passed filters, {whatIfResults.simulated_trades} simulated)</>
                      )}
                    </div>

                    {/* Save to Custom Settings Button (only show if there are trades) */}
                    {whatIfResults.total_trades > 0 && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: spacing.lg,
                        paddingTop: spacing.lg,
                        borderTop: `1px solid ${colors.border}`,
                      }}>
                        <button
                          onClick={handleSaveToCustomSettings}
                          disabled={savingToCustom}
                          style={{
                            padding: '12px 32px',
                            borderRadius: borderRadius.md,
                            border: 'none',
                            background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                            color: '#fff',
                            fontSize: fontSize.base,
                            fontWeight: fontWeight.bold,
                            fontFamily: fontFamily.sans,
                            cursor: savingToCustom ? 'wait' : 'pointer',
                            opacity: savingToCustom ? 0.7 : 1,
                            transition: `all ${transitions.fast}`,
                            boxShadow: shadows.md,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.sm,
                          }}
                        >
                          {savingToCustom ? (
                            <>
                              <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span>⚙️</span>
                              Save to Custom Settings
                            </>
                          )}
                        </button>
                        <p style={{
                          fontSize: fontSize.xs,
                          color: colors.textMuted,
                          margin: `${spacing.sm} 0 0`,
                          textAlign: 'center',
                        }}>
                          Use these what-if parameters for trading (custom mode)
                        </p>
                      </div>
                    )}

                    {/* Zero Trades Diagnostic (show if no trades) */}
                    {whatIfResults.total_trades === 0 && whatIfResults.filter_stats && (
                      <div style={{
                        marginTop: spacing.md,
                        padding: spacing.md,
                        background: colors.warningDark,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.warning}30`,
                      }}>
                        {/* Blocking Filter Message - prominently displayed */}
                        {whatIfResults.blocking_filter_message ? (
                          <>
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
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              background: `${colors.warning}15`,
                              borderRadius: borderRadius.sm,
                              borderLeft: `3px solid ${colors.warning}`,
                            }}>
                              {whatIfResults.blocking_filter_message}
                            </div>
                            {/* Filter Funnel - show progression */}
                            {whatIfResults.funnel && (
                              <div style={{
                                fontSize: fontSize.xs,
                                color: colors.textMuted,
                                fontFamily: fontFamily.mono,
                              }}>
                                <div style={{ marginBottom: spacing.xs, color: colors.textSecondary }}>Filter funnel:</div>
                                <div>Total decisions: {whatIfResults.funnel.total_decisions}</div>
                                <div style={{ color: whatIfResults.funnel.after_buy_sell_filter > 0 ? colors.textSecondary : colors.error }}>
                                  → BUY/SELL only: {whatIfResults.funnel.after_buy_sell_filter}
                                </div>
                                <div style={{ color: whatIfResults.funnel.after_confidence_filter > 0 ? colors.textSecondary : colors.error }}>
                                  → After confidence: {whatIfResults.funnel.after_confidence_filter}
                                </div>
                                <div style={{ color: whatIfResults.funnel.after_win_prob_filter > 0 ? colors.textSecondary : colors.error }}>
                                  → After win prob: {whatIfResults.funnel.after_win_prob_filter}
                                </div>
                                <div style={{ color: whatIfResults.funnel.after_mq_filter > 0 ? colors.textSecondary : colors.error }}>
                                  → After MQ filter: {whatIfResults.funnel.after_mq_filter}
                                </div>
                                <div style={{ color: whatIfResults.funnel.after_price_filter > 0 ? colors.textSecondary : colors.error }}>
                                  → After price filter: {whatIfResults.funnel.after_price_filter}
                                </div>
                                <div style={{ color: whatIfResults.funnel.final_passed > 0 ? colors.success : colors.error }}>
                                  → Final passed: {whatIfResults.funnel.final_passed}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Fallback to old display if blocking_filter_message not available */
                          <>
                            <div style={{
                              fontSize: fontSize.sm,
                              color: colors.warning,
                              marginBottom: spacing.sm,
                              fontWeight: fontWeight.semibold,
                            }}>
                              Why no trades? Filter breakdown:
                            </div>
                            <div style={{
                              fontSize: fontSize.xs,
                              color: colors.textSecondary,
                              fontFamily: fontFamily.mono,
                            }}>
                              {whatIfResults.filter_stats.not_buy_sell > 0 && (
                                <div>Not BUY/SELL: {whatIfResults.filter_stats.not_buy_sell}</div>
                              )}
                              {whatIfResults.filter_stats.low_confidence > 0 && (
                                <div>Low confidence: {whatIfResults.filter_stats.low_confidence}</div>
                              )}
                              {whatIfResults.filter_stats.mq_failed > 0 && (
                                <div>MQ failed: {whatIfResults.filter_stats.mq_failed}</div>
                              )}
                              {whatIfResults.filter_stats.no_price > 0 && (
                                <div>No price: {whatIfResults.filter_stats.no_price}</div>
                              )}
                              {whatIfResults.filter_stats.decision_values && (
                                <div style={{ marginTop: spacing.xs }}>
                                  Decision types: {JSON.stringify(whatIfResults.filter_stats.decision_values)}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Parameter Finder Section */}
          <div className="optimize-card" style={{
            ...cardStyle,
            marginTop: spacing.xl,
          }}>
            <div
              onClick={() => setParamFinderExpanded(!paramFinderExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: paramFinderExpanded ? spacing.lg : 0,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <h2 style={typography.h2}>Parameter Finder</h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: borderRadius.full,
                  background: colors.successDark,
                  color: colors.success,
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                }}>
                  Auto-Optimize
                </span>
              </div>
              <span style={{
                fontSize: fontSize.lg,
                color: colors.textMuted,
                transform: paramFinderExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform ${transitions.fast}`,
              }}>
                ▼
              </span>
            </div>

            {paramFinderExpanded && (
              <>
                <p style={{
                  ...typography.bodySmall,
                  marginBottom: spacing.lg,
                }}>
                  Automatically find the <strong>best parameters</strong> using grid search optimization.
                  Unlike "What-If" analysis where you manually test specific values, this tool explores
                  all combinations to find the optimal configuration.
                </p>

                {/* Run Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <button
                    onClick={handleParamFinderRun}
                    disabled={paramFinderRunning}
                    style={{
                      padding: '12px 32px',
                      borderRadius: borderRadius.md,
                      border: 'none',
                      background: paramFinderRunning ? colors.bgTertiary : `linear-gradient(135deg, ${colors.success}, #2d8f40)`,
                      color: paramFinderRunning ? colors.textMuted : colors.bgPrimary,
                      fontSize: fontSize.base,
                      fontWeight: fontWeight.bold,
                      fontFamily: fontFamily.sans,
                      cursor: paramFinderRunning ? 'wait' : 'pointer',
                      transition: `all ${transitions.fast}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      boxShadow: paramFinderRunning ? 'none' : shadows.md,
                    }}
                  >
                    {paramFinderRunning ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        Searching {days}D data...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Find Optimal Parameters ({days}D)
                      </>
                    )}
                  </button>
                </div>

                {/* Results */}
                {paramFinderResults && (
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
                        <span>✨</span>
                        Optimal Parameters Found
                      </h3>
                      <span style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        fontFamily: fontFamily.mono,
                      }}>
                        {paramFinderResults.total_combinations} combos tested in {paramFinderResults.computation_time_sec}s
                      </span>
                    </div>

                    {/* Score */}
                    <div style={{
                      textAlign: 'center',
                      padding: spacing.md,
                      marginBottom: spacing.lg,
                      background: colors.bgSecondary,
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.border}`,
                    }}>
                      <div style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        marginBottom: spacing.xs,
                      }}>
                        Composite Score
                      </div>
                      <div style={{
                        fontSize: '32px',
                        fontWeight: fontWeight.bold,
                        color: paramFinderResults.best_score > 0 ? colors.success : colors.error,
                        fontFamily: fontFamily.mono,
                      }}>
                        {paramFinderResults.best_score?.toFixed(4) || 'N/A'}
                      </div>
                      <div style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        marginTop: spacing.xs,
                      }}>
                        (return × win_rate × profit_factor) / drawdown
                      </div>
                    </div>

                    {/* Best Parameters */}
                    {paramFinderResults.best_params && Object.keys(paramFinderResults.best_params).length > 0 && (
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
                          {Object.entries(paramFinderResults.best_params).map(([key, value]) => {
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

                    {/* Metrics */}
                    {paramFinderResults.best_metrics && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: spacing.md,
                        marginBottom: spacing.lg,
                      }}>
                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Total Trades
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: colors.textPrimary,
                            fontFamily: fontFamily.mono,
                          }}>
                            {paramFinderResults.best_metrics.total_trades || 0}
                          </div>
                        </div>

                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Win Rate
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: (paramFinderResults.best_metrics.win_rate || 0) >= 0.5 ? colors.success : colors.warning,
                            fontFamily: fontFamily.mono,
                          }}>
                            {((paramFinderResults.best_metrics.win_rate || 0) * 100).toFixed(1)}%
                          </div>
                        </div>

                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Total Return
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: (paramFinderResults.best_metrics.total_return_pct || 0) >= 0 ? colors.success : colors.error,
                            fontFamily: fontFamily.mono,
                          }}>
                            {(paramFinderResults.best_metrics.total_return_pct || 0).toFixed(2)}%
                          </div>
                        </div>

                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Profit Factor
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: (paramFinderResults.best_metrics.profit_factor || 0) >= 1 ? colors.success : colors.warning,
                            fontFamily: fontFamily.mono,
                          }}>
                            {(paramFinderResults.best_metrics.profit_factor || 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Max Drawdown
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: colors.error,
                            fontFamily: fontFamily.mono,
                          }}>
                            {(paramFinderResults.best_metrics.max_drawdown_pct || 0).toFixed(2)}%
                          </div>
                        </div>

                        <div className="metric-card" style={{
                          padding: spacing.md,
                          background: colors.bgSecondary,
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.xs }}>
                            Ending Equity
                          </div>
                          <div style={{
                            fontSize: fontSize.xl,
                            fontWeight: fontWeight.bold,
                            color: colors.textPrimary,
                            fontFamily: fontFamily.mono,
                          }}>
                            ${(paramFinderResults.best_metrics.ending_equity || 10000).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Save Buttons */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.md,
                      alignItems: 'center',
                    }}>
                      {/* Primary: Save to Flux Settings */}
                      <button
                        onClick={handleSaveToFluxSettings}
                        disabled={savingToFlux || !paramFinderResults.best_params || Object.keys(paramFinderResults.best_params).length === 0}
                        className="apply-btn"
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
                        {savingToFlux ? (
                          <>
                            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                            Saving...
                          </>
                        ) : (
                          <>
                            <span>💎</span>
                            Save to Flux Settings
                          </>
                        )}
                      </button>
                      <p style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        margin: 0,
                        textAlign: 'center',
                      }}>
                        Sets these as your default optimized trading parameters
                      </p>

                      {/* Secondary: Apply Now (to Custom) */}
                      <button
                        onClick={handleApplyOptimalParams}
                        disabled={applying || !paramFinderResults.best_params || Object.keys(paramFinderResults.best_params).length === 0}
                        style={{
                          padding: '10px 24px',
                          borderRadius: borderRadius.md,
                          border: `1px solid ${colors.border}`,
                          background: 'transparent',
                          color: colors.textSecondary,
                          fontSize: fontSize.sm,
                          fontWeight: fontWeight.medium,
                          fontFamily: fontFamily.sans,
                          cursor: applying ? 'wait' : 'pointer',
                          opacity: applying ? 0.7 : 1,
                          transition: `all ${transitions.fast}`,
                        }}
                      >
                        {applying ? 'Applying...' : 'Apply to Custom Settings'}
                      </button>
                    </div>

                    {/* Top Results Table */}
                    {paramFinderResults.top_results && paramFinderResults.top_results.length > 1 && (
                      <div style={{ marginTop: spacing.lg }}>
                        <h4 style={{
                          fontSize: fontSize.sm,
                          color: colors.textSecondary,
                          fontWeight: fontWeight.semibold,
                          marginBottom: spacing.sm,
                        }}>
                          Top 5 Configurations:
                        </h4>
                        <div style={{
                          overflowX: 'auto',
                          fontSize: fontSize.xs,
                          fontFamily: fontFamily.mono,
                        }}>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                          }}>
                            <thead>
                              <tr style={{
                                background: colors.bgSecondary,
                                color: colors.textMuted,
                              }}>
                                <th style={{ padding: spacing.sm, textAlign: 'left' }}>#</th>
                                <th style={{ padding: spacing.sm, textAlign: 'right' }}>Score</th>
                                <th style={{ padding: spacing.sm, textAlign: 'right' }}>Trades</th>
                                <th style={{ padding: spacing.sm, textAlign: 'right' }}>Win%</th>
                                <th style={{ padding: spacing.sm, textAlign: 'right' }}>Return%</th>
                                <th style={{ padding: spacing.sm, textAlign: 'right' }}>PF</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paramFinderResults.top_results.slice(0, 5).map((result, idx) => (
                                <tr key={idx} style={{
                                  borderBottom: `1px solid ${colors.border}`,
                                  background: idx === 0 ? colors.accentDark : 'transparent',
                                }}>
                                  <td style={{ padding: spacing.sm, color: idx === 0 ? colors.accent : colors.textSecondary }}>
                                    {idx === 0 ? '★' : idx + 1}
                                  </td>
                                  <td style={{ padding: spacing.sm, textAlign: 'right', color: colors.textPrimary }}>
                                    {result.score?.toFixed(4) || '-'}
                                  </td>
                                  <td style={{ padding: spacing.sm, textAlign: 'right', color: colors.textSecondary }}>
                                    {result.metrics?.total_trades || '-'}
                                  </td>
                                  <td style={{ padding: spacing.sm, textAlign: 'right', color: (result.metrics?.win_rate || 0) >= 0.5 ? colors.success : colors.warning }}>
                                    {((result.metrics?.win_rate || 0) * 100).toFixed(1)}%
                                  </td>
                                  <td style={{ padding: spacing.sm, textAlign: 'right', color: (result.metrics?.total_return_pct || 0) >= 0 ? colors.success : colors.error }}>
                                    {(result.metrics?.total_return_pct || 0).toFixed(2)}%
                                  </td>
                                  <td style={{ padding: spacing.sm, textAlign: 'right', color: colors.textSecondary }}>
                                    {(result.metrics?.profit_factor || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Info about scoring */}
                    <div style={{
                      marginTop: spacing.md,
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                      textAlign: 'center',
                    }}>
                      Scoring formula: (return × win_rate × min(profit_factor, 5)) / max(drawdown, 1%)
                    </div>
                  </div>
                )}

                {/* No results message */}
                {!paramFinderResults && !paramFinderRunning && (
                  <div style={{
                    textAlign: 'center',
                    padding: spacing.lg,
                    color: colors.textMuted,
                    background: colors.bgSecondary,
                    borderRadius: borderRadius.md,
                  }}>
                    <p style={{ margin: 0 }}>
                      Click the button above to search for optimal parameters across {days} days of historical data.
                    </p>
                    <p style={{ margin: `${spacing.sm} 0 0`, fontSize: fontSize.xs }}>
                      This tests hundreds of parameter combinations and returns the best performing configuration.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: spacing.lg,
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => e.target === e.currentTarget && !applying && setShowConfirm(false)}
        >
          <div style={{
            ...cardStyle,
            maxWidth: 480,
            width: '100%',
            animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}>
              <span style={{ fontSize: '24px' }} aria-hidden="true">⚡</span>
              <h2 id="modal-title" style={typography.h2}>Confirm Changes</h2>
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
                  const settingMeta = getSettingMeta();
                  const meta = settingMeta[s.setting_name] || { name: s.setting_name, unit: '', format: null };
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
                        <span style={{ color: colors.textMuted }}>
                          {meta.format ? meta.format(s.current_value) : s.current_value}
                        </span>
                        {' → '}
                        <span style={{ color: colors.accent, fontWeight: fontWeight.bold }}>
                          {meta.format ? meta.format(s.suggested_value) : `${s.suggested_value}${meta.unit}`}
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
                aria-label="Cancel and close dialog"
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
                aria-label={applying ? 'Applying changes' : 'Confirm and apply settings'}
                aria-busy={applying}
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
function MetricRow({ label, value, color, delta, subtitle }) {
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
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontFamily: fontFamily.mono,
            fontSize: fontSize.md,
            fontWeight: fontWeight.bold,
            color: color,
            display: 'block',
          }}>
            {value}
          </span>
          {subtitle && (
            <span style={{
              fontSize: fontSize.xs,
              color: colors.textMuted,
            }}>
              {subtitle}
            </span>
          )}
        </div>
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
