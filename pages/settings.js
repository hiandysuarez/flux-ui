// pages/settings.js - Dark Luxe Settings UI
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PresetSelector from '../components/PresetSelector';
import GuardrailHint from '../components/GuardrailHint';
import {
  fetchUserSettings, saveUserSettings, fetchPresets, applyPreset, fetchGuardrails,
  fetchSettings, saveSettings
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

// Guardrails for display
const DEFAULT_GUARDRAILS = {
  conf_threshold: { min: 0.50, max: 0.80, default: 0.60, recommended: 0.60 },
  trades_per_ticker_per_day: { min: 1, max: 3, default: 1, recommended: 1 },
  max_open_positions: { min: 1, max: 10, default: 5, recommended: 5 },
  stop_loss_pct: { min: 0.005, max: 0.03, default: 0.01, recommended: 0.01 },
  take_profit_pct: { min: 0.005, max: 0.05, default: 0.02, recommended: 0.02 },
  risk_per_trade_pct: { min: 0.001, max: 0.01, default: 0.005, recommended: 0.005 },
  max_hold_min: { min: 15, max: 390, default: 120, recommended: 120 },
  mom_entry_pct: { min: 0.001, max: 0.01, default: 0.002, recommended: 0.002 },
  mom_lookback: { min: 3, max: 20, default: 8, recommended: 8 },
};

// Detailed explanations for each setting
const SETTING_EXPLANATIONS = {
  mode: {
    title: 'Trading Mode',
    description: 'Controls whether trades use real money or are simulated.',
    details: 'Paper mode simulates trades without risking real capital - perfect for testing strategies. Live mode executes real trades through your connected broker account.',
    tip: 'Always test new strategies in Paper mode first.',
  },
  kill_switch: {
    title: 'Kill Switch',
    description: 'Emergency stop for all trading activity.',
    details: 'When enabled, the bot will immediately stop placing new trades and won\'t enter any positions. Existing positions are NOT automatically closed.',
    tip: 'Use this if you need to pause trading quickly without closing positions.',
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
    title: 'Max Hold Time',
    description: 'Maximum duration before forcing an exit.',
    details: 'Positions held longer than this will be automatically closed, regardless of profit or loss. Prevents capital from being tied up in stagnant trades.',
    lowImpact: 'Shorter (15-30 min): Forces quick decisions, avoids holding losers.',
    highImpact: 'Longer (2-4 hours): Gives trades time to work, but ties up capital.',
    tip: 'For day trading, 60-120 minutes usually provides enough time for a move.',
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
    title: 'Max Open Positions',
    description: 'Maximum concurrent positions at any time.',
    details: 'Limits total exposure. With 5 max positions and 0.5% risk each, your max portfolio risk is 2.5%. Diversification reduces single-stock risk.',
    lowImpact: 'Fewer (1-3): Concentrated bets, higher conviction required.',
    highImpact: 'More (5-10): Diversified exposure, but diluted focus.',
    tip: 'Match your position count to your ability to monitor trades.',
  },
  mq_exit_enabled: {
    title: 'Market Quality Exit',
    description: 'Automatically exit when market conditions deteriorate.',
    details: 'Monitors spread width, volume, and volatility. If conditions become unfavorable (wide spreads, low volume), triggers early exit to avoid slippage.',
    tip: 'Recommended to leave ON - protects you during sudden liquidity drops.',
  },
  symbols: {
    title: 'Trading Symbols',
    description: 'Which tickers the bot is allowed to trade.',
    details: 'Comma-separated list of stock symbols. The bot will only analyze and trade these tickers. Stick to liquid, well-known names for best execution.',
    tip: 'QQQ and SPY are popular for their liquidity and tight spreads.',
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
};

// Consolidated tabs for cleaner organization
const TABS = [
  { id: 'profile', label: 'Profile', icon: TAB_ICONS.profile },
  { id: 'schedule', label: 'Schedule', icon: TAB_ICONS.schedule },
  { id: 'entry', label: 'Entry Rules', icon: TAB_ICONS.entry },
  { id: 'risk', label: 'Risk', icon: TAB_ICONS.risk },
  { id: 'limits', label: 'Limits', icon: TAB_ICONS.limits },
];

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

  // Check if user is admin
  const isAdmin = user?.id && ADMIN_USER_ID && user.id === ADMIN_USER_ID;

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

      const userIsAdmin = user.id && ADMIN_USER_ID && user.id === ADMIN_USER_ID;

      try {
        // Admin loads system settings, regular users load their personal settings
        const settingsPromise = userIsAdmin
          ? fetchSettings()  // System-wide settings (env vars / app_settings)
          : fetchUserSettings();  // Per-user settings

        const [settingsRes, presetsRes, guardrailsRes] = await Promise.all([
          settingsPromise,
          fetchPresets(),
          fetchGuardrails().catch(() => ({ ok: true, guardrails: DEFAULT_GUARDRAILS })),
        ]);

        if (settingsRes.ok && settingsRes.settings) {
          setSettings(settingsRes.settings);
        } else if (settingsRes.settings) {
          // fetchSettings returns { settings: {...} } directly
          setSettings(settingsRes.settings);
        } else if (!userIsAdmin && settingsRes.error === 'no_settings') {
          // User hasn't completed onboarding - redirect them
          router.push('/onboarding');
          return;
        }

        if (presetsRes.ok && presetsRes.presets) {
          setPresets(presetsRes.presets);
        }

        if (guardrailsRes.ok && guardrailsRes.guardrails) {
          setGuardrails(guardrailsRes.guardrails);
        }
      } catch (e) {
        addToast(String(e?.message || e), 'error');
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
    if (!isAdmin) return; // Only admin can edit
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

  // Handle preset selection (admin only)
  const handlePresetSelect = async (presetId) => {
    if (!isAdmin) return;

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
    if (!isAdmin) return;

    if (Object.values(errors).some(e => e)) {
      addToast('Please fix validation errors', 'error');
      return;
    }

    setSaving(true);
    try {
      let payload = settings;

      // Admin saves to system settings - filter out user-specific fields
      // that don't exist in app_settings table
      if (isAdmin) {
        const { preset_id, user_id, theme, created_at, ...systemSettings } = settings;
        payload = systemSettings;
      }

      const res = isAdmin
        ? await saveSettings(payload)  // System-wide settings
        : await saveUserSettings(settings);  // Per-user settings

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

  // Find current preset name
  const currentPreset = presets.find(p => p.id === settings?.preset_id);
  const isPresetMode = settings?.preset_id !== null && settings?.preset_id !== undefined;

  if (authLoading || !settings) {
    return (
      <Layout active="settings">
        <div style={{ color: colors.textMuted }}>Loading settings...</div>
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

      {/* Read-only banner (non-admin only) */}
      {!isAdmin && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 8,
          color: '#3b82f6',
          fontSize: 13,
          marginBottom: 24,
        }}>
          Settings are view-only. Contact support to make changes.
        </div>
      )}

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
                    selected={settings.preset_id}
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
                        <span style={{ fontSize: 14 }}>{mode === 'paper' ? '📄' : '💰'}</span>
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
                label="Kill Switch"
                description="When enabled, the bot will not enter any new positions."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.kill_switch}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="kill_switch"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('kill_switch', 'off') === 'on'}
                    onChange={(v) => set('kill_switch', v ? 'on' : 'off')}
                  />
                ) : (
                  <ReadOnlyToggle value={get('kill_switch', 'off') === 'on'} />
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

        {/* Entry Rules Tab - Confidence, Momentum, Symbols */}
        {activeTab === 'entry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection
              title="Symbols"
              subtitle="Define which tickers the bot will analyze and trade."
              colors={colors}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              }
            >
              <SettingRow
                label="Trading Symbols"
                description="Enter stock symbols separated by commas. Only highly liquid ETFs and stocks are recommended."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.symbols}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="symbols"
              >
                {isAdmin ? (
                  <input
                    type="text"
                    value={get('symbols', 'QQQ,SPY')}
                    onChange={(e) => set('symbols', e.target.value)}
                    style={{
                      ...inputStyle,
                      maxWidth: 200,
                    }}
                    placeholder="QQQ,SPY"
                  />
                ) : (
                  <ReadOnlyValue colors={colors} value={get('symbols', 'QQQ,SPY')} />
                )}
              </SettingRow>
            </SettingsSection>

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
                label="MQ Exit Enabled"
                description="When enabled, positions may be closed early if liquidity drops or spreads widen."
                colors={colors}
                explanation={SETTING_EXPLANATIONS.mq_exit_enabled}
                expandedExplanations={expandedExplanations}
                setExpandedExplanations={setExpandedExplanations}
                settingKey="mq_exit_enabled"
              >
                {isAdmin ? (
                  <Toggle
                    value={get('mq_exit_enabled', true)}
                    onChange={(v) => set('mq_exit_enabled', v)}
                  />
                ) : (
                  <ReadOnlyToggle value={get('mq_exit_enabled', true)} />
                )}
              </SettingRow>

              {get('mq_exit_enabled', true) && (
                <SettingRow
                  label="MQ Loss Threshold"
                  description="MQ exit only triggers if position is already at this loss level."
                  colors={colors}
                >
                  {isAdmin ? (
                    <ValidatedNumberInput
                      value={get('mq_exit_loss_threshold', 0.001)}
                      onChange={(v) => set('mq_exit_loss_threshold', v)}
                      step={0.0001}
                      min={0}
                      max={0.01}
                      isPercent
                      colors={colors}
                    />
                  ) : (
                    <ReadOnlyPercent colors={colors} value={get('mq_exit_loss_threshold', 0.001)} />
                  )}
                </SettingRow>
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
