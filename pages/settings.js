// pages/settings.js - Dark Luxe Settings UI (Redesigned 2026-03-31)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PresetSelector from '../components/PresetSelector';
import GuardrailHint from '../components/GuardrailHint';
import {
  fetchUserSettings, saveUserSettings, fetchPresets, applyPreset, fetchGuardrails,
  fetchFluxSettings,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  darkTheme,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
  fontSize,
  fontWeight,
  fontFamily,
  transitions,
  shadows,
  visualEffects,
} from '../lib/theme';

const DEFAULT_GUARDRAILS = {
  max_open_positions: { min: 1, max: 10, default: 3, recommended: 3 },
  max_hold_min: { min: 15, max: 390, default: 60, recommended: 60 },
  risk_per_trade_pct: { min: 0.001, max: 0.02, default: 0.002, recommended: 0.002 },
  stop_loss_pct: { min: 0.002, max: 0.05, default: 0.008, recommended: 0.008 },
  take_profit_pct: { min: 0.005, max: 0.10, default: 0.015, recommended: 0.015 },
  htf_min_alignment_score: { min: 0, max: 2, default: 0 },
  htf_confidence_boost: { min: 0, max: 0.15, default: 0.05 },
  htf_confidence_penalty: { min: 0, max: 0.20, default: 0.10 },
  fbs_lookback_candles: { min: 10, max: 60, default: 30 },
  fbs_max_overrun_pct: { min: 0.001, max: 0.02, default: 0.005 },
  fbs_entry_timeout_min: { min: 5, max: 60, default: 20 },
  fbs_min_confidence: { min: 0.40, max: 0.90, default: 0.60 },
  odf_min_gap_pct: { min: 0.001, max: 0.03, default: 0.005 },
  odf_min_drive_candles: { min: 1, max: 10, default: 3 },
  odf_reversal_wick_pct: { min: 0.30, max: 0.90, default: 0.50 },
  odf_min_confidence: { min: 0.35, max: 0.85, default: 0.55 },
};

const DEFAULT_SETTINGS = {
  mode: 'paper',
  kill_switch: 'off',
  // Backend stores times in PT (08:30 PT = 11:30 EST, 10:30 PT = 13:30 EST).
  // Frontend displays and sends times in EST — same moment, different timezone label.
  trading_window_start: '11:30',
  trading_window_end: '13:30',
  entry_blacklist_minutes: 5,
  day_type_enabled: true,
  chop_day_conf_threshold: 0.75,
  llm_conf_threshold: 0.55,
  llm_mom_entry_pct: 0.002,
  llm_mom_lookback: 8,
  ema_slope_enabled: true,
  ema_slope_penalty: 0.10,
  relative_strength_enabled: true,
  relative_strength_boost: 0.05,
  entry_quality_enabled: true,
  min_volume_ratio: 1.2,
  opening_range_enabled: true,
  htf_enabled: true,
  htf_require_alignment: true,
  htf_min_alignment_score: 0,
  htf_confidence_boost: 0.05,
  htf_confidence_penalty: 0.10,
  stop_loss_pct: 0.008,
  take_profit_pct: 0.015,
  risk_per_trade_pct: 0.002,
  max_hold_min: 60,
  trades_per_ticker_per_day: 1,
  max_open_positions: 3,
  mq_velocity_enabled: true,
  mq_velocity_multiplier: 3.5,
  trailing_stop_enabled: true,
  trailing_stop_activation: 0.40,
  trailing_stop_distance: 0.50,
  fbs_enabled: true,
  fbs_lookback_candles: 30,
  fbs_max_overrun_pct: 0.005,
  fbs_entry_timeout_min: 20,
  fbs_min_confidence: 0.60,
  fbs_shadow_mode: false,
  odf_enabled: true,
  odf_min_gap_pct: 0.005,
  odf_min_drive_candles: 3,
  odf_reversal_wick_pct: 0.50,
  odf_min_confidence: 0.55,
  odf_shadow_mode: false,
};

const SETTING_EXPLANATIONS = {
  mode: {
    title: 'Trading Mode',
    description: 'Controls whether trades use real money or are simulated.',
    details: 'Paper mode simulates trades without risking real capital — perfect for testing strategies. Live mode executes real trades through your connected broker account.',
    tip: 'Always test new strategies in Paper mode first.',
  },
  execute_trades: {
    title: 'Execute Trades',
    description: 'Controls whether the bot can place new trades.',
    details: 'When enabled, the bot will actively look for and execute trade opportunities. When disabled, the bot will not enter any new positions. Existing positions are NOT automatically closed.',
    tip: 'Disable this to pause trading without closing existing positions.',
  },
  trading_window: {
    title: 'Trading Window',
    description: 'The hours during which the bot is allowed to trade.',
    details: 'Trades will only be placed during this time window (EST). Market hours are 9:30 AM – 4:00 PM EST.',
    tip: 'The first and last 30 minutes of the session tend to be most volatile.',
  },
  entry_blacklist_minutes: {
    title: 'Entry Blacklist',
    description: 'Minutes to skip at the start of the trading window.',
    details: 'Creates a brief cooldown period after the window opens. The market open is often chaotic with wide spreads and erratic price action.',
    lowImpact: '0 minutes: Trade immediately when window opens. More exposure to open volatility.',
    highImpact: '10-15 minutes: Wait for market to stabilize. May miss early momentum.',
    tip: '5 minutes is a good default to avoid the initial market open chaos.',
  },
  conf_threshold: {
    title: 'Confidence Threshold',
    description: 'Minimum AI confidence score required to enter a trade.',
    details: 'The AI assigns a confidence score (0–100%) to each potential trade. Only trades above this threshold are executed. Higher = fewer but more confident trades.',
    lowImpact: 'Lower values (50–55%): More trades, but potentially lower quality signals.',
    highImpact: 'Higher values (70–80%): Fewer trades, but higher conviction entries.',
    tip: 'Start conservative (65%+) and adjust based on your results.',
  },
  mom_entry_pct: {
    title: 'Momentum Entry',
    description: 'Minimum price momentum required to trigger entry.',
    details: 'Measures how much price has moved over the lookback period. A 0.2% threshold means price must have moved at least 0.2% before considering entry.',
    lowImpact: 'Lower values (0.1%): Enters on smaller moves, more frequent trades.',
    highImpact: 'Higher values (0.5%+): Waits for stronger moves, fewer trades.',
    tip: 'Higher momentum requirements can filter out choppy, directionless moves.',
  },
  mom_lookback: {
    title: 'Momentum Lookback',
    description: 'Number of 1-minute bars used to calculate momentum.',
    details: 'Determines how far back to look when measuring price momentum. Shorter lookbacks react faster to price changes.',
    lowImpact: 'Shorter (3–5 bars): More responsive, catches quick moves but more noise.',
    highImpact: 'Longer (12–20 bars): Smoother signal, filters noise but slower to react.',
    tip: '8–10 bars is a good balance for intraday momentum.',
  },
  stop_loss_pct: {
    title: 'Stop Loss',
    description: 'Maximum loss allowed before automatically exiting.',
    details: 'If your position drops by this percentage from entry, it will be automatically closed to limit losses. This is your primary risk control.',
    lowImpact: 'Tighter stops (0.5%): Less risk per trade but more likely to get stopped out on normal volatility.',
    highImpact: 'Wider stops (2–3%): Gives trades more room but larger potential losses.',
    tip: 'Your stop should be wider than typical market noise for the symbols you trade.',
  },
  take_profit_pct: {
    title: 'Take Profit',
    description: 'Target gain at which to automatically exit.',
    details: 'When your position gains this percentage, it will be automatically closed to lock in profits. Ensures you capture gains instead of giving them back.',
    lowImpact: 'Lower targets (0.5–1%): More frequent wins but smaller gains.',
    highImpact: 'Higher targets (3–5%): Bigger wins but may not reach target as often.',
    tip: 'Your take profit should be at least 1.5–2x your stop loss for positive expectancy.',
  },
  risk_per_trade_pct: {
    title: 'Risk Per Trade',
    description: 'Maximum account percentage risked on each trade.',
    details: "Controls position sizing. If you risk 0.5% per trade with a 1% stop loss, you'll use about 50% of your capital per position.",
    lowImpact: 'Lower risk (0.1–0.3%): Very conservative, survives long losing streaks.',
    highImpact: 'Higher risk (0.5–1%): Faster growth potential but larger drawdowns.',
    tip: 'Professional traders typically risk 0.5–2% per trade maximum.',
  },
  max_hold_min: {
    title: 'Max Hold Time',
    description: 'Maximum duration before forcing an exit.',
    details: 'Positions held longer than this will be automatically closed. Prevents trades from being held overnight or through extended drawdowns.',
    lowImpact: 'Shorter (60 min): More aggressive, forces quicker exits.',
    highImpact: 'Longer (2–4 hours): More room for trades to develop, but ties up capital longer.',
    tip: 'For intraday trading, 60–120 minutes is a reasonable balance.',
  },
  trades_per_ticker_per_day: {
    title: 'Trades Per Symbol',
    description: 'Maximum trades allowed per ticker each day.',
    details: 'Limits how many times the bot can enter the same symbol in one day. Prevents overtrading a single stock and revenge trading after losses.',
    lowImpact: '1 trade: Most conservative, one shot per day per symbol.',
    highImpact: '3 trades: Allows re-entry if conditions change throughout the day.',
    tip: 'Start with 1–2 to prevent overtrading the same name.',
  },
  max_open_positions: {
    title: 'Max Open Positions',
    description: 'Maximum concurrent positions at any time.',
    details: 'Limits how many positions can be open simultaneously. Prevents taking on too much risk if multiple signals trigger at once.',
    lowImpact: 'Fewer (1–2): Very conservative, may miss good setups if already in a position.',
    highImpact: 'More (5–10): Can take multiple setups simultaneously, but increases total exposure.',
    tip: 'Start with 3 positions max to balance opportunity capture with risk management.',
  },
  mq_velocity_enabled: {
    title: 'Quick Reversal Protection',
    description: 'Exit early if the price suddenly moves against you.',
    details: "Detects abnormally fast moves against your position and exits before hitting your full stop-loss. Useful for flash crashes and sudden reversals.",
    lowImpact: 'OFF: Only uses regular stop-loss. May hold through sudden drops.',
    highImpact: 'ON: Exits early on unusually fast adverse moves.',
    tip: 'Recommended ON. Protects you from flash crashes and sudden reversals.',
  },
  trailing_stop_enabled: {
    title: 'Trailing Stop',
    description: 'Lock in gains by moving your stop-loss up as price rises.',
    details: 'When a trade reaches the activation point, a trailing stop is set at your entry (break-even), so a reversal exits without a loss.',
    lowImpact: 'OFF: Uses fixed stop-loss only. May give back unrealized gains.',
    highImpact: 'ON: Protects gains by activating a trailing stop once trade is profitable.',
    tip: 'Recommended ON. Helps preserve capital on trades that turn around.',
  },
  trailing_stop_activation: {
    title: 'Trailing Stop Activation',
    description: 'When to activate the trailing stop (% of take-profit reached).',
    details: 'At 70%, if your take-profit is 2%, the trailing stop activates when you hit +1.4% gain.',
    lowImpact: 'Lower (30–50%): Activates earlier, protects smaller gains.',
    highImpact: 'Higher (80–95%): Only activates near take-profit, lets trade run longer.',
    tip: '70% is a good balance — gives the trade room to develop.',
  },
  trailing_stop_distance: {
    title: 'Trailing Stop Distance',
    description: 'How much profit to give back before exiting (1.0 = break-even).',
    details: '1.0 = stop at entry price (break-even). 0.5 = lock in 50% of peak gain. 0.0 = tightest trail.',
    lowImpact: 'Lower (0.0–0.5): Locks in more profit but may exit too early.',
    highImpact: 'Higher (1.0): Break-even stop only. Maximum room for trade to work.',
    tip: 'Start with 1.0 (break-even). Tighten only if you want to lock in partial gains.',
  },
  htf_enabled: {
    title: 'Higher Timeframe Analysis',
    description: 'Validate entry direction using 15-minute chart trends.',
    details: 'Checks the 15-minute EMA and trend direction before entering trades. Helps avoid trading against the larger trend, improving win rate on trend-following setups.',
    tip: 'Enable to reduce counter-trend trades. Reduces trade frequency but improves quality.',
  },
  fbs_enabled: {
    title: 'Failed Breakout Short',
    description: 'Short stocks that fail to break above resistance.',
    details: 'When a stock makes a breakout attempt above a key level but fails to hold, it often reverses sharply. FBS enters short on these reversals.',
    tip: 'Shadow mode lets you see what FBS would have traded without risking capital.',
  },
  odf_enabled: {
    title: 'Opening Drive Fade',
    description: 'Fade the initial opening drive when it looks exhausted.',
    details: 'Stocks that gap up or down at open often drive aggressively, then reverse. ODF identifies exhausted drives using gap size, drive candles, and reversal wicks.',
    tip: 'Works best on gap-and-go setups that overextend in the first 15–30 minutes.',
  },
};

const AVAILABLE_TICKERS = {
  tech: { label: 'Tech', tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AMD', 'CRM'] },
  etfs: { label: 'ETFs', tickers: ['SPY', 'QQQ', 'IWM'] },
  finance: { label: 'Finance', tickers: ['JPM', 'BAC'] },
  energy: { label: 'Energy', tickers: ['XOM', 'CVX'] },
  consumer: { label: 'Consumer', tickers: ['WMT', 'HD'] },
  healthcare: { label: 'Healthcare', tickers: ['UNH', 'JNJ'] },
};

const TAB_KEYS = {
  quicksetup: ['mode', 'kill_switch', 'symbols'],
  schedule: ['trading_window_start', 'trading_window_end', 'entry_blacklist_minutes', 'day_type_enabled', 'chop_day_conf_threshold'],
  entry: ['llm_conf_threshold', 'llm_mom_entry_pct', 'llm_mom_lookback', 'ema_slope_enabled', 'ema_slope_penalty', 'relative_strength_enabled', 'relative_strength_boost', 'entry_quality_enabled', 'min_volume_ratio', 'opening_range_enabled', 'htf_enabled', 'htf_require_alignment', 'htf_min_alignment_score', 'htf_confidence_boost', 'htf_confidence_penalty'],
  risk: ['stop_loss_pct', 'take_profit_pct', 'risk_per_trade_pct', 'max_hold_min', 'trades_per_ticker_per_day', 'max_open_positions', 'mq_velocity_enabled', 'mq_velocity_multiplier', 'trailing_stop_enabled', 'trailing_stop_activation', 'trailing_stop_distance'],
  intelligence: ['fbs_enabled', 'fbs_lookback_candles', 'fbs_max_overrun_pct', 'fbs_entry_timeout_min', 'fbs_min_confidence', 'fbs_shadow_mode', 'odf_enabled', 'odf_min_gap_pct', 'odf_min_drive_candles', 'odf_reversal_wick_pct', 'odf_min_confidence', 'odf_shadow_mode'],
  advanced: [],
};

function tabHasNonDefault(tabId, settings) {
  if (!settings) return false;
  return (TAB_KEYS[tabId] || []).some(key => {
    const val = settings[key];
    const def = DEFAULT_SETTINGS[key];
    if (val === undefined || val === null) return false;
    if (typeof def === 'number' && typeof val === 'number') return Math.abs(val - def) > 0.0001;
    return val !== def;
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const colors = darkTheme;

  const [settings, setSettings] = useState(null);
  const [savedSettings, setSavedSettings] = useState(null);
  const [presets, setPresets] = useState([]);
  const [guardrails, setGuardrails] = useState(DEFAULT_GUARDRAILS);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('quicksetup');
  const [toasts, setToasts] = useState([]);
  const [errors, setErrors] = useState({});
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [fluxSource, setFluxSource] = useState(null);
  const [fluxBacktestDays, setFluxBacktestDays] = useState(null);
  const [fluxBacktestDate, setFluxBacktestDate] = useState(null);
  const [symbolSearch, setSymbolSearch] = useState('');

  const isAdmin = true;

  const hasUnsavedChanges = !!(savedSettings && settings && JSON.stringify(settings) !== JSON.stringify(savedSettings));

  const TABS = [
    {
      id: 'quicksetup', label: 'Quick Setup',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    },
    {
      id: 'schedule', label: 'Schedule',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
    {
      id: 'entry', label: 'Entry',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    },
    {
      id: 'risk', label: 'Risk',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
    {
      id: 'intelligence', label: 'Intelligence',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.14z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.14z"/></svg>,
    },
    {
      id: 'advanced', label: 'Advanced',
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    },
  ];

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoadError(null);
      try {
        const [settingsRes, presetsRes, guardrailsRes, fluxRes] = await Promise.all([
          fetchUserSettings(),
          fetchPresets(),
          fetchGuardrails().catch(() => ({ ok: true, guardrails: DEFAULT_GUARDRAILS })),
          fetchFluxSettings().catch(() => ({ ok: false })),
        ]);

        if (fluxRes.ok) {
          setFluxSource(fluxRes.source || 'system');
          if (fluxRes.settings) {
            setFluxBacktestDays(fluxRes.settings.backtest_days || null);
            setFluxBacktestDate(fluxRes.settings.backtest_ran_at || null);
          }
        }

        if (settingsRes.ok && settingsRes.settings) {
          setSettings(settingsRes.settings);
          setSavedSettings(settingsRes.settings);
        } else if (settingsRes.settings) {
          setSettings(settingsRes.settings);
          setSavedSettings(settingsRes.settings);
        } else if (settingsRes.error === 'no_settings') {
          router.push('/onboarding');
          return;
        } else {
          setLoadError(settingsRes.error || 'Failed to load settings');
        }

        if (presetsRes.ok && presetsRes.presets) setPresets(presetsRes.presets);
        if (guardrailsRes.ok && guardrailsRes.guardrails) setGuardrails(guardrailsRes.guardrails);
      } catch (e) {
        const msg = String(e?.message || e);
        setLoadError(msg);
        addToast(msg, 'error');
      }
    }
    load();
  }, [user]);

  const get = (path, fallback) => {
    if (!settings) return fallback;
    const parts = path.split('.');
    let val = settings;
    for (const p of parts) val = val?.[p];
    return val ?? fallback;
  };

  const set = (path, value) => {
    setErrors(e => ({ ...e, [path]: null }));
    setSettings(s => {
      const parts = path.split('.');
      const next = { ...s, preset_id: null };
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = { ...cur[parts[i]] };
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const validate = (path, value, field) => {
    const guard = guardrails[field];
    if (!guard) return true;
    if (value < guard.min || value > guard.max) {
      setErrors(e => ({ ...e, [path]: `Must be between ${guard.min} and ${guard.max}` }));
      return false;
    }
    return true;
  };

  const handlePresetSelect = async (presetId) => {
    if (presetId === null) { setSettings(s => ({ ...s, preset_id: null })); return; }
    setSaving(true);
    try {
      const res = await applyPreset(presetId);
      if (res.ok && res.settings) {
        setSettings(res.settings);
        addToast(`Applied ${presetId} preset`, 'success');
      } else {
        addToast(res.error || 'Failed to apply preset', 'error');
      }
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (Object.values(errors).some(e => e)) { addToast('Please fix validation errors', 'error'); return; }
    setSaving(true);
    try {
      const res = await saveUserSettings(settings);
      if (res.ok || res.settings) {
        const saved = res.settings ?? settings;
        setSettings(saved);
        setSavedSettings(saved);
        addToast('Settings saved successfully', 'success');
      } else {
        addToast(res.error || 'Failed to save settings', 'error');
      }
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onDiscard = () => {
    setSettings(savedSettings);
    setErrors({});
  };

  const currentPreset = presets.find(p => p.id === settings?.preset_id);
  const isPresetMode = settings?.preset_id !== null && settings?.preset_id !== undefined;

  if (authLoading || (!settings && !loadError)) {
    return (
      <Layout active="settings">
        <div style={{ color: darkTheme.textMuted, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${darkTheme.border}`, borderTopColor: darkTheme.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Loading settings...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout active="settings">
        <div style={{ ...cardStyle, background: darkTheme.errorDark || '#1a0a0a', borderColor: darkTheme.error, color: darkTheme.error }}>
          <strong>Error loading settings:</strong> {loadError}
          <br /><br />
          <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: darkTheme.error, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="settings">
      <style>{`
        @keyframes settingsSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes settingsFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .settings-tab-bar {
          display: flex;
          gap: 4;
          flex-wrap: nowrap;
          overflow-x: auto;
        }
        @media (max-width: 600px) {
          .settings-tab-bar {
            flex-wrap: wrap;
            overflow-x: visible;
          }
        }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A574;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #D4A574;
          cursor: pointer;
          border: 2px solid #0D1117;
        }
        input:focus, select:focus {
          outline: 2px solid #D4A574;
          outline-offset: 1px;
        }
        input[type="range"]:focus {
          outline: none;
        }
      `}</style>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} colors={colors} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: colors.accentDark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: colors.textPrimary }}>Settings</h1>
            <p style={{ margin: '4px 0 0', color: colors.textMuted, fontSize: 13 }}>Configure your trading parameters and risk management</p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: 5, background: colors.bgSecondary, borderRadius: borderRadius.lg, border: `1px solid ${colors.border}`, marginBottom: 24 }}>
        <div className="settings-tab-bar">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const hasDot = tabHasNonDefault(tab.id, settings);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: active ? colors.bgCard || colors.bgTertiary : 'transparent',
                  border: active ? `1px solid ${colors.border}` : '1px solid transparent',
                  borderRadius: borderRadius.md,
                  color: active ? colors.accent : colors.textMuted,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  boxShadow: active ? shadows.sm : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
                {tab.label}
                {hasDot && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? colors.accent : colors.textMuted, display: 'inline-block', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 720, paddingBottom: hasUnsavedChanges ? 100 : 40 }}>

        {/* ── TAB 1: Quick Setup ─────────────────────────────── */}
        {activeTab === 'quicksetup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Mode */}
            <SettingsSection title="Trading Mode" subtitle="Choose between simulated paper trading and real live trading." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
            >
              <SettingRow label="Mode" description="Paper mode uses simulated money. Live mode executes real trades through your broker." colors={colors} explanation={SETTING_EXPLANATIONS.mode} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="mode">
                <div style={{ display: 'flex', gap: 8 }}>
                  {['paper', 'live'].map(mode => (
                    <button key={mode} onClick={() => set('mode', mode)} style={{ padding: '9px 18px', borderRadius: borderRadius.md, border: `2px solid ${get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.border}`, background: get('mode', 'paper') === mode ? (mode === 'live' ? (colors.errorDark || 'rgba(248,81,73,0.15)') : colors.accentDark) : 'transparent', color: get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s ease' }}>
                      {mode}
                    </button>
                  ))}
                </div>
              </SettingRow>
              {get('mode', 'paper') === 'live' && (
                <WarningBanner text="Live mode will execute real trades with real money. Make sure your broker account is properly configured and funded." colors={colors} />
              )}
            </SettingsSection>

            {/* Kill switch */}
            <SettingsSection title="Kill Switch" subtitle="Immediately halt all new trades without closing existing positions." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
            >
              <SettingRow label="Execute Trades" description="When enabled, the bot will actively place trades. Disable to pause all trading instantly." colors={colors} explanation={SETTING_EXPLANATIONS.execute_trades} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="execute_trades">
                <Toggle value={get('kill_switch', 'off') === 'off'} onChange={v => set('kill_switch', v ? 'off' : 'on')} />
              </SettingRow>
              {get('kill_switch', 'off') === 'on' && (
                <div style={{ padding: '12px 16px', background: colors.errorDark || 'rgba(248,81,73,0.1)', border: `1px solid ${colors.error}`, borderRadius: 10, color: colors.error, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                  <div><div style={{ fontWeight: 600, marginBottom: 2 }}>Trading is paused</div><div style={{ opacity: 0.85, fontSize: 12 }}>No new trades will be placed. Existing positions are not affected.</div></div>
                </div>
              )}
            </SettingsSection>

            {/* Preset */}
            <SettingsSection title="Trading Profile" subtitle="Select a pre-configured profile or customize your own settings." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
            >
              <PresetSelector presets={presets} selected={settings?.preset_id ?? null} onSelect={handlePresetSelect} disabled={saving} fluxSource={fluxSource} fluxBacktestDays={fluxBacktestDays} fluxBacktestDate={fluxBacktestDate} />
              {isPresetMode && (
                <div style={{ padding: '12px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, color: '#3b82f6', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>Using <strong>{currentPreset?.name || 'preset'}</strong> profile. Editing any setting will switch to Custom mode.</span>
                </div>
              )}
            </SettingsSection>

            {/* Symbols */}
            <SettingsSection title="Trading Symbols" subtitle="Select which tickers the bot will analyze and trade." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            >
              {(() => {
                const currentSymbols = get('symbols', 'QQQ,SPY').split(',').map(s => s.trim()).filter(Boolean);
                const search = symbolSearch.trim().toUpperCase();
                const handleToggle = (ticker, checked) => {
                  const fresh = get('symbols', 'QQQ,SPY').split(',').map(s => s.trim()).filter(Boolean);
                  set('symbols', checked ? [...fresh, ticker].join(',') : fresh.filter(s => s !== ticker).join(','));
                };
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input
                      type="text"
                      placeholder="Search symbols…"
                      value={symbolSearch}
                      onChange={e => setSymbolSearch(e.target.value)}
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    />
                    {Object.entries(AVAILABLE_TICKERS).map(([key, cat]) => {
                      const tickers = search ? cat.tickers.filter(t => t.includes(search)) : cat.tickers;
                      if (!tickers.length) return null;
                      return (
                        <div key={key}>
                          <div style={{ fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{cat.label}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {tickers.map(ticker => (
                              <TickerCheckbox key={ticker} ticker={ticker} checked={currentSymbols.includes(ticker)} onChange={c => handleToggle(ticker, c)} colors={colors} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {currentSymbols.length > 0 && (
                      <div style={{ fontSize: 12, color: colors.textMuted }}>
                        {currentSymbols.length} symbol{currentSymbols.length !== 1 ? 's' : ''} selected: <span style={{ color: colors.textSecondary, fontFamily: fontFamily.mono }}>{currentSymbols.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </SettingsSection>

            {/* Broker */}
            <BrokerConnectionCard colors={colors} />
          </div>
        )}

        {/* ── TAB 2: Schedule ───────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Trading Window" subtitle="Define when the bot is allowed to place new trades. All times are in EST." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            >
              <SettingRow label="Active Hours" description="New trades will only be placed during this window. Market hours are 9:30 AM – 4:00 PM EST." colors={colors} explanation={SETTING_EXPLANATIONS.trading_window} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="trading_window">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="time" value={get('trading_window_start', '11:30')} onChange={e => set('trading_window_start', e.target.value)} style={{ ...inputStyle, width: 110, textAlign: 'center' }} />
                  <span style={{ color: colors.textMuted, fontSize: 13 }}>to</span>
                  <input type="time" value={get('trading_window_end', '13:30')} onChange={e => set('trading_window_end', e.target.value)} style={{ ...inputStyle, width: 110, textAlign: 'center' }} />
                </div>
              </SettingRow>

              <SettingRow label="Entry Blacklist" description="Minutes to skip after the trading window opens before placing trades." colors={colors} explanation={SETTING_EXPLANATIONS.entry_blacklist_minutes} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="entry_blacklist_minutes">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min="0" max="30" value={get('entry_blacklist_minutes', 5)} onChange={e => set('entry_blacklist_minutes', parseInt(e.target.value, 10) || 0)} style={{ ...inputStyle, width: 70, textAlign: 'center' }} />
                  <span style={{ color: colors.textMuted, fontSize: 13 }}>min</span>
                </div>
              </SettingRow>

              <QuickTip text="The first 5–10 minutes after market open often have the highest volatility and widest spreads." colors={colors} />
            </SettingsSection>

            <SettingsSection title="Day Type Classification" subtitle="Classify trading days and adjust behavior accordingly." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            >
              <SettingRow label="Enable Day Type" description="Skip high-volatility days (SKIP), raise threshold on choppy days (CHOP)." colors={colors}>
                <Toggle value={get('day_type_enabled', true)} onChange={v => set('day_type_enabled', v)} />
              </SettingRow>

              {get('day_type_enabled', true) && (
                <SettingRow label="Chop Day Threshold" description="Higher confidence required on choppy days to reduce overtrading." guardrail={{ min: 0.60, max: 0.90, default: 0.75 }} value={get('chop_day_conf_threshold', 0.75)} colors={colors}>
                  <ValidatedNumberInput value={get('chop_day_conf_threshold', 0.75)} onChange={v => set('chop_day_conf_threshold', v)} step={0.05} min={0.60} max={0.90} isPercent colors={colors} />
                </SettingRow>
              )}
            </SettingsSection>
          </div>
        )}

        {/* ── TAB 3: Entry ──────────────────────────────────── */}
        {activeTab === 'entry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Entry Conditions" subtitle="Fine-tune when the bot should enter positions." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>}
            >
              <SettingRow label="Confidence Threshold" description="Minimum AI confidence score (0–100%) required before entering a trade." guardrail={guardrails.llm_conf_threshold || guardrails.conf_threshold} value={get('llm_conf_threshold', 0.55)} colors={colors} explanation={SETTING_EXPLANATIONS.conf_threshold} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="llm_conf_threshold">
                <SettingSlider value={get('llm_conf_threshold', 0.55)} onChange={v => set('llm_conf_threshold', v)} min={0.40} max={0.85} step={0.01} isPercent colors={colors} />
              </SettingRow>

              <SettingRow label="Momentum Entry" description="Minimum recent price movement required to consider entry." guardrail={guardrails.llm_mom_entry_pct || guardrails.mom_entry_pct} value={get('llm_mom_entry_pct', 0.002)} colors={colors} explanation={SETTING_EXPLANATIONS.mom_entry_pct} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="llm_mom_entry_pct">
                <SettingSlider value={get('llm_mom_entry_pct', 0.002)} onChange={v => set('llm_mom_entry_pct', v)} min={0.001} max={0.01} step={0.0005} isPercent colors={colors} />
              </SettingRow>

              <SettingRow label="Momentum Lookback" description="How many 1-minute bars to analyze when measuring momentum." guardrail={guardrails.llm_mom_lookback || guardrails.mom_lookback} value={get('llm_mom_lookback', 8)} colors={colors} explanation={SETTING_EXPLANATIONS.mom_lookback} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="llm_mom_lookback">
                <ValidatedNumberInput value={get('llm_mom_lookback', 8)} onChange={v => set('llm_mom_lookback', v)} step={1} min={3} max={20} suffix="bars" colors={colors} />
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Signal Enhancements" subtitle="Additional filters that adjust confidence scores before entry." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
            >
              {/* EMA slope */}
              <SettingRow label="EMA Slope Filter" description="Penalize counter-trend trades based on EMA direction." colors={colors}>
                <Toggle value={get('ema_slope_enabled', true)} onChange={v => set('ema_slope_enabled', v)} />
              </SettingRow>
              {get('ema_slope_enabled', true) && (
                <SettingRow label="EMA Slope Penalty" description="Confidence reduction for counter-trend trades." guardrail={{ min: 0.05, max: 0.25, default: 0.10 }} value={get('ema_slope_penalty', 0.10)} colors={colors}>
                  <ValidatedNumberInput value={get('ema_slope_penalty', 0.10)} onChange={v => set('ema_slope_penalty', v)} step={0.01} min={0.05} max={0.25} isPercent colors={colors} />
                </SettingRow>
              )}

              {/* Relative strength */}
              <SettingRow label="Relative Strength" description="Boost confidence for stocks outperforming the index." colors={colors}>
                <Toggle value={get('relative_strength_enabled', true)} onChange={v => set('relative_strength_enabled', v)} />
              </SettingRow>
              {get('relative_strength_enabled', true) && (
                <SettingRow label="Relative Strength Boost" description="Confidence boost for strong relative performers." guardrail={{ min: 0.02, max: 0.15, default: 0.05 }} value={get('relative_strength_boost', 0.05)} colors={colors}>
                  <ValidatedNumberInput value={get('relative_strength_boost', 0.05)} onChange={v => set('relative_strength_boost', v)} step={0.01} min={0.02} max={0.15} isPercent colors={colors} />
                </SettingRow>
              )}

              {/* Entry quality */}
              <SettingRow label="Entry Quality Filter" description="Check volume and price displacement before entering." colors={colors}>
                <Toggle value={get('entry_quality_enabled', true)} onChange={v => set('entry_quality_enabled', v)} />
              </SettingRow>
              {get('entry_quality_enabled', true) && (
                <SettingRow label="Min Volume Ratio" description="Entry candle volume must exceed this multiple of average volume." guardrail={{ min: 1.0, max: 2.0, default: 1.2 }} value={get('min_volume_ratio', 1.2)} colors={colors}>
                  <ValidatedNumberInput value={get('min_volume_ratio', 1.2)} onChange={v => set('min_volume_ratio', v)} step={0.1} min={1.0} max={2.0} suffix="x" colors={colors} />
                </SettingRow>
              )}

              {/* Opening range */}
              <SettingRow label="Opening Range" description="Include first 5-minute candle high/low as context for decisions." colors={colors}>
                <Toggle value={get('opening_range_enabled', true)} onChange={v => set('opening_range_enabled', v)} />
              </SettingRow>
            </SettingsSection>

            {/* HTF collapsible */}
            <CollapsibleSection
              title="Higher Timeframe Analysis"
              subtitle="Use 15-minute chart trends to validate entry direction."
              defaultOpen={get('htf_enabled', true)}
              colors={colors}
              badge={get('htf_enabled', true) ? 'ON' : 'OFF'}
            >
              <SettingRow label="Enable HTF Analysis" description="Validate entry direction against the 15-minute trend before entering." colors={colors} explanation={SETTING_EXPLANATIONS.htf_enabled} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="htf_enabled">
                <Toggle value={get('htf_enabled', true)} onChange={v => set('htf_enabled', v)} />
              </SettingRow>

              {get('htf_enabled', true) && (
                <>
                  <SettingRow label="Require Alignment" description="Block trades when HTF direction opposes the intended trade direction." colors={colors}>
                    <Toggle value={get('htf_require_alignment', true)} onChange={v => set('htf_require_alignment', v)} />
                  </SettingRow>

                  <SettingRow label="Min Alignment Score" description="Minimum alignment strength required (0 = any, 1 = moderate, 2 = strong)." guardrail={DEFAULT_GUARDRAILS.htf_min_alignment_score} value={get('htf_min_alignment_score', 0)} colors={colors}>
                    <ValidatedNumberInput value={get('htf_min_alignment_score', 0)} onChange={v => set('htf_min_alignment_score', v)} step={1} min={0} max={2} colors={colors} />
                  </SettingRow>

                  <SettingRow label="Confidence Boost" description="Confidence bonus when HTF strongly aligns with trade direction." guardrail={DEFAULT_GUARDRAILS.htf_confidence_boost} value={get('htf_confidence_boost', 0.05)} colors={colors}>
                    <ValidatedNumberInput value={get('htf_confidence_boost', 0.05)} onChange={v => set('htf_confidence_boost', v)} step={0.01} min={0} max={0.15} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Confidence Penalty" description="Confidence reduction when HTF disagrees with trade direction." guardrail={DEFAULT_GUARDRAILS.htf_confidence_penalty} value={get('htf_confidence_penalty', 0.10)} colors={colors}>
                    <ValidatedNumberInput value={get('htf_confidence_penalty', 0.10)} onChange={v => set('htf_confidence_penalty', v)} step={0.01} min={0} max={0.20} isPercent colors={colors} />
                  </SettingRow>
                </>
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* ── TAB 4: Risk ───────────────────────────────────── */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Exit Targets" subtitle="Define stop loss and take profit levels." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>}
            >
              <SettingRow label="Stop Loss" description="Maximum allowed loss before the position is automatically closed." guardrail={guardrails.stop_loss_pct} value={get('stop_loss_pct', 0.008)} colors={colors} explanation={SETTING_EXPLANATIONS.stop_loss_pct} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="stop_loss_pct">
                <SettingSlider value={get('stop_loss_pct', 0.008)} onChange={v => set('stop_loss_pct', v)} min={0.002} max={0.05} step={0.001} isPercent colors={colors} />
              </SettingRow>

              <SettingRow label="Take Profit" description="Target gain at which the position is automatically closed." guardrail={guardrails.take_profit_pct} value={get('take_profit_pct', 0.015)} colors={colors} explanation={SETTING_EXPLANATIONS.take_profit_pct} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="take_profit_pct">
                <SettingSlider value={get('take_profit_pct', 0.015)} onChange={v => set('take_profit_pct', v)} min={0.005} max={0.10} step={0.001} isPercent colors={colors} />
              </SettingRow>

              <RiskRewardCard stopLoss={get('stop_loss_pct', 0.008)} takeProfit={get('take_profit_pct', 0.015)} colors={colors} />
            </SettingsSection>

            <SettingsSection title="Position Sizing" subtitle="Control how much of your account is at risk on each trade." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            >
              <SettingRow label="Risk per Trade" description="Maximum percentage of your account that can be lost on a single trade." guardrail={guardrails.risk_per_trade_pct} value={get('risk_per_trade_pct', 0.002)} colors={colors} explanation={SETTING_EXPLANATIONS.risk_per_trade_pct} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="risk_per_trade_pct">
                <SettingSlider value={get('risk_per_trade_pct', 0.002)} onChange={v => set('risk_per_trade_pct', v)} min={0.001} max={0.02} step={0.001} isPercent colors={colors} />
              </SettingRow>

              <SettingRow label="Max Hold Time" description="Positions open longer than this will be automatically closed." guardrail={guardrails.max_hold_min} value={get('max_hold_min', 60)} colors={colors} explanation={SETTING_EXPLANATIONS.max_hold_min} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="max_hold_min">
                <SettingSlider value={get('max_hold_min', 60)} onChange={v => set('max_hold_min', Math.round(v))} min={15} max={390} step={5} suffix="min" colors={colors} />
              </SettingRow>

              <SettingRow label="Trades per Symbol per Day" description="How many times the bot can enter the same ticker in one day." guardrail={guardrails.trades_per_ticker_per_day} value={get('trades_per_ticker_per_day', 1)} colors={colors} explanation={SETTING_EXPLANATIONS.trades_per_ticker_per_day} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="trades_per_ticker_per_day">
                <ValidatedNumberInput value={get('trades_per_ticker_per_day', 1)} onChange={v => set('trades_per_ticker_per_day', v)} step={1} min={1} max={5} colors={colors} />
              </SettingRow>

              <SettingRow label="Max Open Positions" description="Maximum number of positions that can be open at the same time." guardrail={guardrails.max_open_positions} value={get('max_open_positions', 3)} colors={colors} explanation={SETTING_EXPLANATIONS.max_open_positions} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="max_open_positions">
                <ValidatedNumberInput value={get('max_open_positions', 3)} onChange={v => set('max_open_positions', v)} onValidate={v => validate('max_open_positions', v, 'max_open_positions')} error={errors['max_open_positions']} step={1} min={guardrails.max_open_positions?.min} max={guardrails.max_open_positions?.max} colors={colors} />
              </SettingRow>

              <PositionCapacityVisual maxPositions={get('max_open_positions', 3)} riskPerTrade={get('risk_per_trade_pct', 0.002)} colors={colors} />
            </SettingsSection>

            <SettingsSection title="Velocity Exit" subtitle="Exit early when adverse price movement is abnormally fast." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>}
            >
              <SettingRow label="Quick Reversal Protection" description="Exit early if price drops unusually fast relative to the stock's normal volatility." colors={colors} explanation={SETTING_EXPLANATIONS.mq_velocity_enabled} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="mq_velocity_enabled">
                <Toggle value={get('mq_velocity_enabled', true)} onChange={v => set('mq_velocity_enabled', v)} />
              </SettingRow>
              {get('mq_velocity_enabled', true) && (
                <SettingRow label="Speed Sensitivity" description="Triggers exit when adverse move exceeds this multiple of the stock's average volatility rate." colors={colors}>
                  <SettingSlider value={get('mq_velocity_multiplier', 3.5)} onChange={v => set('mq_velocity_multiplier', v)} min={1.5} max={5.0} step={0.1} suffix="x" colors={colors} />
                </SettingRow>
              )}
            </SettingsSection>

            <SettingsSection title="Trailing Stop" subtitle="Lock in gains by moving your stop up as price rises." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
            >
              <SettingRow label="Trailing Stop" description="Activate a break-even stop once trade reaches target profit level." colors={colors} explanation={SETTING_EXPLANATIONS.trailing_stop_enabled} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="trailing_stop_enabled">
                <Toggle value={get('trailing_stop_enabled', true)} onChange={v => set('trailing_stop_enabled', v)} />
              </SettingRow>
              {get('trailing_stop_enabled', true) && (
                <>
                  <SettingRow label="Activation Point" description="Activates when trade reaches this % of take-profit target." colors={colors} explanation={SETTING_EXPLANATIONS.trailing_stop_activation} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="trailing_stop_activation">
                    <SettingSlider value={get('trailing_stop_activation', 0.40)} onChange={v => set('trailing_stop_activation', v)} min={0.30} max={0.95} step={0.05} isPercent colors={colors} />
                  </SettingRow>
                  <SettingRow label="Trail Distance" description="How much gain to give back. 1.0 = break-even at entry, 0.5 = lock in 50% of peak gain." colors={colors} explanation={SETTING_EXPLANATIONS.trailing_stop_distance} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="trailing_stop_distance">
                    <SettingSlider value={get('trailing_stop_distance', 0.50)} onChange={v => set('trailing_stop_distance', v)} min={0.0} max={1.0} step={0.1} colors={colors} />
                  </SettingRow>
                </>
              )}
            </SettingsSection>
          </div>
        )}

        {/* ── TAB 5: Intelligence ───────────────────────────── */}
        {activeTab === 'intelligence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <StrategyStatusCard
              fbsEnabled={get('fbs_enabled', true)}
              fbsShadow={get('fbs_shadow_mode', false)}
              odfEnabled={get('odf_enabled', true)}
              odfShadow={get('odf_shadow_mode', false)}
              colors={colors}
            />

            {/* FBS collapsible */}
            <CollapsibleSection
              title="Failed Breakout Short (FBS)"
              subtitle="Short stocks that fail to break above resistance levels."
              defaultOpen={get('fbs_enabled', true)}
              colors={colors}
              badge={get('fbs_enabled', true) ? (get('fbs_shadow_mode', false) ? 'SHADOW' : 'ON') : 'OFF'}
            >
              <SettingRow label="Enable FBS Strategy" description="Activate the failed breakout short strategy." colors={colors} explanation={SETTING_EXPLANATIONS.fbs_enabled} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="fbs_enabled">
                <Toggle value={get('fbs_enabled', true)} onChange={v => set('fbs_enabled', v)} />
              </SettingRow>

              {get('fbs_enabled', true) && (
                <>
                  <SettingRow label="Lookback Candles" description="How many candles to analyze for the breakout attempt pattern." guardrail={DEFAULT_GUARDRAILS.fbs_lookback_candles} value={get('fbs_lookback_candles', 30)} colors={colors}>
                    <ValidatedNumberInput value={get('fbs_lookback_candles', 30)} onChange={v => set('fbs_lookback_candles', v)} step={1} min={10} max={60} suffix="candles" colors={colors} />
                  </SettingRow>

                  <SettingRow label="Max Overrun" description="Maximum % price can exceed the breakout level before the pattern is invalidated." guardrail={DEFAULT_GUARDRAILS.fbs_max_overrun_pct} value={get('fbs_max_overrun_pct', 0.005)} colors={colors}>
                    <ValidatedNumberInput value={get('fbs_max_overrun_pct', 0.005)} onChange={v => set('fbs_max_overrun_pct', v)} step={0.001} min={0.001} max={0.02} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Entry Timeout" description="Maximum time after failed breakout to enter the trade." guardrail={DEFAULT_GUARDRAILS.fbs_entry_timeout_min} value={get('fbs_entry_timeout_min', 20)} colors={colors}>
                    <ValidatedNumberInput value={get('fbs_entry_timeout_min', 20)} onChange={v => set('fbs_entry_timeout_min', v)} step={1} min={5} max={60} suffix="min" colors={colors} />
                  </SettingRow>

                  <SettingRow label="Min Confidence" description="Minimum confidence score required to enter an FBS trade." guardrail={DEFAULT_GUARDRAILS.fbs_min_confidence} value={get('fbs_min_confidence', 0.60)} colors={colors}>
                    <ValidatedNumberInput value={get('fbs_min_confidence', 0.60)} onChange={v => set('fbs_min_confidence', v)} step={0.01} min={0.40} max={0.90} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Shadow Mode" description="Track FBS signals and log what would have been traded — without executing real orders." colors={colors}>
                    <Toggle value={get('fbs_shadow_mode', false)} onChange={v => set('fbs_shadow_mode', v)} />
                  </SettingRow>

                  {get('fbs_shadow_mode', false) && (
                    <QuickTip text="Shadow mode is active. FBS signals will be logged to history with strategy=FBS but no orders will be placed." colors={colors} />
                  )}
                </>
              )}
            </CollapsibleSection>

            {/* ODF collapsible */}
            <CollapsibleSection
              title="Opening Drive Fade (ODF)"
              subtitle="Fade exhausted opening drives on gap-and-go setups."
              defaultOpen={get('odf_enabled', true)}
              colors={colors}
              badge={get('odf_enabled', true) ? (get('odf_shadow_mode', false) ? 'SHADOW' : 'ON') : 'OFF'}
            >
              <SettingRow label="Enable ODF Strategy" description="Activate the opening drive fade strategy." colors={colors} explanation={SETTING_EXPLANATIONS.odf_enabled} expandedExplanations={expandedExplanations} setExpandedExplanations={setExpandedExplanations} settingKey="odf_enabled">
                <Toggle value={get('odf_enabled', true)} onChange={v => set('odf_enabled', v)} />
              </SettingRow>

              {get('odf_enabled', true) && (
                <>
                  <SettingRow label="Min Gap Size" description="Minimum opening gap required to qualify for an ODF setup." guardrail={DEFAULT_GUARDRAILS.odf_min_gap_pct} value={get('odf_min_gap_pct', 0.005)} colors={colors}>
                    <ValidatedNumberInput value={get('odf_min_gap_pct', 0.005)} onChange={v => set('odf_min_gap_pct', v)} step={0.001} min={0.001} max={0.03} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Min Drive Candles" description="Minimum number of candles in the opening drive before fading." guardrail={DEFAULT_GUARDRAILS.odf_min_drive_candles} value={get('odf_min_drive_candles', 3)} colors={colors}>
                    <ValidatedNumberInput value={get('odf_min_drive_candles', 3)} onChange={v => set('odf_min_drive_candles', v)} step={1} min={1} max={10} suffix="candles" colors={colors} />
                  </SettingRow>

                  <SettingRow label="Reversal Wick %" description="Minimum wick size as a % of the candle body to confirm reversal." guardrail={DEFAULT_GUARDRAILS.odf_reversal_wick_pct} value={get('odf_reversal_wick_pct', 0.50)} colors={colors}>
                    <ValidatedNumberInput value={get('odf_reversal_wick_pct', 0.50)} onChange={v => set('odf_reversal_wick_pct', v)} step={0.05} min={0.30} max={0.90} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Min Confidence" description="Minimum confidence score required to enter an ODF trade." guardrail={DEFAULT_GUARDRAILS.odf_min_confidence} value={get('odf_min_confidence', 0.55)} colors={colors}>
                    <ValidatedNumberInput value={get('odf_min_confidence', 0.55)} onChange={v => set('odf_min_confidence', v)} step={0.01} min={0.35} max={0.85} isPercent colors={colors} />
                  </SettingRow>

                  <SettingRow label="Shadow Mode" description="Track ODF signals and log what would have been traded — without executing real orders." colors={colors}>
                    <Toggle value={get('odf_shadow_mode', false)} onChange={v => set('odf_shadow_mode', v)} />
                  </SettingRow>

                  {get('odf_shadow_mode', false) && (
                    <QuickTip text="Shadow mode is active. ODF signals will be logged to history with strategy=ODF but no orders will be placed." colors={colors} />
                  )}
                </>
              )}
            </CollapsibleSection>
          </div>
        )}

        {/* ── TAB 6: Advanced ───────────────────────────────── */}
        {activeTab === 'advanced' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Reset Settings" subtitle="Restore all trading parameters to their factory defaults." colors={colors}
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.44"/></svg>}
            >
              <SettingRow label="Reset to Defaults" description="Resets all trading parameters to their default values. This will overwrite your current configuration." colors={colors}>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.confirm('Reset all settings to defaults? Your current configuration will be overwritten.')) {
                      setSettings(s => ({ ...s, ...DEFAULT_SETTINGS }));
                    }
                  }}
                  style={{ padding: '9px 18px', background: colors.errorDark || 'rgba(248,81,73,0.12)', color: colors.error, border: `1px solid ${colors.error}40`, borderRadius: borderRadius.md, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s ease' }}
                >
                  Reset to Defaults
                </button>
              </SettingRow>

              <QuickTip text="After resetting, review each tab to confirm the defaults make sense for your trading style before saving." colors={colors} />
            </SettingsSection>
          </div>
        )}

      </div>

      {/* Unsaved changes bar */}
      <UnsavedChangesBar hasChanges={hasUnsavedChanges} onDiscard={onDiscard} onSave={onSave} saving={saving} colors={colors} />
    </Layout>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onClose, colors = darkTheme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: borderRadius.md, background: type === 'error' ? '#1a0a0a' : colors.accentDark, border: `1px solid ${type === 'error' ? colors.error : colors.accentMuted || colors.accent}`, color: type === 'error' ? colors.error : colors.accent, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', animation: 'settingsSlideIn 0.3s ease', minWidth: 250 }}>
      <span style={{ fontSize: 15 }}>{type === 'error' ? '!' : '✓'}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 4, opacity: 0.7, fontSize: 16 }}>×</button>
    </div>
  );
}

function SettingsSection({ title, subtitle, children, colors = darkTheme, icon }) {
  return (
    <div style={{ ...cardStyle, background: colors.bgCard || colors.bgSecondary, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', background: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ color: colors.accent, display: 'flex' }}>{icon}</span>}
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{title}</span>
        </div>
        {subtitle && <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 13, lineHeight: 1.5, marginLeft: icon ? 25 : 0 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '6px 22px 22px' }}>{children}</div>
    </div>
  );
}

function SettingRow({ label, description, guardrail, value, children, colors = darkTheme, explanation, expandedExplanations, setExpandedExplanations, settingKey }) {
  const isExpanded = expandedExplanations?.[settingKey] || false;
  const toggleExpanded = () => {
    if (setExpandedExplanations && settingKey) setExpandedExplanations(p => ({ ...p, [settingKey]: !p[settingKey] }));
  };

  return (
    <div style={{ padding: '15px 0', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: colors.textPrimary, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
            {label}
            {explanation && (
              <span style={{ color: colors.textMuted, cursor: 'pointer', opacity: 0.6, display: 'flex', transition: 'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.6} onClick={toggleExpanded} title="Click for details">
                <InfoIcon size={13} color="currentColor" />
              </span>
            )}
          </div>
          {description && <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{description}</div>}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
      {guardrail && value !== undefined && (
        <div style={{ marginTop: 10 }}>
          <GuardrailHint min={guardrail.min} max={guardrail.max} value={value} recommended={guardrail.recommended || guardrail.default} isPercent={guardrail.min < 1} decimals={guardrail.min < 0.01 ? 2 : 1} />
        </div>
      )}
      {explanation && (
        <ExplanationBox explanation={explanation} isExpanded={isExpanded} onToggle={toggleExpanded} colors={colors} />
      )}
    </div>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} disabled={disabled} style={{ ...(value ? toggleOnStyle : toggleOffStyle), opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {value ? 'ON' : 'OFF'}
    </button>
  );
}

function TickerCheckbox({ ticker, checked, onChange, disabled = false, colors = darkTheme }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', background: checked ? `${colors.accent}15` : colors.bgTertiary, border: `1px solid ${checked ? colors.accent : colors.border}`, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.15s ease' }}>
      <input type="checkbox" checked={checked} onChange={e => !disabled && onChange(e.target.checked)} disabled={disabled} style={{ width: 15, height: 15, accentColor: colors.accent, cursor: disabled ? 'not-allowed' : 'pointer' }} />
      <span style={{ color: checked ? colors.accent : colors.textPrimary, fontSize: fontSize.sm, fontWeight: checked ? fontWeight.medium : fontWeight.normal, fontFamily: fontFamily.mono }}>{ticker}</span>
    </label>
  );
}

function ReadOnlyValue({ value, colors = darkTheme }) {
  return (
    <div style={{ padding: '7px 14px', background: colors.bgTertiary, borderRadius: 8, color: colors.textPrimary, fontSize: fontSize.base, minWidth: 80, textAlign: 'center' }}>{value}</div>
  );
}

function ValidatedNumberInput({ value, onChange, onValidate, error, step = 1, min, max, suffix = '', isPercent = false, disabled = false, colors = darkTheme }) {
  const displayValue = isPercent ? (value * 100).toFixed(2) : value;
  const handleChange = (e) => {
    if (disabled) return;
    const raw = Number(e.target.value);
    const actual = isPercent ? raw / 100 : raw;
    onChange(actual);
    if (onValidate) onValidate(actual);
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <input type="number" value={displayValue} onChange={handleChange} disabled={disabled} step={isPercent ? step * 100 : step} min={min != null ? (isPercent ? min * 100 : min) : undefined} max={max != null ? (isPercent ? max * 100 : max) : undefined} style={{ ...inputStyle, width: 90, textAlign: 'center', borderColor: error ? colors.error : colors.border, opacity: disabled ? 0.5 : 1 }} />
        <span style={{ color: colors.textMuted, fontSize: 13 }}>{isPercent ? '%' : suffix}</span>
      </div>
      {error && <div style={{ color: colors.error, fontSize: 11, marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function SettingSlider({ value, onChange, min, max, step = 0.01, isPercent = false, suffix = '', colors = darkTheme }) {
  const toDisplay = v => isPercent ? v * 100 : v;
  const fromDisplay = v => isPercent ? v / 100 : v;
  const displayVal = toDisplay(value);
  const displayMin = toDisplay(min);
  const displayMax = toDisplay(max);
  const displayStep = toDisplay(step);
  const pct = Math.max(0, Math.min(100, ((displayVal - displayMin) / (displayMax - displayMin)) * 100));

  const handleSlider = e => onChange(fromDisplay(parseFloat(e.target.value)));
  const handleInput = e => {
    const raw = parseFloat(e.target.value);
    if (!isNaN(raw)) onChange(fromDisplay(Math.max(displayMin, Math.min(displayMax, raw))));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 280 }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="range"
          min={displayMin}
          max={displayMax}
          step={displayStep}
          value={displayVal}
          onChange={handleSlider}
          style={{ width: '100%', background: `linear-gradient(to right, ${colors.accent} ${pct}%, ${colors.bgTertiary} ${pct}%)` }}
        />
      </div>
      <input
        type="number"
        value={isPercent ? displayVal.toFixed(1) : displayVal}
        onChange={handleInput}
        min={displayMin}
        max={displayMax}
        step={displayStep}
        style={{ ...inputStyle, width: 68, textAlign: 'center', flexShrink: 0 }}
      />
      {(isPercent || suffix) && <span style={{ color: colors.textMuted, fontSize: 13, minWidth: 16, flexShrink: 0 }}>{isPercent ? '%' : suffix}</span>}
    </div>
  );
}

function CollapsibleSection({ title, subtitle, defaultOpen = false, children, colors = darkTheme, badge }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ border: `1px dashed ${colors.border}`, borderRadius: borderRadius.lg, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '16px 20px', background: open ? colors.bgTertiary : 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12, textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{title}</span>
          {badge && (
            <span style={{ fontSize: 10, padding: '2px 8px', background: badge === 'ON' ? `${colors.success}20` : badge === 'SHADOW' ? `${colors.warning}20` : colors.bgSecondary, color: badge === 'ON' ? colors.success : badge === 'SHADOW' ? colors.warning : colors.textMuted, borderRadius: 10, fontWeight: 700, letterSpacing: '0.3px' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!open && subtitle && <span style={{ fontSize: 12, color: colors.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</span>}
          <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'flex', color: colors.textMuted }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1px dashed ${colors.border}`, padding: '4px 20px 20px' }}>
          {subtitle && <p style={{ margin: '12px 0 14px', color: colors.textMuted, fontSize: 13, lineHeight: 1.5 }}>{subtitle}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

function StrategyStatusCard({ fbsEnabled, fbsShadow, odfEnabled, odfShadow, colors = darkTheme }) {
  const strategies = [
    { name: 'LLM + ML Momentum', desc: 'Primary strategy — always active', status: 'active', color: colors.success },
    {
      name: 'Failed Breakout Short',
      desc: fbsEnabled ? (fbsShadow ? 'Enabled in shadow mode — tracking only' : 'Enabled — trading live') : 'Disabled',
      status: fbsEnabled ? (fbsShadow ? 'shadow' : 'active') : 'off',
      color: fbsEnabled ? (fbsShadow ? colors.warning : colors.error) : colors.textMuted,
    },
    {
      name: 'Opening Drive Fade',
      desc: odfEnabled ? (odfShadow ? 'Enabled in shadow mode — tracking only' : 'Enabled — trading live') : 'Disabled',
      status: odfEnabled ? (odfShadow ? 'shadow' : 'active') : 'off',
      color: odfEnabled ? colors.warning : colors.textMuted,
    },
  ];

  return (
    <div style={{ ...cardStyle, background: colors.bgCard || colors.bgSecondary, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', background: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: colors.accent, display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Strategy Status</span>
          <span style={{ fontSize: 10, padding: '2px 8px', background: colors.bgTertiary, color: colors.textMuted, borderRadius: 8, fontWeight: 600, marginLeft: 2 }}>READ-ONLY</span>
        </div>
        <p style={{ margin: '6px 0 0 25px', color: colors.textMuted, fontSize: 13 }}>Active strategies and their current execution mode.</p>
      </div>
      <div style={{ padding: '8px 22px 18px' }}>
        {strategies.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < strategies.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
            <div>
              <div style={{ fontWeight: 600, color: colors.textPrimary, fontSize: 14, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{s.desc}</div>
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 20, background: `${s.color}18`, border: `1px solid ${s.color}40`, fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '0.3px', flexShrink: 0 }}>
              {s.status === 'active' ? 'ACTIVE' : s.status === 'shadow' ? 'SHADOW' : 'OFF'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrokerConnectionCard({ colors = darkTheme }) {
  const brokers = [
    { name: 'Alpaca Paper', detail: 'Simulated trading account', status: 'connected', color: colors.success },
    { name: 'Alpaca Live', detail: 'Real money trading', status: 'disconnected', color: colors.textMuted },
    { name: 'Tradier', detail: 'Coming soon', status: 'soon', color: colors.textMuted },
    { name: 'TD Ameritrade', detail: 'Coming soon', status: 'soon', color: colors.textMuted },
  ];

  return (
    <div style={{ ...cardStyle, background: colors.bgCard || colors.bgSecondary, borderColor: colors.border, padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px', background: colors.bgSecondary, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: colors.accent, display: 'flex' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>Broker Connections</span>
        </div>
        <p style={{ margin: '6px 0 0 25px', color: colors.textMuted, fontSize: 13 }}>Manage your brokerage connections for live trading.</p>
      </div>
      <div style={{ padding: '8px 22px 18px' }}>
        {brokers.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < brokers.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
            <div>
              <div style={{ fontWeight: 600, color: colors.textPrimary, fontSize: 14, marginBottom: 1 }}>{b.name}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{b.detail}</div>
            </div>
            <div style={{ padding: '4px 12px', borderRadius: 20, background: b.status === 'connected' ? `${b.color}18` : colors.bgTertiary, border: `1px solid ${b.status === 'connected' ? b.color + '40' : colors.border}`, fontSize: 11, fontWeight: 700, color: b.status === 'connected' ? b.color : colors.textMuted, letterSpacing: '0.3px', flexShrink: 0 }}>
              {b.status === 'connected' ? 'CONNECTED' : b.status === 'soon' ? 'SOON' : 'NOT CONNECTED'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnsavedChangesBar({ hasChanges, onDiscard, onSave, saving, colors = darkTheme }) {
  if (!hasChanges) return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '14px 24px', background: colors.bgSecondary, borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, boxShadow: '0 -4px 16px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.warning }} />
        <span style={{ fontSize: 13, color: colors.textSecondary, fontWeight: 500 }}>You have unsaved changes</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onDiscard} style={{ padding: '9px 18px', background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s ease' }}>
          Discard
        </button>
        <button onClick={onSave} disabled={saving} style={{ ...buttonPrimaryStyle, padding: '9px 22px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.7 : 1 }}>
          {saving ? (
            <><span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />Saving...</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Settings</>
          )}
        </button>
      </div>
    </div>
  );
}

function InfoIcon({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function ExplanationBox({ explanation, isExpanded, onToggle, colors = darkTheme }) {
  if (!explanation) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <button onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, color: colors.textMuted, fontSize: 12, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = colors.accent} onMouseLeave={e => e.currentTarget.style.color = colors.textMuted}>
        <InfoIcon size={13} color="currentColor" />
        <span>{isExpanded ? 'Hide details' : 'Learn more'}</span>
        <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'inline-block' }}>▼</span>
      </button>
      {isExpanded && (
        <div style={{ marginTop: 10, padding: 14, background: colors.bgTertiary, borderRadius: 10, border: `1px solid ${colors.border}`, animation: 'settingsFadeIn 0.2s ease' }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: colors.textSecondary }}>{explanation.details}</p>
          {(explanation.lowImpact || explanation.highImpact) && (
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {explanation.lowImpact && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', background: colors.bgSecondary, borderRadius: 8, borderLeft: `3px solid ${colors.warning}` }}>
                  <span style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.5 }}>{explanation.lowImpact}</span>
                </div>
              )}
              {explanation.highImpact && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', background: colors.bgSecondary, borderRadius: 8, borderLeft: `3px solid ${colors.info || colors.accent}` }}>
                  <span style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.5 }}>{explanation.highImpact}</span>
                </div>
              )}
            </div>
          )}
          {explanation.tip && (
            <div style={{ marginTop: 12, padding: '9px 11px', background: colors.accentDark, borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
              <span style={{ fontSize: 12, color: colors.accent, lineHeight: 1.5, fontWeight: 500 }}>{explanation.tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickTip({ text, colors = darkTheme }) {
  return (
    <div style={{ padding: '11px 14px', background: colors.bgTertiary, borderRadius: 8, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 9, borderLeft: `3px solid ${colors.accent}`, marginTop: 8 }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
      <span>{text}</span>
    </div>
  );
}

function WarningBanner({ text, colors = darkTheme }) {
  return (
    <div style={{ padding: '11px 14px', background: colors.warningDark || 'rgba(210,153,34,0.12)', borderRadius: 8, fontSize: 12, color: colors.warning, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 9, border: `1px solid rgba(210,153,34,0.3)`, marginTop: 8 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>{text}</span>
    </div>
  );
}

function PositionCapacityVisual({ maxPositions, riskPerTrade, colors = darkTheme }) {
  const totalRisk = maxPositions * riskPerTrade * 100;
  return (
    <div style={{ padding: '18px', background: colors.bgTertiary, borderRadius: 12, border: `1px solid ${colors.border}`, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>Position Slots</span>
        <span style={{ fontSize: 12, color: colors.textSecondary, background: colors.bgSecondary, padding: '3px 10px', borderRadius: 12 }}>
          Max risk: <span style={{ color: totalRisk > 5 ? colors.warning : colors.accent, fontWeight: 600 }}>{totalRisk.toFixed(1)}%</span>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const active = i < maxPositions;
          return (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: active ? `${colors.accent}15` : colors.bgSecondary, border: `2px solid ${active ? colors.accent : colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: active ? 1 : 0.35 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: active ? colors.accent : colors.textMuted }}>{i + 1}</span>
              {active && <span style={{ fontSize: 9, color: colors.accent, opacity: 0.8, marginTop: 1 }}>{(riskPerTrade * 100).toFixed(1)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${colors.border}`, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
        With {maxPositions} positions at {(riskPerTrade * 100).toFixed(1)}% risk each, your maximum total exposure is{' '}
        <strong style={{ color: totalRisk > 5 ? colors.warning : colors.textPrimary }}>{totalRisk.toFixed(1)}%</strong> of your account.
      </div>
    </div>
  );
}

function RiskRewardCard({ stopLoss, takeProfit, colors = darkTheme }) {
  const ratio = takeProfit / stopLoss;
  const isGreat = ratio >= 2;
  const isGood = ratio >= 1.5;
  return (
    <div style={{ padding: '18px', background: colors.bgTertiary, borderRadius: 12, border: `1px solid ${colors.border}`, marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>Risk/Reward Analysis</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', background: isGreat ? (colors.successDark || 'rgba(63,185,80,0.12)') : isGood ? (colors.warningDark || 'rgba(210,153,34,0.12)') : (colors.errorDark || 'rgba(248,81,73,0.12)'), borderRadius: 20, border: `1px solid ${isGreat ? colors.success : isGood ? colors.warning : colors.error}40` }}>
          <span style={{ fontSize: 12, color: isGreat ? colors.success : isGood ? colors.warning : colors.error }}>{isGreat ? '✓' : isGood ? '~' : '!'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: fontFamily.mono, color: isGreat ? colors.success : isGood ? colors.warning : colors.error }}>1:{ratio.toFixed(1)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 38, borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ flex: 1, background: `${colors.error}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `2px solid ${colors.bgSecondary}` }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: colors.error, opacity: 0.8 }}>RISK</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.error, fontFamily: fontFamily.mono }}>-{(stopLoss * 100).toFixed(1)}%</div>
          </div>
        </div>
        <div style={{ flex: ratio, background: `${colors.success}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: colors.success, opacity: 0.8 }}>REWARD</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.success, fontFamily: fontFamily.mono }}>+{(takeProfit * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
        {isGreat ? <span style={{ color: colors.textSecondary }}><strong style={{ color: colors.success }}>Excellent ratio.</strong> You need to win just {Math.round(100 / (ratio + 1))}% of trades to break even.</span>
          : isGood ? <span style={{ color: colors.textSecondary }}><strong style={{ color: colors.warning }}>Acceptable ratio.</strong> Consider increasing take profit for better risk-adjusted returns.</span>
          : <span style={{ color: colors.textSecondary }}><strong style={{ color: colors.error }}>Low ratio.</strong> You need to win over {Math.round(100 / (ratio + 1))}% of trades to be profitable.</span>}
      </div>
    </div>
  );
}
