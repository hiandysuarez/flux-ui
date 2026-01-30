// pages/settings.js - Settings with admin edit access
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import PresetSelector from '../components/PresetSelector';
import GuardrailHint from '../components/GuardrailHint';
import {
  fetchUserSettings, saveUserSettings, fetchPresets, applyPreset, fetchGuardrails,
  fetchSettings, saveSettings  // Admin uses these (system-wide settings)
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/themeContext';
import {
  darkTheme,
  lightTheme,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
  fontSize,
  fontWeight,
  transitions,
  getGlassStyle,
  getVisualEffects,
  shadows,
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

// Consolidated tabs for cleaner organization
const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'entry', label: 'Entry Rules' },
  { id: 'risk', label: 'Risk' },
  { id: 'limits', label: 'Limits' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Get theme-aware colors
  const colors = theme === 'light' ? lightTheme : darkTheme;
  const glassStyle = getGlassStyle(theme);

  const [settings, setSettings] = useState(null);
  const [presets, setPresets] = useState([]);
  const [guardrails, setGuardrails] = useState(DEFAULT_GUARDRAILS);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [toasts, setToasts] = useState([]);
  const [errors, setErrors] = useState({});

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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Settings
          {isAdmin && (
            <span style={{
              marginLeft: 12,
              fontSize: 12,
              padding: '4px 8px',
              background: colors.accentDark,
              color: colors.accent,
              borderRadius: 4,
              fontWeight: 600,
            }}>
              ADMIN
            </span>
          )}
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          {isAdmin ? 'Configure your trading parameters and risk management' : 'View your trading parameters and risk management'}
        </p>
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
        gap: 8,
        marginBottom: 24,
        padding: 6,
        background: colors.bgSecondary,
        borderRadius: borderRadius.lg,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
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
              gap: 6,
              boxShadow: activeTab === tab.id ? shadows.sm : 'none',
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Profile Tab - Preset selection + Mode */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Trading Profile Card */}
            <SettingsSection title="Trading Profile" subtitle="Choose a preset or customize your own settings" colors={colors}>
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
                      padding: '12px 16px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: 8,
                      color: '#3b82f6',
                      fontSize: 13,
                    }}>
                      Using <strong>{currentPreset?.name || 'preset'}</strong> profile. Editing any setting will switch to Custom mode.
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
            <SettingsSection title="Trading Mode" subtitle="Paper trading is recommended for testing" colors={colors}>
              <SettingRow label="Mode" description="Paper trades are simulated, Live trades use real money" colors={colors}>
                {isAdmin ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['paper', 'live'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => set('mode', mode)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: borderRadius.md,
                          border: `1px solid ${get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.border}`,
                          background: get('mode', 'paper') === mode ? (mode === 'live' ? colors.errorDark : colors.accentDark) : 'transparent',
                          color: get('mode', 'paper') === mode ? (mode === 'live' ? colors.error : colors.accent) : colors.textMuted,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
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
            </SettingsSection>

            {/* Theme */}
            <SettingsSection title="Appearance" subtitle="Customize how Flux looks" colors={colors}>
              <SettingRow label="Theme" description="Choose between light and dark mode" colors={colors}>
                <ThemeToggle theme={theme} onToggle={toggleTheme} colors={colors} />
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        {/* Schedule Tab - Trading window + Kill switch */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Trading Window" subtitle="When the bot is allowed to trade (PST timezone)" colors={colors}>
              <SettingRow label="Active Hours" description="Trades will only be placed during this window" colors={colors}>
                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={get('trading_window_start', '06:30')}
                      onChange={(e) => set('trading_window_start', e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 100,
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ color: colors.textMuted, fontSize: 13 }}>to</span>
                    <input
                      type="time"
                      value={get('trading_window_end', '10:30')}
                      onChange={(e) => set('trading_window_end', e.target.value)}
                      style={{
                        ...inputStyle,
                        width: 100,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                ) : (
                  <ReadOnlyValue colors={colors} value={`${get('trading_window_start', '06:30')} - ${get('trading_window_end', '10:30')}`} />
                )}
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Emergency Controls" subtitle="Stop trading immediately if needed" colors={colors}>
              <SettingRow label="Kill Switch" description="When ON, all trading is immediately blocked" colors={colors}>
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
                  padding: '12px 16px',
                  background: colors.errorDark,
                  border: `1px solid ${colors.error}`,
                  borderRadius: 8,
                  color: colors.error,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  Trading is currently disabled. Turn off kill switch to resume.
                </div>
              )}
            </SettingsSection>
          </div>
        )}

        {/* Entry Rules Tab - Confidence, Momentum, Symbols */}
        {activeTab === 'entry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Symbols" subtitle="Which tickers to trade" colors={colors}>
              <SettingRow label="Trading Symbols" description="Comma-separated list of symbols" colors={colors}>
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

            <SettingsSection title="Entry Conditions" subtitle="Requirements for opening a position" colors={colors}>
              <SettingRow
                label="Confidence Threshold"
                description="Minimum AI confidence to enter a trade"
                guardrail={guardrails.conf_threshold}
                value={get('conf_threshold', 0.60)}
                colors={colors}
                theme={theme}
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
                label="Momentum Entry %"
                description="Minimum price momentum to trigger entry"
                guardrail={guardrails.mom_entry_pct}
                value={get('mom_entry_pct', 0.002)}
                colors={colors}
                theme={theme}
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
                description="Number of 1-minute bars to calculate momentum"
                guardrail={guardrails.mom_lookback}
                value={get('mom_lookback', 8)}
                colors={colors}
                theme={theme}
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

              {/* Lookback explanation */}
              <div style={{
                padding: '12px 16px',
                background: colors.bgTertiary,
                borderRadius: 8,
                fontSize: 12,
                color: colors.textSecondary,
                lineHeight: 1.5,
              }}>
                <strong style={{ color: colors.textPrimary }}>How lookback affects signals:</strong>
                <br />
                Lower values (3-5) = More signals, more noise, faster reactions
                <br />
                Higher values (12-20) = Fewer signals, more confidence, slower reactions
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Risk Tab - Stop/Take profit, position sizing, exit rules */}
        {activeTab === 'risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SettingsSection title="Exit Targets" subtitle="When to close positions" colors={colors}>
              <SettingRow
                label="Stop Loss %"
                description="Exit when position loses this much"
                guardrail={guardrails.stop_loss_pct}
                value={get('stop_loss_pct', 0.01)}
                colors={colors}
                theme={theme}
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
                label="Take Profit %"
                description="Exit when position gains this much"
                guardrail={guardrails.take_profit_pct}
                value={get('take_profit_pct', 0.02)}
                colors={colors}
                theme={theme}
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

              {/* Risk/Reward visual */}
              <div style={{
                padding: '12px 16px',
                background: colors.bgTertiary,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 12, color: colors.textMuted }}>Risk/Reward Ratio</span>
                <span style={{
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  color: (get('take_profit_pct', 0.02) / get('stop_loss_pct', 0.01)) >= 2 ? colors.accent : colors.warning,
                }}>
                  1:{(get('take_profit_pct', 0.02) / get('stop_loss_pct', 0.01)).toFixed(1)}
                </span>
              </div>
            </SettingsSection>

            <SettingsSection title="Position Sizing" subtitle="How much to risk per trade" colors={colors}>
              <SettingRow
                label="Risk per Trade %"
                description="Maximum account percentage at risk per trade"
                guardrail={guardrails.risk_per_trade_pct}
                value={get('risk_per_trade_pct', 0.005)}
                colors={colors}
                theme={theme}
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
                description="Force exit after this duration"
                guardrail={guardrails.max_hold_min}
                value={get('max_hold_min', 120)}
                colors={colors}
                theme={theme}
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

            <SettingsSection title="Market Quality Exit" subtitle="Exit early when conditions degrade" colors={colors}>
              <SettingRow label="MQ Exit Enabled" description="Automatically exit if market quality drops" colors={colors}>
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
                <SettingRow label="MQ Loss Threshold" description="Minimum loss before MQ exit triggers" colors={colors}>
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
            <SettingsSection title="Daily Limits" subtitle="Prevent overtrading" colors={colors}>
              <SettingRow
                label="Trades per Symbol per Day"
                description="Maximum entries per ticker per day"
                guardrail={guardrails.trades_per_ticker_per_day}
                value={get('trades_per_ticker_per_day', 1)}
                colors={colors}
                theme={theme}
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
            </SettingsSection>

            <SettingsSection title="Position Limits" subtitle="Control exposure" colors={colors}>
              <SettingRow
                label="Max Open Positions"
                description="Maximum concurrent positions at any time"
                guardrail={guardrails.max_open_positions}
                value={get('max_open_positions', 5)}
                colors={colors}
                theme={theme}
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

              {/* Visual representation */}
              <div style={{
                padding: '16px',
                background: colors.bgTertiary,
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>
                  Position capacity
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        background: i < get('max_open_positions', 5) ? colors.accentDark : colors.bgSecondary,
                        border: `1px solid ${i < get('max_open_positions', 5) ? colors.accent : colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: i < get('max_open_positions', 5) ? colors.accent : colors.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Save Button (admin only) */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                ...buttonPrimaryStyle,
                padding: '12px 24px',
                fontSize: 14,
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
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

function SettingsSection({ title, subtitle, children, colors = darkTheme }) {
  return (
    <div style={{
      ...cardStyle,
      background: colors.bgCard,
      borderColor: colors.border,
    }}>
      <div style={{
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary }}>
          {title}
        </span>
        {subtitle && (
          <p style={{ margin: '6px 0 0', color: colors.textMuted, fontSize: 13 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ display: 'grid', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, guardrail, value, children, colors = darkTheme, theme = 'dark' }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
            {label}
          </div>
          {description && (
            <div style={{ fontSize: 12, color: colors.textMuted }}>
              {description}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>
          {children}
        </div>
      </div>
      {guardrail && value !== undefined && (
        <GuardrailHint
          min={guardrail.min}
          max={guardrail.max}
          value={value}
          recommended={guardrail.recommended || guardrail.default}
          isPercent={guardrail.min < 1}
          decimals={guardrail.min < 0.01 ? 2 : 1}
          theme={theme}
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

function ThemeToggle({ theme, onToggle, colors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Sun icon */}
      <span style={{
        fontSize: 18,
        opacity: theme === 'light' ? 1 : 0.4,
        transition: 'opacity 0.2s ease',
      }}>
        ☀️
      </span>

      {/* Toggle switch */}
      <button
        onClick={onToggle}
        style={{
          position: 'relative',
          width: 56,
          height: 28,
          borderRadius: 14,
          background: theme === 'dark' ? colors.accent : colors.bgTertiary,
          border: `1px solid ${theme === 'dark' ? colors.accentMuted : colors.border}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          padding: 0,
        }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: theme === 'dark' ? 30 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: theme === 'dark' ? colors.bgPrimary : colors.textMuted,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }} />
      </button>

      {/* Moon icon */}
      <span style={{
        fontSize: 18,
        opacity: theme === 'dark' ? 1 : 0.4,
        transition: 'opacity 0.2s ease',
      }}>
        🌙
      </span>
    </div>
  );
}
