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
import {
  colors,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
  fontSize,
  fontWeight,
  transitions,
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

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'safety', label: 'Safety' },
  { id: 'trading', label: 'Trading' },
  { id: 'risk', label: 'Risk' },
  { id: 'limits', label: 'Limits' },
  { id: 'strategy', label: 'Strategy' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
      // Admin saves to system settings, regular users save to their personal settings
      const res = isAdmin
        ? await saveSettings(settings)  // System-wide settings
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
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(ts => ts.filter(x => x.id !== t.id))} />
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

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? colors.bgCard : 'transparent',
              border: `1px solid ${activeTab === tab.id ? colors.border : 'transparent'}`,
              borderBottom: activeTab === tab.id ? `1px solid ${colors.bgCard}` : 'none',
              borderRadius: `${borderRadius.md}px ${borderRadius.md}px 0 0`,
              color: activeTab === tab.id ? colors.accent : colors.textMuted,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={cardStyle}>
            <div style={{
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary }}>
                Trading Profile
              </span>
              <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
                {isAdmin ? 'Choose a preset or customize your own settings' : 'Your active trading profile'}
              </p>
            </div>

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
                    Using a preset. Select "Custom" to modify individual values.
                  </div>
                )}
              </>
            ) : (
              <SettingRow label="Current Preset" description="Your active trading profile">
                <ReadOnlyValue value={currentPreset ? currentPreset.name : 'Custom'} />
              </SettingRow>
            )}
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <SettingsSection title="Safety">
            <SettingRow label="Kill Switch" description="When ON, all trading is blocked">
              {isAdmin ? (
                <Toggle
                  value={get('kill_switch', 'off') === 'on'}
                  onChange={(v) => set('kill_switch', v ? 'on' : 'off')}
                  disabled={isPresetMode}
                />
              ) : (
                <ReadOnlyToggle value={get('kill_switch', 'off') === 'on'} />
              )}
            </SettingRow>

            <SettingRow label="Mode" description="Paper trading or live trading">
              {isAdmin ? (
                <select
                  value={get('mode', 'paper')}
                  onChange={(e) => set('mode', e.target.value)}
                  disabled={isPresetMode}
                  style={{
                    ...inputStyle,
                    width: 'auto',
                    minWidth: 120,
                    opacity: isPresetMode ? 0.5 : 1,
                    cursor: isPresetMode ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="paper">Paper</option>
                  <option value="live">Live</option>
                </select>
              ) : (
                <ReadOnlyValue value={get('mode', 'paper') === 'paper' ? 'Paper' : 'Live'} />
              )}
            </SettingRow>
          </SettingsSection>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <SettingsSection title="Trading">
            <SettingRow label="Symbols" description="Comma-separated list of symbols to trade">
              {isAdmin ? (
                <input
                  type="text"
                  value={get('symbols', 'QQQ,SPY')}
                  onChange={(e) => set('symbols', e.target.value)}
                  disabled={isPresetMode}
                  style={{
                    ...inputStyle,
                    opacity: isPresetMode ? 0.5 : 1,
                    cursor: isPresetMode ? 'not-allowed' : 'text',
                  }}
                  placeholder="QQQ,SPY"
                />
              ) : (
                <ReadOnlyValue value={get('symbols', 'QQQ,SPY')} />
              )}
            </SettingRow>

            <SettingRow label="Trading Window" description="Time window for trading (PST)">
              {isAdmin ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={get('trading_window_start', '06:30')}
                    onChange={(e) => set('trading_window_start', e.target.value)}
                    disabled={isPresetMode}
                    style={{
                      ...inputStyle,
                      width: 80,
                      textAlign: 'center',
                      opacity: isPresetMode ? 0.5 : 1,
                    }}
                  />
                  <span style={{ color: colors.textMuted }}>to</span>
                  <input
                    type="text"
                    value={get('trading_window_end', '10:30')}
                    onChange={(e) => set('trading_window_end', e.target.value)}
                    disabled={isPresetMode}
                    style={{
                      ...inputStyle,
                      width: 80,
                      textAlign: 'center',
                      opacity: isPresetMode ? 0.5 : 1,
                    }}
                  />
                </div>
              ) : (
                <ReadOnlyValue value={`${get('trading_window_start', '06:30')} - ${get('trading_window_end', '10:30')}`} />
              )}
            </SettingRow>

            <SettingRow
              label="Confidence Threshold"
              description="Minimum confidence to enter a trade"
              guardrail={guardrails.conf_threshold}
              value={get('conf_threshold', 0.60)}
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
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('conf_threshold', 0.60)} />
              )}
            </SettingRow>
          </SettingsSection>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <SettingsSection title="Risk Management">
            <SettingRow
              label="Stop Loss %"
              description="Percentage loss to trigger stop loss"
              guardrail={guardrails.stop_loss_pct}
              value={get('stop_loss_pct', 0.01)}
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
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('stop_loss_pct', 0.01)} />
              )}
            </SettingRow>

            <SettingRow
              label="Take Profit %"
              description="Percentage gain to trigger take profit"
              guardrail={guardrails.take_profit_pct}
              value={get('take_profit_pct', 0.02)}
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
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('take_profit_pct', 0.02)} />
              )}
            </SettingRow>

            <SettingRow
              label="Risk per Trade %"
              description="Percentage of account to risk per trade"
              guardrail={guardrails.risk_per_trade_pct}
              value={get('risk_per_trade_pct', 0.005)}
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
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('risk_per_trade_pct', 0.005)} />
              )}
            </SettingRow>

            <SettingRow
              label="Max Hold (minutes)"
              description="Maximum time to hold a position"
              guardrail={guardrails.max_hold_min}
              value={get('max_hold_min', 120)}
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
                  disabled={isPresetMode}
                  suffix="min"
                />
              ) : (
                <ReadOnlyValue value={`${get('max_hold_min', 120)} min`} />
              )}
            </SettingRow>

            <SettingRow label="MQ Exit Enabled" description="Exit early when market quality degrades">
              {isAdmin ? (
                <Toggle
                  value={get('mq_exit_enabled', true)}
                  onChange={(v) => set('mq_exit_enabled', v)}
                  disabled={isPresetMode}
                />
              ) : (
                <ReadOnlyToggle value={get('mq_exit_enabled', true)} />
              )}
            </SettingRow>

            <SettingRow label="MQ Exit Threshold %" description="Min unrealized loss to trigger mq_exit">
              {isAdmin ? (
                <ValidatedNumberInput
                  value={get('mq_exit_loss_threshold', 0.001)}
                  onChange={(v) => set('mq_exit_loss_threshold', v)}
                  step={0.0001}
                  min={0}
                  max={0.01}
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('mq_exit_loss_threshold', 0.001)} />
              )}
            </SettingRow>
          </SettingsSection>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <SettingsSection title="Execution Limits">
            <SettingRow
              label="Trades per Ticker per Day"
              description="Maximum trades per symbol per day"
              guardrail={guardrails.trades_per_ticker_per_day}
              value={get('trades_per_ticker_per_day', 1)}
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
                  disabled={isPresetMode}
                />
              ) : (
                <ReadOnlyValue value={get('trades_per_ticker_per_day', 1)} />
              )}
            </SettingRow>

            <SettingRow
              label="Max Open Positions"
              description="Maximum concurrent open positions"
              guardrail={guardrails.max_open_positions}
              value={get('max_open_positions', 5)}
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
                  disabled={isPresetMode}
                />
              ) : (
                <ReadOnlyValue value={get('max_open_positions', 5)} />
              )}
            </SettingRow>
          </SettingsSection>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <SettingsSection title="Strategy Tuning">
            <SettingRow
              label="Momentum Entry %"
              description="Minimum momentum to trigger entry override"
              guardrail={guardrails.mom_entry_pct}
              value={get('mom_entry_pct', 0.002)}
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
                  disabled={isPresetMode}
                  isPercent
                />
              ) : (
                <ReadOnlyPercent value={get('mom_entry_pct', 0.002)} />
              )}
            </SettingRow>

            <SettingRow
              label="Momentum Lookback"
              description="Number of bars to calculate momentum"
              guardrail={guardrails.mom_lookback}
              value={get('mom_lookback', 8)}
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
                  disabled={isPresetMode}
                  suffix="bars"
                />
              ) : (
                <ReadOnlyValue value={`${get('mom_lookback', 8)} bars`} />
              )}
            </SettingRow>
          </SettingsSection>
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

function Toast({ message, type = 'success', onClose }) {
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

function SettingsSection({ title, children }) {
  return (
    <div style={cardStyle}>
      <div style={{
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, guardrail, value, children }) {
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

function ReadOnlyValue({ value }) {
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

function ReadOnlyPercent({ value }) {
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
