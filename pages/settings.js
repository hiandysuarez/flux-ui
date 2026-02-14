// pages/settings.js - Dark Luxe Settings UI
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PresetSelector from '../components/PresetSelector';
import GuardrailHint from '../components/GuardrailHint';
import {
  fetchUserSettings, saveUserSettings, fetchPresets, applyPreset, fetchGuardrails,
  fetchSettings, saveSettings, fetchAdminSettings, saveAdminSettings,
  fetchStrategies, setActiveStrategy
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

// Check if current user is admin
const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

// Guardrails for display - ORB Strategy focused
// Note: Most trading parameters are now handled by ORB strategy (range-based stops, 2R/3R targets)
// These guardrails are for safety fallbacks only
const DEFAULT_GUARDRAILS = {
  // Safety fallbacks - apply regardless of ORB strategy
  max_open_positions: { min: 1, max: 10, default: 5, recommended: 3 },
  max_hold_min: { min: 15, max: 390, default: 120, recommended: 120 },
  risk_per_trade_pct: { min: 0.001, max: 0.02, default: 0.002, recommended: 0.002 },
  // ORB-specific (for reference, actual validation in backend)
  orb_displacement_min: { min: 1.0, max: 3.0, default: 1.5, recommended: 1.5 },
  orb_volume_min: { min: 1.0, max: 3.0, default: 1.2, recommended: 1.2 },
  orb_min_rr_ratio: { min: 1.0, max: 5.0, default: 2.0, recommended: 2.0 },
  orb_max_trades_per_day: { min: 1, max: 5, default: 2, recommended: 2 },
  confluence_min: { min: 1, max: 5, default: 2, recommended: 2 },
};

// Detailed explanations for each setting
const SETTING_EXPLANATIONS = {
  mode: {
    title: 'Trading Mode',
    description: 'Controls whether trades use real money or are simulated.',
    details: 'Paper mode simulates trades without risking real capital - perfect for testing strategies. Live mode executes real trades through your connected broker account.',
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
    details: 'Trades will only be placed during this time window. This is in your local timezone (PST). Market hours are 6:30 AM - 1:00 PM PST.',
    tip: 'The first and last 30 minutes of market open tend to be most volatile.',
  },
  conf_threshold: {
    title: 'Confidence Threshold',
    description: 'Minimum AI confidence score required to enter a trade.',
    details: 'The AI assigns a confidence score (0-100%) to each potential trade. Only trades above this threshold will be executed. Higher = fewer but more confident trades.',
    lowImpact: 'Lower values (50-55%): More trades, but potentially lower quality signals.',
    highImpact: 'Higher values (70-80%): Fewer trades, but higher conviction entries.',
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
    lowImpact: 'Shorter (3-5 bars): More responsive, catches quick moves but more noise.',
    highImpact: 'Longer (12-20 bars): Smoother signal, filters noise but slower to react.',
    tip: '8-10 bars is a good balance for intraday momentum.',
  },
  stop_loss_pct: {
    title: 'Stop Loss',
    description: 'Maximum loss allowed before automatically exiting.',
    details: 'If your position drops by this percentage from entry, it will be automatically closed to limit losses. This is your primary risk control.',
    lowImpact: 'Tighter stops (0.5%): Less risk per trade but more likely to get stopped out on normal volatility.',
    highImpact: 'Wider stops (2-3%): Gives trades more room but larger potential losses.',
    tip: 'Your stop should be wider than typical market noise for the symbols you trade.',
  },
  take_profit_pct: {
    title: 'Take Profit',
    description: 'Target gain at which to automatically exit.',
    details: 'When your position gains this percentage, it will be automatically closed to lock in profits. Ensures you capture gains instead of giving them back.',
    lowImpact: 'Lower targets (0.5-1%): More frequent wins but smaller gains.',
    highImpact: 'Higher targets (3-5%): Bigger wins but may not reach target as often.',
    tip: 'Your take profit should be at least 1.5-2x your stop loss for positive expectancy.',
  },
  risk_per_trade_pct: {
    title: 'Risk Per Trade',
    description: 'Maximum account percentage risked on each trade.',
    details: 'Controls position sizing. If you risk 0.5% per trade with a 1% stop loss, you\'ll use about 50% of your capital per position. This compounds - smaller risk = more sustainable.',
    lowImpact: 'Lower risk (0.1-0.3%): Very conservative, survives long losing streaks.',
    highImpact: 'Higher risk (0.5-1%): Faster growth potential but larger drawdowns.',
    tip: 'Professional traders typically risk 0.5-2% per trade maximum.',
  },
  max_hold_min: {
    title: 'Max Hold Time (Safety)',
    description: 'Absolute maximum duration before forcing an exit - acts as a safety net.',
    details: 'The ORB strategy has its own exit rules (11:15 AM deadline, 30-min time exit if no 1R hit). This setting is a safety fallback that catches edge cases if those rules fail.',
    lowImpact: 'Shorter (60 min): Tighter safety net, may exit before ORB exit rules trigger.',
    highImpact: 'Longer (2-4 hours): More room for ORB exit rules to work, but ties up capital longer if they fail.',
    tip: 'Keep at 120 minutes as a reasonable safety buffer beyond the ORB exit deadline.',
  },
  trades_per_ticker_per_day: {
    title: 'Trades Per Symbol',
    description: 'Maximum trades allowed per ticker each day.',
    details: 'Limits how many times the bot can enter the same symbol in one day. Prevents overtrading a single stock and revenge trading after losses.',
    lowImpact: '1 trade: Most conservative, one shot per day per symbol.',
    highImpact: '3 trades: Allows re-entry if conditions change throughout the day.',
    tip: 'Start with 1-2 to prevent overtrading the same name.',
  },
  max_open_positions: {
    title: 'Max Open Positions (Safety)',
    description: 'Maximum concurrent positions at any time - prevents overexposure.',
    details: 'The ORB strategy monitors 20 tickers for setups. If multiple setups trigger at once, this limit prevents taking on too many positions. Each ORB trade uses range-based position sizing.',
    lowImpact: 'Fewer (1-2): Very conservative, may miss good setups if already in a position.',
    highImpact: 'More (5-10): Can take multiple ORB setups simultaneously, but increases total exposure.',
    tip: 'Start with 3 positions max to balance opportunity capture with risk management.',
  },
  mq_velocity_enabled: {
    title: 'Quick Reversal Protection',
    description: 'Exit early if the price suddenly moves against you.',
    details: 'Every stock has a "normal" speed of movement. NVDA moves faster than SPY - that\'s expected. But if a stock suddenly drops much faster than its usual speed, something might be wrong (news, panic selling, etc.). This feature detects abnormally fast moves against your position and exits before hitting your full stop-loss.',
    lowImpact: 'OFF: Only uses regular stop-loss. May hold through sudden drops.',
    highImpact: 'ON: Exits early on unusually fast adverse moves. May exit too soon on volatile stocks.',
    tip: 'Recommended ON. Protects you from flash crashes and sudden reversals.',
  },
  trailing_stop_enabled: {
    title: 'Trailing Stop',
    description: 'Lock in gains by moving your stop-loss up as price rises.',
    details: 'When a trade moves in your favor and reaches a certain profit level (the activation point), a trailing stop is set. By default, this stop is at your entry price (break-even), so if the trade reverses, you exit without a loss instead of riding back down to your stop-loss.',
    lowImpact: 'OFF: Uses fixed stop-loss only. May give back unrealized gains on reversals.',
    highImpact: 'ON: Protects gains by activating a trailing stop once trade is profitable.',
    tip: 'Recommended ON. Helps preserve capital on trades that turn around.',
  },
  trailing_stop_activation: {
    title: 'Trailing Stop Activation',
    description: 'When to activate the trailing stop.',
    details: 'Percentage of your take-profit target that must be reached before the trailing stop activates. At 70%, if your take-profit is 2%, the trailing stop activates when you hit +1.4% gain.',
    lowImpact: 'Lower (30-50%): Activates earlier, protects smaller gains.',
    highImpact: 'Higher (80-95%): Only activates near take-profit, lets trade run longer.',
    tip: '70% is a good balance - gives the trade room to develop.',
  },
  trailing_stop_distance: {
    title: 'Trailing Stop Distance',
    description: 'How much profit to give back before exiting.',
    details: '1.0 = break-even (stop at entry price). 0.5 = lock in 50% of peak gain. 0.0 = tightest trail (stop follows price closely). The default (1.0) gives the trade maximum room to breathe.',
    lowImpact: 'Lower (0.0-0.5): Locks in more profit but may exit too early.',
    highImpact: 'Higher (1.0): Break-even stop only. Maximum room for trade to work.',
    tip: 'Start with 1.0 (break-even). Tighten only if you want to lock in partial gains.',
  },
  symbols: {
    title: 'Trading Symbols',
    description: 'Which tickers the bot is allowed to trade.',
    details: 'Comma-separated list of stock symbols. The bot will only analyze and trade these tickers. Stick to liquid, well-known names for best execution.',
    tip: 'QQQ and SPY are popular for their liquidity and tight spreads.',
  },
};

// Available tickers grouped by category
const AVAILABLE_TICKERS = {
  tech: {
    label: 'Tech',
    tickers: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA', 'AMD', 'CRM'],
  },
  etfs: {
    label: 'ETFs',
    tickers: ['SPY', 'QQQ', 'IWM'],
  },
  finance: {
    label: 'Finance',
    tickers: ['JPM', 'BAC'],
  },
  energy: {
    label: 'Energy',
    tickers: ['XOM', 'CVX'],
  },
  consumer: {
    label: 'Consumer',
    tickers: ['WMT', 'HD'],
  },
  healthcare: {
    label: 'Healthcare',
    tickers: ['UNH', 'JNJ'],
  },
};

// Icons for tabs
const TAB_ICONS = {
  profile: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  schedule: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  entry: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </svg>
  ),
  risk: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  limits: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
    </svg>
  ),
  orb: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="2"/>
      <line x1="7" y1="7" x2="7" y2="17"/>
      <line x1="17" y1="7" x2="17" y2="17"/>
      <path d="M12 7v-4M12 21v-4"/>
    </svg>
  ),
  llm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
      <path d="M12 12v10"/>
      <path d="M8 18h8"/>
      <circle cx="12" cy="6" r="1"/>
    </svg>
  ),
  strategy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M4.93 4.93l2.83 2.83"/>
      <path d="M16.24 16.24l2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
      <path d="M4.93 19.07l2.83-2.83"/>
      <path d="M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
};

// Strategy metadata for UI display
const STRATEGY_META = {
  orb: {
    name: 'ORB Strategy',
    description: 'Opening Range Breakout - trades the 5-minute opening range',
    color: '#D4A574',
  },
  momentum: {
    name: 'Momentum',
    description: 'Momentum-based trading strategy (coming soon)',
    color: '#3B82F6',
    disabled: true,
  },
  llm: {
    name: 'LLM Only',
    description: 'Pure AI-driven decisions with ML veto',
    color: '#10B981',
  },
};

// Function to get tabs based on active strategy
function getTabs(activeStrategy) {
  const baseTabs = [
    { id: 'profile', label: 'Profile', icon: TAB_ICONS.profile },
    { id: 'safety', label: 'Safety', icon: TAB_ICONS.risk },  // 2nd - Safety
    { id: 'risk', label: 'Risk', icon: TAB_ICONS.risk },      // 3rd - Risk (RESTORED)
  ];

  // Add strategy-specific tab based on active strategy
  if (activeStrategy === 'orb') {
    baseTabs.push({ id: 'orb', label: 'ORB Strategy', icon: TAB_ICONS.orb });
  }

  // LLM settings always shown (used as fallback or primary)
  baseTabs.push({ id: 'llm', label: 'LLM Settings', icon: TAB_ICONS.llm });

  return baseTabs;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Dark Luxe theme only
  const colors = darkTheme;

  const [settings, setSettings] = useState(null);
  const [presets, setPresets] = useState([]);
  const [guardrails, setGuardrails] = useState(DEFAULT_GUARDRAILS);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [toasts, setToasts] = useState([]);
  const [errors, setErrors] = useState({});
  const [expandedExplanations, setExpandedExplanations] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [changingStrategy, setChangingStrategy] = useState(false);

  // Get active strategy from settings
  // null or '' means LLM Only mode, 'orb' means ORB strategy
  // Only default to 'orb' if settings haven't loaded yet (undefined)
  const activeStrategy = settings?.active_strategy === undefined ? 'orb' : settings?.active_strategy;

  // Dynamic tabs based on active strategy
  const TABS = getTabs(activeStrategy);

  // All authenticated users can edit their own settings
  const isAdmin = true;

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load settings, presets, and guardrails
  useEffect(() => {
    async function load() {
      if (!user) return;

      setLoadError(null);

      try {
        // All users load their own settings via fetchUserSettings
        const [settingsRes, presetsRes, guardrailsRes, strategiesRes] = await Promise.all([
          fetchUserSettings(),
          fetchPresets(),
          fetchGuardrails().catch(() => ({ ok: true, guardrails: DEFAULT_GUARDRAILS })),
          fetchStrategies().catch(() => ({ ok: true, strategies: [] })),
        ]);

        if (settingsRes.ok && settingsRes.settings) {
          setSettings(settingsRes.settings);
        } else if (settingsRes.settings) {
          // fetchSettings returns { settings: {...} } directly
          setSettings(settingsRes.settings);
        } else if (settingsRes.error === 'no_settings') {
          // User hasn't completed onboarding - redirect them
          router.push('/onboarding');
          return;
        } else {
          // API returned error or no settings
          setLoadError(settingsRes.error || 'Failed to load settings');
        }

        if (presetsRes.ok && presetsRes.presets) {
          setPresets(presetsRes.presets);
        }

        if (guardrailsRes.ok && guardrailsRes.guardrails) {
          setGuardrails(guardrailsRes.guardrails);
        }

        if (strategiesRes.ok && strategiesRes.strategies) {
          setStrategies(strategiesRes.strategies);
        }
      } catch (e) {
        const errorMsg = String(e?.message || e);
        setLoadError(errorMsg);
        addToast(errorMsg, 'error');
      }
    }
    load();
  }, [user]);

  // Helper to get/set values
  const get = (path, fallback) => {
    if (!settings) return fallback;
    const parts = path.split('.');
    let val = settings;
    for (const p of parts) {
      val = val?.[p];
    }
    return val ?? fallback;
  };

  const set = (path, value) => {
    setErrors(e => ({ ...e, [path]: null }));
    setSettings((s) => {
      const parts = path.split('.');
      const newSettings = { ...s, preset_id: null }; // Clear preset when customizing
      let current = newSettings;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;
      return newSettings;
    });
  };

  // Validation with guardrails
  const validate = (path, value, field) => {
    const guard = guardrails[field];
    if (!guard) return true;

    if (value < guard.min || value > guard.max) {
      setErrors(e => ({ ...e, [path]: `Must be between ${guard.min} and ${guard.max}` }));
      return false;
    }
    return true;
  };

  // Handle preset selection
  const handlePresetSelect = async (presetId) => {
    if (presetId === null) {
      setSettings(s => ({ ...s, preset_id: null }));
      return;
    }

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

  async function onSave() {
    if (Object.values(errors).some(e => e)) {
      addToast('Please fix validation errors', 'error');
      return;
    }

    setSaving(true);
    try {
      // All users save to their own settings
      const res = await saveUserSettings(settings);

      if (res.ok || res.settings) {
        setSettings(res.settings ?? settings);
        addToast('Settings saved successfully', 'success');
      } else {
        addToast(res.error || 'Failed to save settings', 'error');
      }
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setSaving(false);
    }
  }

  // Handle strategy change - just updates local state, saved when user clicks Save
  const handleStrategyChange = (newStrategy) => {
    // Update local settings state (will be saved when user clicks Save button)
    setSettings(s => ({ ...s, active_strategy: newStrategy }));

    // If switching away from current tab's strategy, go to profile
    if (activeTab === 'orb' && newStrategy !== 'orb') {
      setActiveTab('profile');
    }
  };

  // Find current preset name
  const currentPreset = presets.find(p => p.id === settings?.preset_id);
  const isPresetMode = settings?.preset_id !== null && settings?.preset_id !== undefined;

  if (authLoading || (!settings && !loadError)) {
    return (
      <Layout active="settings">
        <div style={{ color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 20,
            height: 20,
            border: `2px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Loading settings...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout active="settings">
        <div style={{
          ...cardStyle,
          background: colors.errorDark || '#1a0a0a',
          borderColor: colors.error,
          color: colors.error,
        }}>
          <strong>Error loading settings:</strong> {loadError}
          <br /><br />
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              background: colors.error,
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout active="settings">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

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
          <Toast key={t.id} message={t.message} type={t.type} colors={colors} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
        ))}
      </div>

      {/* Header */}
      <div style={{
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.accentDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div>
            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              margin: 0,
              color: colors.textPrimary,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              Settings
              {isAdmin && (
                <span style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  background: colors.accentDark,
                  color: colors.accent,
                  borderRadius: 12,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}>
                  ADMIN
                </span>
              )}
            </h1>
            <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 14 }}>
              {isAdmin ? 'Configure your trading parameters and risk management' : 'View your trading parameters and risk management'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Pill style */}
      <div style={{
        display: 'flex',
        gap: 6,
        marginBottom: 28,
        padding: 6,
        background: colors.bgSecondary,
        borderRadius: borderRadius.lg,
        overflowX: 'auto',
        border: `1px solid ${colors.border}`,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 18px',
              background: activeTab === tab.id ? colors.bgCard : 'transparent',
              border: activeTab === tab.id ? `1px solid ${colors.border}` : '1px solid transparent',
              borderRadius: borderRadius.md,
              color: activeTab === tab.id ? colors.accent : colors.textMuted,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeTab === tab.id ? shadows.sm : 'none',
            }}
          >
            <span style={{
              display: 'flex',
              alignItems: 'center',
              opacity: activeTab === tab.id ? 1 : 0.6,
            }}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Profile Tab - Preset selection + Mode */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Trading Profile Card */}
            <SettingsSection
              title="Trading Profile"
              subtitle="Select a pre-configured profile or customize your own settings."
              colors={colors}
              icon={TAB_ICONS.profile}
            >
              {isAdmin ? (
                <>
                  <PresetSelector
                    presets={presets}
                    selected={settings?.preset_id ?? null}
                    onSelect={handlePresetSelect}
                    disabled={saving}
                  />

                  {isPresetMode && (
                    <div style={{
                      padding: '14px 18px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 10,
                      color: '#3b82f6',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span>
                        Using <strong>{currentPreset?.name || 'preset'}</strong> profile. Editing any setting will switch to Custom mode.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <SettingRow label="Current Preset" description="Your active trading profile" colors={colors}>
                  <ReadOnlyValue colors={colors} value={currentPreset ? currentPreset.name : 'Custom'} />
                </SettingRow>
              )}
            </SettingsSection>

            {/* Mode Selection */}
            <SettingsSection
              title="Trading Mode"
              subtitle="Choose between simulated paper trading and real live trading."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
              }
            >
              <SettingRow
                label="Mode"
                description="Paper mode uses simulated money. Live mode executes real trades through your broker."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mode}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="mode"
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['paper', 'live'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => set('mode', mode)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: borderRadius.md,
                          border: `2px solid ${get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.border}`,
                          background: get('mode', 'paper') === mode ? (mode === 'live' ? colors.errorDark : colors.accentDark) : 'transparent',
                          color: get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.textMuted,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={get('mode', 'paper') === 'paper' ? 'Paper' : 'Live'} />
                )}
              </SettingRow>

              {get('mode', 'paper') === 'live' && (
                <WarningBanner
                  text="Live mode will execute real trades with real money. Make sure your broker account is properly configured and funded."
                  colors={colors}
                />
              )}
            </SettingsSection>

            {/* Strategy Selection */}
            <SettingsSection
              title="Trading Strategy"
              subtitle="Choose your primary trading strategy. LLM is always available as a fallback."
              colors={colors}
              icon={TAB_ICONS.strategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Strategy Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}>
                  {/* ORB Strategy */}
                  <StrategyCard
                    id="orb"
                    name={STRATEGY_META.orb.name}
                    description={STRATEGY_META.orb.description}
                    color={STRATEGY_META.orb.color}
                    isActive={activeStrategy === 'orb'}
                    disabled={changingStrategy}
                    onClick={() => handleStrategyChange('orb')}
                    colors={colors}
                  />

                  {/* Momentum Strategy (Coming Soon) */}
                  <StrategyCard
                    id="momentum"
                    name={STRATEGY_META.momentum.name}
                    description={STRATEGY_META.momentum.description}
                    color={STRATEGY_META.momentum.color}
                    isActive={activeStrategy === 'momentum'}
                    disabled={true}
                    comingSoon={true}
                    onClick={() => {}}
                    colors={colors}
                  />

                  {/* LLM Only */}
                  <StrategyCard
                    id="llm"
                    name={STRATEGY_META.llm.name}
                    description={STRATEGY_META.llm.description}
                    color={STRATEGY_META.llm.color}
                    isActive={activeStrategy === null || activeStrategy === '' || activeStrategy === 'llm'}
                    disabled={changingStrategy}
                    onClick={() => handleStrategyChange(null)}
                    colors={colors}
                  />
                </div>

                {/* Strategy Info */}
                <div style={{
                  padding: '12px 16px',
                  background: colors.bgTertiary,
                  borderRadius: 8,
                  fontSize: 12,
                  color: colors.textSecondary,
                  lineHeight: 1.6,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  borderLeft: `3px solid ${STRATEGY_META[activeStrategy]?.color || colors.accent}`,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>
                    {activeStrategy === 'orb' ? '📊' : activeStrategy === 'momentum' ? '📈' : '🤖'}
                  </span>
                  <span>
                    {activeStrategy === 'orb' && 'ORB trades the 5-minute opening range breakout. It monitors 20 liquid stocks for mechanical setups with confluence validation.'}
                    {activeStrategy === 'momentum' && 'Momentum strategy uses price momentum and ML signals for entries.'}
                    {(!activeStrategy || activeStrategy === 'llm') && 'LLM-only mode uses AI analysis with ML veto for all trading decisions. No mechanical strategy patterns.'}
                    <span style={{ color: colors.textMuted }}> LLM settings below are used when no strategy setup is found.</span>
                  </span>
                </div>
              </div>
            </SettingsSection>

          </div>
        )}

        {/* Schedule Tab - Trading window + Kill switch */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Trading Window"
              subtitle="Define when the bot is allowed to place new trades. All times are in PST."
              colors={colors}
              icon={TAB_ICONS.schedule}
            >
              <SettingRow
                label="Active Hours"
                description="New trades will only be placed during this window. Market hours are 6:30 AM - 1:00 PM PST."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.trading_window}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="trading_window"
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={get('trading_window_start', '06:30')}
                      onChange={(e) => set('trading_window_start', e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 110,
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: colors.textMuted, fontSize: 13, fontWeight: 500 }}>to</span>
                    <input
                      type="time"
                      value={get('trading_window_end', '10:30')}
                      onChange={(e) => set('trading_window_end', e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 110,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('trading_window_start', '06:30')} - ${get('trading_window_end', '10:30')}`} />
                )}
              </SettingRow>
              <QuickTip text="The first 30 minutes after market open (6:30-7:00 AM PST) often have the highest volatility and volume." colors={colors} />
            </SettingsSection>

            <SettingsSection
              title="Emergency Controls"
              subtitle="Immediately halt all trading activity when needed."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
            >
              <SettingRow
                label="Execute Trades"
                description="When enabled, the bot will actively place trades. Disable to pause trading."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.execute_trades}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="execute_trades"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('kill_switch', 'off') === 'off'}
                    onChange={(v) => set('kill_switch', v ? 'off' : 'on')}
                  />
                ) : (
                  <ReadOnlyToggle value={get('kill_switch', 'off') === 'off'} />
                )}
              </SettingRow>

              {get('kill_switch', 'off') === 'on' && (
                <div style={{
                  padding: '14px 18px',
                  background: colors.errorDark,
                  border: `1px solid ${colors.error}`,
                  borderRadius: 10,
                  color: colors.error,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Trading is paused</div>
                    <div style={{ opacity: 0.9 }}>No new trades will be placed. Existing positions are not affected.</div>
                  </div>
                </div>
              )}
            </SettingsSection>
          </div>
        )}

        {/* Entry Rules Tab - Confidence, Momentum */}
        {activeTab === 'entry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Entry Conditions"
              subtitle="Fine-tune when the bot should enter positions. These filters help avoid low-quality trades."
              colors={colors}
              icon={TAB_ICONS.entry}
            >
              <SettingRow
                label="Confidence Threshold"
                description="Minimum AI confidence score (0-100%) required before entering a trade."
                guardrail={guardrails.conf_threshold}
                value={get('conf_threshold', 0.60)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.conf_threshold}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="conf_threshold"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('conf_threshold', 0.60)}
                    onChange={(v) => set('conf_threshold', v)}
                    onValidate={(v) => validate('conf_threshold', v, 'conf_threshold')}
                    error={errors['conf_threshold']}
                    step={0.01}
                    min={guardrails.conf_threshold?.min}
                    max={guardrails.conf_threshold?.max}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('conf_threshold', 0.60)} />
                )}
              </SettingRow>

              <SettingRow
                label="Momentum Entry"
                description="Minimum recent price movement required to consider entry."
                guardrail={guardrails.mom_entry_pct}
                value={get('mom_entry_pct', 0.002)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mom_entry_pct}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="mom_entry_pct"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('mom_entry_pct', 0.002)}
                    onChange={(v) => set('mom_entry_pct', v)}
                    onValidate={(v) => validate('mom_entry_pct', v, 'mom_entry_pct')}
                    error={errors['mom_entry_pct']}
                    step={0.0005}
                    min={guardrails.mom_entry_pct?.min}
                    max={guardrails.mom_entry_pct?.max}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('mom_entry_pct', 0.002)} />
                )}
              </SettingRow>

              <SettingRow
                label="Momentum Lookback"
                description="How many 1-minute bars to analyze when measuring momentum."
                guardrail={guardrails.mom_lookback}
                value={get('mom_lookback', 8)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mom_lookback}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="mom_lookback"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('mom_lookback', 8)}
                    onChange={(v) => set('mom_lookback', v)}
                    onValidate={(v) => validate('mom_lookback', v, 'mom_lookback')}
                    error={errors['mom_lookback']}
                    step={1}
                    min={guardrails.mom_lookback?.min}
                    max={guardrails.mom_lookback?.max}
                    suffix="bars"
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('mom_lookback', 8)} bars`} />
                )}
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        {/* Risk Tab - Stop/Take profit, position sizing, exit rules */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Exit Targets"
              subtitle="Define your stop loss and take profit levels. These automatically close positions to protect capital and lock in gains."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12l2 2 4-4"/>
                </svg>
              }
            >
              <SettingRow
                label="Stop Loss"
                description="Maximum allowed loss before the position is automatically closed."
                guardrail={guardrails.stop_loss_pct}
                value={get('stop_loss_pct', 0.01)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.stop_loss_pct}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="stop_loss_pct"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('stop_loss_pct', 0.01)}
                    onChange={(v) => set('stop_loss_pct', v)}
                    onValidate={(v) => validate('stop_loss_pct', v, 'stop_loss_pct')}
                    error={errors['stop_loss_pct']}
                    step={0.001}
                    min={guardrails.stop_loss_pct?.min}
                    max={guardrails.stop_loss_pct?.max}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('stop_loss_pct', 0.01)} />
                )}
              </SettingRow>

              <SettingRow
                label="Take Profit"
                description="Target gain at which the position is automatically closed."
                guardrail={guardrails.take_profit_pct}
                value={get('take_profit_pct', 0.02)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.take_profit_pct}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="take_profit_pct"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('take_profit_pct', 0.02)}
                    onChange={(v) => set('take_profit_pct', v)}
                    onValidate={(v) => validate('take_profit_pct', v, 'take_profit_pct')}
                    error={errors['take_profit_pct']}
                    step={0.001}
                    min={guardrails.take_profit_pct?.min}
                    max={guardrails.take_profit_pct?.max}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('take_profit_pct', 0.02)} />
                )}
              </SettingRow>

              {/* Risk/Reward visual card */}
              <RiskRewardCard
                stopLoss={get('stop_loss_pct', 0.01)}
                takeProfit={get('take_profit_pct', 0.02)}
                colors={colors}
              />
            </SettingsSection>

            <SettingsSection
              title="Position Sizing"
              subtitle="Control how much of your account is at risk on each trade."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              }
            >
              <SettingRow
                label="Risk per Trade"
                description="Maximum percentage of your account that can be lost on a single trade."
                guardrail={guardrails.risk_per_trade_pct}
                value={get('risk_per_trade_pct', 0.005)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.risk_per_trade_pct}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="risk_per_trade_pct"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('risk_per_trade_pct', 0.005)}
                    onChange={(v) => set('risk_per_trade_pct', v)}
                    onValidate={(v) => validate('risk_per_trade_pct', v, 'risk_per_trade_pct')}
                    error={errors['risk_per_trade_pct']}
                    step={0.001}
                    min={guardrails.risk_per_trade_pct?.min}
                    max={guardrails.risk_per_trade_pct?.max}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('risk_per_trade_pct', 0.005)} />
                )}
              </SettingRow>

              <SettingRow
                label="Max Hold Time"
                description="Positions open longer than this will be automatically closed."
                guardrail={guardrails.max_hold_min}
                value={get('max_hold_min', 120)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.max_hold_min}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="max_hold_min"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('max_hold_min', 120)}
                    onChange={(v) => set('max_hold_min', v)}
                    onValidate={(v) => validate('max_hold_min', v, 'max_hold_min')}
                    error={errors['max_hold_min']}
                    step={5}
                    min={guardrails.max_hold_min?.min}
                    max={guardrails.max_hold_min?.max}
                    suffix="min"
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('max_hold_min', 120)} min`} />
                )}
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              title="Market Quality Exit"
              subtitle="Automatically exit positions when market conditions become unfavorable."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            >
              <SettingRow
                label="Quick Reversal Protection"
                description="Exit early if price drops unusually fast (protects against sudden reversals)."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mq_velocity_enabled}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="mq_velocity_enabled"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('mq_velocity_enabled', true)}
                    onChange={(v) => set('mq_velocity_enabled', v)}
                  />
                ) : (
                  <ReadOnlyToggle value={get('mq_velocity_enabled', true)} />
                )}
              </SettingRow>

              {get('mq_velocity_enabled', true) && (
                <SettingRow
                  label="Speed Sensitivity"
                  description="Multiplier threshold for triggering early exit. A value of 2.0 triggers exit when adverse price movement exceeds twice the stock's average volatility rate."
                  colors={colors}
                >
                  {isAdmin ? (
                    <ValidatedNumberInput
                      value={get('mq_velocity_multiplier', 2.0)}
                      onChange={(v) => set('mq_velocity_multiplier', v)}
                      step={0.1}
                      min={1.5}
                      max={5.0}
                      colors={colors}
                    />
                  ) : (
                    <span style={{ fontFamily: 'monospace', color: colors.textPrimary }}>
                      {get('mq_velocity_multiplier', 2.0)}x
                    </span>
                  )}
                </SettingRow>
              )}
            </SettingsSection>

            {/* Trailing Stop Section */}
            <SettingsSection
              title="Trailing Stop"
              subtitle="Lock in gains by moving your stop up as price rises."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              }
            >
              <SettingRow
                label="Trailing Stop"
                description="Activate a break-even stop once trade reaches target profit level."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.trailing_stop_enabled}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="trailing_stop_enabled"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('trailing_stop_enabled', true)}
                    onChange={(v) => set('trailing_stop_enabled', v)}
                  />
                ) : (
                  <ReadOnlyToggle value={get('trailing_stop_enabled', true)} />
                )}
              </SettingRow>

              {get('trailing_stop_enabled', true) && (
                <>
                  <SettingRow
                    label="Activation Point"
                    description="Activates when trade reaches this % of take-profit target."
                    guardrail={guardrails.trailing_stop_activation}
                    value={get('trailing_stop_activation', 0.70)}
                    colors={colors}
                    explanation={SETTING_EXPLANATIONS.trailing_stop_activation}
                    expandedExplanations={expandedExplanations}
                    setExpandedExplanations={setExpandedExplanations}
                    settingKey="trailing_stop_activation"
                  >
                    {isAdmin ? (
                      <ValidatedNumberInput
                        value={get('trailing_stop_activation', 0.70)}
                        onChange={(v) => set('trailing_stop_activation', v)}
                        step={0.05}
                        min={0.30}
                        max={0.95}
                        colors={colors}
                        format={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                    ) : (
                      <span style={{ fontFamily: 'monospace', color: colors.textPrimary }}>
                        {(get('trailing_stop_activation', 0.70) * 100).toFixed(0)}%
                      </span>
                    )}
                  </SettingRow>

                  <SettingRow
                    label="Trail Distance"
                    description="How much gain to give back (1.0 = break-even at entry, 0.5 = lock 50%)."
                    guardrail={guardrails.trailing_stop_distance}
                    value={get('trailing_stop_distance', 1.00)}
                    colors={colors}
                    explanation={SETTING_EXPLANATIONS.trailing_stop_distance}
                    expandedExplanations={expandedExplanations}
                    setExpandedExplanations={setExpandedExplanations}
                    settingKey="trailing_stop_distance"
                  >
                    {isAdmin ? (
                      <ValidatedNumberInput
                        value={get('trailing_stop_distance', 1.00)}
                        onChange={(v) => set('trailing_stop_distance', v)}
                        step={0.1}
                        min={0.00}
                        max={1.00}
                        colors={colors}
                        format={(v) => v === 1 ? 'Break-even' : `Lock ${((1-v) * 100).toFixed(0)}%`}
                      />
                    ) : (
                      <span style={{ fontFamily: 'monospace', color: colors.textPrimary }}>
                        {get('trailing_stop_distance', 1.00) === 1 ? 'Break-even' : `Lock ${((1 - get('trailing_stop_distance', 1.00)) * 100).toFixed(0)}%`}
                      </span>
                    )}
                  </SettingRow>
                </>
              )}
            </SettingsSection>
          </div>
        )}

        {/* Limits Tab - Position and trade limits */}
        {activeTab === 'limits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Daily Limits"
              subtitle="Prevent overtrading by limiting how many times each symbol can be traded per day."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              }
            >
              <SettingRow
                label="Trades per Symbol per Day"
                description="How many times the bot can enter the same ticker in one day."
                guardrail={guardrails.trades_per_ticker_per_day}
                value={get('trades_per_ticker_per_day', 1)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.trades_per_ticker_per_day}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="trades_per_ticker_per_day"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('trades_per_ticker_per_day', 1)}
                    onChange={(v) => set('trades_per_ticker_per_day', v)}
                    onValidate={(v) => validate('trades_per_ticker_per_day', v, 'trades_per_ticker_per_day')}
                    error={errors['trades_per_ticker_per_day']}
                    step={1}
                    min={guardrails.trades_per_ticker_per_day?.min}
                    max={guardrails.trades_per_ticker_per_day?.max}
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={get('trades_per_ticker_per_day', 1)} />
                )}
              </SettingRow>

              <QuickTip text="Limiting to 1-2 trades per symbol prevents revenge trading and overexposure to a single name." colors={colors} />
            </SettingsSection>

            <SettingsSection
              title="Position Limits"
              subtitle="Control your total market exposure by limiting concurrent positions."
              colors={colors}
              icon={TAB_ICONS.limits}
            >
              <SettingRow
                label="Max Open Positions"
                description="Maximum number of positions that can be open at the same time."
                guardrail={guardrails.max_open_positions}
                value={get('max_open_positions', 5)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.max_open_positions}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="max_open_positions"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('max_open_positions', 5)}
                    onChange={(v) => set('max_open_positions', v)}
                    onValidate={(v) => validate('max_open_positions', v, 'max_open_positions')}
                    error={errors['max_open_positions']}
                    step={1}
                    min={guardrails.max_open_positions?.min}
                    max={guardrails.max_open_positions?.max}
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={get('max_open_positions', 5)} />
                )}
              </SettingRow>

              {/* Enhanced visual representation */}
              <PositionCapacityVisual
                maxPositions={get('max_open_positions', 5)}
                riskPerTrade={get('risk_per_trade_pct', 0.005)}
                colors={colors}
              />
            </SettingsSection>
          </div>
        )}

        {/* ORB Strategy Tab */}
        {activeTab === 'orb' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="ORB Strategy Settings"
              subtitle="Opening Range Breakout strategy configuration. Monitors the 5-minute opening range for break and retest setups."
              colors={colors}
              icon={TAB_ICONS.orb}
            >
              <SettingRow
                label="Trading Mode"
                description="Stocks mode uses tighter stops (retest candle) and different timing windows."
                colors={colors}
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ id: true, label: 'Stocks' }, { id: false, label: 'Futures' }].map(mode => (
                      <button
                        key={String(mode.id)}
                        onClick={() => set('orb_stocks_mode', mode.id)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: borderRadius.md,
                          border: `2px solid ${get('orb_stocks_mode', true) === mode.id ? colors.accent : colors.border}`,
                          background: get('orb_stocks_mode', true) === mode.id ? colors.accentDark : 'transparent',
                          color: get('orb_stocks_mode', true) === mode.id ? colors.accent : colors.textMuted,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={get('orb_stocks_mode', true) ? 'Stocks' : 'Futures'} />
                )}
              </SettingRow>

              <SettingRow
                label="LLM Filter"
                description="Use AI to filter out low-quality setups based on market context."
                colors={colors}
              >
                {isAdmin ? (
                  <button
                    onClick={() => set('orb_llm_filter', !get('orb_llm_filter', true))}
                    style={get('orb_llm_filter', true) ? toggleOnStyle : toggleOffStyle}
                  >
                    <span style={{
                      position: 'absolute',
                      left: get('orb_llm_filter', true) ? 'calc(100% - 24px)' : '4px',
                      top: '4px',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s ease',
                    }} />
                  </button>
                ) : (
                  <ReadOnlyValue colors={colors} value={get('orb_llm_filter', true) ? 'Active' : 'Inactive'} />
                )}
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              title="Entry Filters"
              subtitle="Minimum thresholds for entering ORB trades."
              colors={colors}
              icon={TAB_ICONS.entry}
            >
              <SettingRow
                label="Min Displacement Ratio"
                description="Minimum displacement from the opening range before considering a break. Higher values = stronger breaks only."
                colors={colors}
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={get('orb_displacement_min', 1.5)}
                      onChange={(e) => set('orb_displacement_min', parseFloat(e.target.value))}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: colors.textMuted }}>x ATR</span>
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('orb_displacement_min', 1.5)}x ATR`} />
                )}
              </SettingRow>

              <SettingRow
                label="Min Volume Ratio"
                description="Minimum volume compared to average during breakout candle."
                colors={colors}
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={get('orb_volume_min', 1.2)}
                      onChange={(e) => set('orb_volume_min', parseFloat(e.target.value))}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: colors.textMuted }}>x avg</span>
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('orb_volume_min', 1.2)}x avg`} />
                )}
              </SettingRow>

              <SettingRow
                label="Min Confluence Score"
                description="Number of confluence factors that must align (index direction, EMA slope, relative strength, etc.)."
                colors={colors}
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="5"
                      value={get('confluence_min', 2)}
                      onChange={(e) => set('confluence_min', parseInt(e.target.value))}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: colors.textMuted }}>/ 5 factors</span>
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('confluence_min', 2)} / 5 factors`} />
                )}
              </SettingRow>

              <SettingRow
                label="Min Risk/Reward Ratio"
                description="Minimum reward-to-risk ratio required to take an ORB trade."
                colors={colors}
              >
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="1.0"
                      max="5.0"
                      value={get('orb_min_rr_ratio', 2.0)}
                      onChange={(e) => set('orb_min_rr_ratio', parseFloat(e.target.value))}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: colors.textMuted }}>: 1</span>
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('orb_min_rr_ratio', 2.0)} : 1`} />
                )}
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              title="Daily Limits"
              subtitle="Control how many ORB trades can be taken per day."
              colors={colors}
              icon={TAB_ICONS.limits}
            >
              <SettingRow
                label="Max Trades Per Day"
                description="Maximum number of ORB trades allowed per day across all symbols."
                colors={colors}
              >
                {isAdmin ? (
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="10"
                    value={get('orb_max_trades_per_day', 2)}
                    onChange={(e) => set('orb_max_trades_per_day', parseInt(e.target.value))}
                    style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={get('orb_max_trades_per_day', 2)} />
                )}
              </SettingRow>
            </SettingsSection>

            <QuickTip
              text="ORB Strategy trades the 5-minute Opening Range using a Break & Retest pattern. It works best during the first 90 minutes of market open (9:30-11:00 AM EST) when volatility is highest."
              colors={colors}
            />
          </div>
        )}

        {/* LLM Settings Tab - AI decision parameters */}
        {activeTab === 'llm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="LLM Decision Settings"
              subtitle={activeStrategy === 'orb' || activeStrategy === 'momentum'
                ? "These settings are used when no strategy setup is found (fallback mode)."
                : "Primary AI decision parameters for LLM-only trading mode."}
              colors={colors}
              icon={TAB_ICONS.llm}
            >
              <SettingRow
                label="Confidence Threshold"
                description="Minimum AI confidence score required to enter a trade."
                guardrail={guardrails.llm_conf_threshold || guardrails.conf_threshold}
                value={get('llm_conf_threshold', get('conf_threshold', 0.60))}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.conf_threshold}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="llm_conf_threshold"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('llm_conf_threshold', get('conf_threshold', 0.60))}
                    onChange={(v) => set('llm_conf_threshold', v)}
                    onValidate={(v) => validate('llm_conf_threshold', v, 'llm_conf_threshold')}
                    error={errors['llm_conf_threshold']}
                    step={0.01}
                    min={guardrails.llm_conf_threshold?.min || 0.50}
                    max={guardrails.llm_conf_threshold?.max || 0.80}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('llm_conf_threshold', get('conf_threshold', 0.60))} />
                )}
              </SettingRow>

              <SettingRow
                label="Momentum Entry Threshold"
                description="Minimum recent price movement required to consider entry."
                guardrail={guardrails.llm_mom_entry_pct || guardrails.mom_entry_pct}
                value={get('llm_mom_entry_pct', get('mom_entry_pct', 0.002))}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mom_entry_pct}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="llm_mom_entry_pct"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('llm_mom_entry_pct', get('mom_entry_pct', 0.002))}
                    onChange={(v) => set('llm_mom_entry_pct', v)}
                    onValidate={(v) => validate('llm_mom_entry_pct', v, 'llm_mom_entry_pct')}
                    error={errors['llm_mom_entry_pct']}
                    step={0.0005}
                    min={guardrails.llm_mom_entry_pct?.min || 0.001}
                    max={guardrails.llm_mom_entry_pct?.max || 0.01}
                    isPercent
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyPercent colors={colors} value={get('llm_mom_entry_pct', get('mom_entry_pct', 0.002))} />
                )}
              </SettingRow>

              <SettingRow
                label="Momentum Lookback"
                description="How many 1-minute bars to analyze when measuring momentum."
                guardrail={guardrails.llm_mom_lookback || guardrails.mom_lookback}
                value={get('llm_mom_lookback', get('mom_lookback', 8))}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mom_lookback}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="llm_mom_lookback"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('llm_mom_lookback', get('mom_lookback', 8))}
                    onChange={(v) => set('llm_mom_lookback', v)}
                    onValidate={(v) => validate('llm_mom_lookback', v, 'llm_mom_lookback')}
                    error={errors['llm_mom_lookback']}
                    step={1}
                    min={guardrails.llm_mom_lookback?.min || 3}
                    max={guardrails.llm_mom_lookback?.max || 20}
                    suffix="bars"
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('llm_mom_lookback', get('mom_lookback', 8))} bars`} />
                )}
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              title="Trading Symbols"
              subtitle="Select which tickers the bot will analyze and trade."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              }
            >
              {(() => {
                const currentSymbols = get('symbols', 'QQQ,SPY').split(',').map(s => s.trim()).filter(Boolean);

                const handleTickerToggle = (ticker, checked) => {
                  // Get fresh value at click time to avoid stale closure
                  const freshSymbols = get('symbols', 'QQQ,SPY').split(',').map(s => s.trim()).filter(Boolean);
                  let newSymbols;
                  if (checked) {
                    newSymbols = [...freshSymbols, ticker];
                  } else {
                    newSymbols = freshSymbols.filter(s => s !== ticker);
                  }
                  set('symbols', newSymbols.join(','));
                };

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.entries(AVAILABLE_TICKERS).map(([categoryKey, category]) => (
                      <div key={categoryKey}>
                        <div style={{
                          fontSize: fontSize.xs,
                          color: colors.textSecondary,
                          fontWeight: fontWeight.medium,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}>
                          {category.label}
                        </div>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}>
                          {category.tickers.map(ticker => (
                            <TickerCheckbox
                              key={ticker}
                              ticker={ticker}
                              checked={currentSymbols.includes(ticker)}
                              onChange={(checked) => handleTickerToggle(ticker, checked)}
                              disabled={!isAdmin}
                              colors={colors}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SettingsSection>

            {(activeStrategy === 'orb' || activeStrategy === 'momentum') && (
              <QuickTip
                text={`These LLM settings are used as a fallback when ${activeStrategy === 'orb' ? 'ORB' : 'Momentum'} doesn't find a valid setup. The AI will analyze market conditions and make trading decisions based on these parameters.`}
                colors={colors}
              />
            )}

            {(!activeStrategy || activeStrategy === 'llm') && (
              <QuickTip
                text="In LLM-only mode, the AI analyzes price action, EMAs, VWAP, and momentum to generate trading signals. The ML model can veto trades it strongly disagrees with (HOLD probability >= 70%)."
                colors={colors}
              />
            )}
          </div>
        )}

        {/* Safety Tab - Emergency controls and safety fallbacks */}
        {activeTab === 'safety' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Emergency Controls"
              subtitle="Immediately halt all trading activity when needed."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
            >
              <SettingRow
                label="Execute Trades"
                description="When enabled, the bot will actively place trades. Disable to pause all trading."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.execute_trades}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="execute_trades"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('kill_switch', 'off') === 'off'}
                    onChange={(v) => set('kill_switch', v ? 'off' : 'on')}
                  />
                ) : (
                  <ReadOnlyToggle value={get('kill_switch', 'off') === 'off'} />
                )}
              </SettingRow>

              {get('kill_switch', 'off') === 'on' && (
                <div style={{
                  padding: '14px 18px',
                  background: colors.errorDark,
                  border: `1px solid ${colors.error}`,
                  borderRadius: 10,
                  color: colors.error,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Trading is paused</div>
                    <div style={{ opacity: 0.9 }}>No new trades will be placed. Existing positions are not affected.</div>
                  </div>
                </div>
              )}
            </SettingsSection>

            <SettingsSection
              title="Safety Limits"
              subtitle="Fallback protections that apply regardless of strategy. These catch edge cases the ORB strategy may not handle."
              colors={colors}
              icon={TAB_ICONS.risk}
            >
              <SettingRow
                label="Max Hold Time"
                description="Absolute maximum time a position can be held. ORB positions typically exit by 11:15 AM EST, but this provides a safety net."
                guardrail={guardrails.max_hold_min}
                value={get('max_hold_min', 120)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.max_hold_min}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="max_hold_min"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('max_hold_min', 120)}
                    onChange={(v) => set('max_hold_min', v)}
                    onValidate={(v) => validate('max_hold_min', v, 'max_hold_min')}
                    error={errors['max_hold_min']}
                    step={5}
                    min={guardrails.max_hold_min?.min}
                    max={guardrails.max_hold_min?.max}
                    suffix="min"
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('max_hold_min', 120)} min`} />
                )}
              </SettingRow>

              <SettingRow
                label="Max Open Positions"
                description="Maximum concurrent positions at any time. Prevents overexposure if multiple ORB setups trigger simultaneously."
                guardrail={guardrails.max_open_positions}
                value={get('max_open_positions', 5)}
                colors={colors}
                explanation={SETTING_EXPLANATIONS.max_open_positions}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="max_open_positions"
              >
                {isAdmin ? (
                  <ValidatedNumberInput
                    value={get('max_open_positions', 5)}
                    onChange={(v) => set('max_open_positions', v)}
                    onValidate={(v) => validate('max_open_positions', v, 'max_open_positions')}
                    error={errors['max_open_positions']}
                    step={1}
                    min={guardrails.max_open_positions?.min}
                    max={guardrails.max_open_positions?.max}
                    colors={colors}
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={get('max_open_positions', 5)} />
                )}
              </SettingRow>
            </SettingsSection>

            <QuickTip
              text="These safety settings act as fallbacks. The ORB strategy has its own exit rules (11:15 AM deadline, 30-min time exit, 2 consecutive loss halt), but these settings catch any edge cases."
              colors={colors}
            />
          </div>
        )}

        {/* Save Button (admin only) */}
        {isAdmin && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 32,
            padding: '20px 24px',
            background: colors.bgSecondary,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              Changes are saved to your account
            </div>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                ...buttonPrimaryStyle,
                padding: '14px 32px',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? (
                <>
                  <span style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Components

function Toast({ message, type = 'success', onClose, colors = darkTheme }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      borderRadius: borderRadius.md,
      background: type === 'error' ? '#1a0a0a' : colors.accentDark,
      border: `1px solid ${type === 'error' ? colors.error : colors.accentMuted}`,
      color: type === 'error' ? colors.error : colors.accent,
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.3s ease',
      minWidth: 250,
    }}>
      <span style={{ fontSize: 16 }}>{type === 'error' ? '!' : '+'}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: 4,
          opacity: 0.7,
          fontSize: 16,
        }}
      >
        x
      </button>
    </div>
  );
}

function SettingsSection({ title, subtitle, children, colors = darkTheme, icon }) {
  return (
    <div style={{
      ...cardStyle,
      background: colors.bgCard,
      borderColor: colors.border,
      padding: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {icon && (
            <span style={{ color: colors.accent, display: 'flex' }}>
              {icon}
            </span>
          )}
          <span style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>
            {title}
          </span>
        </div>
        {subtitle && (
          <p style={{
            margin: '8px 0 0',
            color: colors.textMuted,
            fontSize: 13,
            lineHeight: 1.5,
            marginLeft: icon ? 26 : 0,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: '8px 24px 24px' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  guardrail,
  value,
  children,
  colors = darkTheme,
  explanation,
  expandedExplanations,
  setExpandedExplanations,
  settingKey,
}) {
  const isExpanded = expandedExplanations?.[settingKey] || false;
  const toggleExpanded = () => {
    if (setExpandedExplanations && settingKey) {
      setExpandedExplanations(prev => ({
        ...prev,
        [settingKey]: !prev[settingKey]
      }));
    }
  };

  return (
    <div style={{
      padding: '16px 0',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontWeight: 600,
            color: colors.textPrimary,
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {label}
            {explanation && (
              <span
                style={{
                  color: colors.textMuted,
                  cursor: 'pointer',
                  opacity: 0.6,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                onClick={toggleExpanded}
                title="Click for more info"
              >
                <InfoIcon size={14} color="currentColor" />
              </span>
            )}
          </div>
          {description && (
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
              {description}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {children}
        </div>
      </div>
      {guardrail && value !== undefined && (
        <div style={{ marginTop: 12 }}>
          <GuardrailHint
            min={guardrail.min}
            max={guardrail.max}
            value={value}
            recommended={guardrail.recommended || guardrail.default}
            isPercent={guardrail.min < 1}
            decimals={guardrail.min < 0.01 ? 2 : 1}
          />
        </div>
      )}
      {explanation && (
        <ExplanationBox
          explanation={explanation}
          isExpanded={isExpanded}
          onToggle={toggleExpanded}
          colors={colors}
        />
      )}
    </div>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        ...(value ? toggleOnStyle : toggleOffStyle),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {value ? 'ON' : 'OFF'}
    </button>
  );
}

function ReadOnlyToggle({ value }) {
  return (
    <div style={{
      ...(value ? toggleOnStyle : toggleOffStyle),
      opacity: 0.7,
      cursor: 'default',
    }}>
      {value ? 'ON' : 'OFF'}
    </div>
  );
}

function TickerCheckbox({ ticker, checked, onChange, disabled, colors = darkTheme }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: checked ? `${colors.accent}15` : colors.bgTertiary,
        border: `1px solid ${checked ? colors.accent : colors.border}`,
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        minWidth: 90,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        style={{
          width: 16,
          height: 16,
          accentColor: colors.accent,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      <span style={{
        color: checked ? colors.accent : colors.textPrimary,
        fontSize: fontSize.sm,
        fontWeight: checked ? fontWeight.medium : fontWeight.normal,
        fontFamily: fontFamily.mono,
      }}>
        {ticker}
      </span>
    </label>
  );
}

function ReadOnlyValue({ value, colors = darkTheme }) {
  return (
    <div style={{
      padding: '8px 16px',
      background: colors.bgTertiary,
      borderRadius: 8,
      color: colors.textPrimary,
      fontSize: fontSize.base,
      minWidth: 80,
      textAlign: 'center',
    }}>
      {value}
    </div>
  );
}

function ReadOnlyPercent({ value, colors = darkTheme }) {
  return (
    <div style={{
      padding: '8px 16px',
      background: colors.bgTertiary,
      borderRadius: 8,
      color: colors.textPrimary,
      fontSize: fontSize.base,
      minWidth: 80,
      textAlign: 'center',
    }}>
      {(value * 100).toFixed(2)}%
    </div>
  );
}

function ValidatedNumberInput({
  value,
  onChange,
  onValidate,
  error,
  step = 1,
  min,
  max,
  suffix = '',
  isPercent = false,
  disabled = false,
  colors = darkTheme,
}) {
  const displayValue = isPercent ? (value * 100).toFixed(2) : value;

  const handleChange = (e) => {
    if (disabled) return;
    const raw = Number(e.target.value);
    const actual = isPercent ? raw / 100 : raw;
    onChange(actual);
    if (onValidate) {
      onValidate(actual);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="number"
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          step={isPercent ? step * 100 : step}
          min={min != null ? (isPercent ? min * 100 : min) : undefined}
          max={max != null ? (isPercent ? max * 100 : max) : undefined}
          style={{
            ...inputStyle,
            width: 90,
            textAlign: 'center',
            borderColor: error ? colors.error : colors.border,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        <span style={{ color: colors.textMuted, fontSize: 13 }}>
          {isPercent ? '%' : suffix}
        </span>
      </div>
      {error && (
        <div style={{ color: colors.error, fontSize: 11, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// Info icon component
function InfoIcon({ size = 14, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

// Expandable explanation box
function ExplanationBox({ explanation, isExpanded, onToggle, colors = darkTheme }) {
  if (!explanation) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          padding: 0,
          color: colors.textMuted,
          fontSize: 12,
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => e.target.style.color = colors.accent}
        onMouseLeave={(e) => e.target.style.color = colors.textMuted}
      >
        <InfoIcon size={14} color="currentColor" />
        <span>{isExpanded ? 'Hide details' : 'Learn more'}</span>
        <span style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          display: 'inline-block',
        }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div style={{
          marginTop: 12,
          padding: 16,
          background: colors.bgTertiary,
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          animation: 'fadeIn 0.2s ease',
        }}>
          {/* Main explanation */}
          <p style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: colors.textSecondary,
          }}>
            {explanation.details}
          </p>

          {/* Impact comparison */}
          {(explanation.lowImpact || explanation.highImpact) && (
            <div style={{
              marginTop: 14,
              display: 'grid',
              gap: 10,
            }}>
              {explanation.lowImpact && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  background: colors.bgSecondary,
                  borderRadius: 8,
                  borderLeft: `3px solid ${colors.warning}`,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" style={{ flexShrink: 0 }}>
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                  </svg>
                  <span style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                    {explanation.lowImpact}
                  </span>
                </div>
              )}
              {explanation.highImpact && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  background: colors.bgSecondary,
                  borderRadius: 8,
                  borderLeft: `3px solid ${colors.info}`,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.info} strokeWidth="2" style={{ flexShrink: 0 }}>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  <span style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                    {explanation.highImpact}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pro tip */}
          {explanation.tip && (
            <div style={{
              marginTop: 14,
              padding: '10px 12px',
              background: colors.accentDark,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M9 18h6"/><path d="M10 22h4"/>
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
              </svg>
              <span style={{ fontSize: 12, color: colors.accent, lineHeight: 1.5, fontWeight: 500 }}>
                {explanation.tip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Quick tip banner component
function QuickTip({ text, colors = darkTheme }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: colors.bgTertiary,
      borderRadius: 8,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 1.6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      borderLeft: `3px solid ${colors.accent}`,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
      <span>{text}</span>
    </div>
  );
}

// Warning banner component
function WarningBanner({ text, colors = darkTheme }) {
  return (
    <div style={{
      padding: '12px 16px',
      background: colors.warningDark,
      borderRadius: 8,
      fontSize: 12,
      color: colors.warning,
      lineHeight: 1.6,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      border: `1px solid rgba(255, 179, 71, 0.3)`,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>{text}</span>
    </div>
  );
}

// Strategy selection card component
function StrategyCard({ id, name, description, color, isActive, disabled, comingSoon, onClick, colors = darkTheme }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '16px 20px',
        background: isActive ? `${color}15` : colors.bgSecondary,
        border: `2px solid ${isActive ? color : colors.border}`,
        borderRadius: 12,
        cursor: disabled ? (comingSoon ? 'default' : 'not-allowed') : 'pointer',
        opacity: disabled && !comingSoon ? 0.5 : 1,
        textAlign: 'left',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      )}

      {/* Coming soon badge */}
      {comingSoon && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          padding: '2px 8px',
          background: colors.bgTertiary,
          borderRadius: 12,
          fontSize: 10,
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Soon
        </div>
      )}

      {/* Strategy name */}
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: isActive ? color : colors.textPrimary,
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {id === 'orb' && '📊'}
        {id === 'momentum' && '📈'}
        {id === 'llm' && '🤖'}
        {name}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 1.4,
      }}>
        {description}
      </div>
    </button>
  );
}

// Position capacity visualization
function PositionCapacityVisual({ maxPositions, riskPerTrade, colors = darkTheme }) {
  const totalRisk = maxPositions * riskPerTrade * 100;

  return (
    <div style={{
      padding: '20px',
      background: colors.bgTertiary,
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      marginTop: 8,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>
          Position Slots
        </span>
        <span style={{
          fontSize: 12,
          color: colors.textSecondary,
          background: colors.bgSecondary,
          padding: '4px 10px',
          borderRadius: 12,
        }}>
          Max risk: <span style={{ color: totalRisk > 5 ? colors.warning : colors.accent, fontWeight: 600 }}>{totalRisk.toFixed(1)}%</span>
        </span>
      </div>

      {/* Visual slots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
      }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < maxPositions;
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1',
                borderRadius: 8,
                background: isActive
                  ? `${colors.accent}15`
                  : colors.bgSecondary,
                border: `2px solid ${isActive ? colors.accent : colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                opacity: isActive ? 1 : 0.4,
              }}
            >
              <span style={{
                fontSize: 16,
                fontWeight: 700,
                color: isActive ? colors.accent : colors.textMuted,
              }}>
                {i + 1}
              </span>
              {isActive && (
                <span style={{
                  fontSize: 9,
                  color: colors.accent,
                  opacity: 0.8,
                  marginTop: 2,
                }}>
                  {(riskPerTrade * 100).toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: `1px solid ${colors.border}`,
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 1.6,
      }}>
        With {maxPositions} positions at {(riskPerTrade * 100).toFixed(1)}% risk each, your maximum total exposure is{' '}
        <strong style={{ color: totalRisk > 5 ? colors.warning : colors.textPrimary }}>{totalRisk.toFixed(1)}%</strong>{' '}
        of your account.
      </div>
    </div>
  );
}

// Risk/Reward visualization card
function RiskRewardCard({ stopLoss, takeProfit, colors = darkTheme }) {
  const ratio = takeProfit / stopLoss;
  const isGoodRatio = ratio >= 1.5;
  const isGreatRatio = ratio >= 2;

  return (
    <div style={{
      padding: '20px',
      background: colors.bgTertiary,
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      marginTop: 8,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>
          Risk/Reward Analysis
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: isGreatRatio ? colors.successDark : isGoodRatio ? colors.warningDark : colors.errorDark,
          borderRadius: 20,
          border: `1px solid ${isGreatRatio ? colors.success : isGoodRatio ? colors.warning : colors.error}40`,
        }}>
          <span style={{ fontSize: 12, color: isGreatRatio ? colors.success : isGoodRatio ? colors.warning : colors.error }}>{isGreatRatio ? '✓' : isGoodRatio ? '~' : '!'}</span>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: fontFamily.mono,
            color: isGreatRatio ? colors.success : isGoodRatio ? colors.warning : colors.error,
          }}>
            1:{ratio.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Visual bar */}
      <div style={{
        display: 'flex',
        height: 40,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        {/* Stop loss (left - red) - solid background */}
        <div style={{
          flex: 1,
          background: `${colors.error}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: `2px solid ${colors.bgSecondary}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.error, opacity: 0.8 }}>RISK</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.error, fontFamily: fontFamily.mono }}>
              -{(stopLoss * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Take profit (right - green) - solid background */}
        <div style={{
          flex: ratio,
          background: `${colors.success}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.success, opacity: 0.8 }}>REWARD</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.success, fontFamily: fontFamily.mono }}>
              +{(takeProfit * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        fontSize: 12,
        color: colors.textMuted,
        lineHeight: 1.5,
      }}>
        {isGreatRatio ? (
          <span style={{ color: colors.textSecondary }}>
            <strong style={{ color: colors.success }}>Excellent ratio.</strong> You need to win just {Math.round(100 / (ratio + 1))}% of trades to break even.
          </span>
        ) : isGoodRatio ? (
          <span style={{ color: colors.textSecondary }}>
            <strong style={{ color: colors.warning }}>Acceptable ratio.</strong> Consider increasing take profit for better risk-adjusted returns.
          </span>
        ) : (
          <span style={{ color: colors.textSecondary }}>
            <strong style={{ color: colors.error }}>Low ratio.</strong> You need to win over {Math.round(100 / (ratio + 1))}% of trades to be profitable. Consider widening take profit or tightening stop loss.
          </span>
        )}
      </div>
    </div>
  );
}
