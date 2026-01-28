// pages/settings.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchSettings, saveSettings } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  buttonStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
  fontFamily,
  fontSize,
  fontWeight,
  shadows,
  spacing,
  transitions,
} from '../lib/theme';

// Default values for reset functionality
const DEFAULTS = {
  safety: {
    kill_switch: 'off',
    mode: 'paper',
  },
  trading: {
    symbols: 'QQQ,AMD,NVDA,AMZN',
    trading_window_start: '06:30',
    trading_window_end: '10:30',
    thresholds: { conf_threshold: 0.55 },
  },
  risk: {
    risk: {
      stop_loss_pct: 0.01,
      take_profit_pct: 0.02,
      risk_per_trade_pct: 0.005,
      max_hold_min: 120,
    },
  },
  limits: {
    limits: {
      trades_per_ticker_per_day: 1,
      max_open_positions: 5,
    },
  },
  strategy: {
    strategy: {
      mom_entry_pct: 0.002,
      mom_lookback: 8,
    },
  },
  ml: {
    ml: {
      dir_min: 0.62,
      use_win_gate: false,
    },
  },
};

const TABS = [
  { id: 'safety', label: 'Safety' },
  { id: 'trading', label: 'Trading' },
  { id: 'risk', label: 'Risk' },
  { id: 'limits', label: 'Limits' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'ml', label: 'ML' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('safety');
  const [toasts, setToasts] = useState([]);
  const [errors, setErrors] = useState({});

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSettings();
        setSettings(res?.settings ?? {});
      } catch (e) {
        addToast(String(e?.message || e), 'error');
      }
    }
    load();
  }, []);

  // Helper to get/set nested values
  const get = (path, fallback) => {
    const parts = path.split('.');
    let val = settings;
    for (const p of parts) {
      val = val?.[p];
    }
    return val ?? fallback;
  };

  const set = (path, value) => {
    // Clear error for this field
    setErrors(e => ({ ...e, [path]: null }));

    setSettings((s) => {
      const parts = path.split('.');
      const newSettings = { ...s };
      let current = newSettings;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = value;
      return newSettings;
    });
  };

  // Validation
  const validate = (path, value, min, max) => {
    if (value < min || value > max) {
      setErrors(e => ({ ...e, [path]: `Must be between ${min} and ${max}` }));
      return false;
    }
    return true;
  };

  // Reset section to defaults
  const resetSection = (section) => {
    const defaults = DEFAULTS[section];
    if (defaults) {
      setSettings(s => ({ ...s, ...defaults }));
      addToast(`${section} reset to defaults`, 'success');
    }
  };

  async function onSave() {
    // Check for validation errors
    if (Object.values(errors).some(e => e)) {
      addToast('Please fix validation errors', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await saveSettings(settings);
      setSettings(res?.settings ?? settings);
      addToast('Settings saved successfully', 'success');
    } catch (e) {
      addToast(String(e?.message || e), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
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
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Configure trading parameters and risk management
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: 0,
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
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 700 }}>
        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <SettingsSection title="Safety" onReset={() => resetSection('safety')}>
            <SettingRow label="Kill Switch" description="When ON, all trading is blocked">
              <Toggle
                value={get('kill_switch', 'off') === 'on'}
                onChange={(v) => set('kill_switch', v ? 'on' : 'off')}
              />
            </SettingRow>

            <SettingRow label="Mode" description="Paper trading or live trading">
              <select
                value={get('mode', 'paper')}
                onChange={(e) => set('mode', e.target.value)}
                style={{ ...inputStyle, width: 'auto', minWidth: 120 }}
              >
                <option value="paper">Paper</option>
                <option value="live">Live</option>
              </select>
            </SettingRow>
          </SettingsSection>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <SettingsSection title="Trading" onReset={() => resetSection('trading')}>
            <SettingRow label="Symbols" description="Comma-separated list of symbols to trade">
              <input
                type="text"
                value={get('symbols', 'QQQ,AMD,NVDA,AMZN')}
                onChange={(e) => set('symbols', e.target.value)}
                style={inputStyle}
                placeholder="QQQ,AMD,NVDA,AMZN"
              />
            </SettingRow>

            <SettingRow label="Trading Window" description="Time window for trading (PST)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={get('trading_window_start', '06:30')}
                  onChange={(e) => set('trading_window_start', e.target.value)}
                  style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                  placeholder="06:30"
                />
                <span style={{ color: colors.textMuted }}>to</span>
                <input
                  type="text"
                  value={get('trading_window_end', '10:30')}
                  onChange={(e) => set('trading_window_end', e.target.value)}
                  style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                  placeholder="10:30"
                />
              </div>
            </SettingRow>

            <SettingRow label="Confidence Threshold" description="Minimum confidence to enter a trade (0.00-1.00)">
              <ValidatedNumberInput
                value={get('thresholds.conf_threshold', 0.55)}
                onChange={(v) => set('thresholds.conf_threshold', v)}
                onValidate={(v) => validate('thresholds.conf_threshold', v, 0, 1)}
                error={errors['thresholds.conf_threshold']}
                step={0.01}
                min={0}
                max={1}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <SettingsSection title="Risk Management" onReset={() => resetSection('risk')}>
            <SettingRow label="Stop Loss %" description="Percentage loss to trigger stop loss">
              <ValidatedNumberInput
                value={get('risk.stop_loss_pct', 0.01)}
                onChange={(v) => set('risk.stop_loss_pct', v)}
                onValidate={(v) => validate('risk.stop_loss_pct', v, 0.001, 0.1)}
                error={errors['risk.stop_loss_pct']}
                step={0.001}
                min={0.001}
                max={0.1}
                suffix="%"
                multiplier={100}
              />
            </SettingRow>

            <SettingRow label="Take Profit %" description="Percentage gain to trigger take profit">
              <ValidatedNumberInput
                value={get('risk.take_profit_pct', 0.02)}
                onChange={(v) => set('risk.take_profit_pct', v)}
                onValidate={(v) => validate('risk.take_profit_pct', v, 0.001, 0.1)}
                error={errors['risk.take_profit_pct']}
                step={0.001}
                min={0.001}
                max={0.1}
                suffix="%"
                multiplier={100}
              />
            </SettingRow>

            <SettingRow label="Risk per Trade %" description="Percentage of account to risk per trade">
              <ValidatedNumberInput
                value={get('risk.risk_per_trade_pct', 0.005)}
                onChange={(v) => set('risk.risk_per_trade_pct', v)}
                onValidate={(v) => validate('risk.risk_per_trade_pct', v, 0.001, 0.05)}
                error={errors['risk.risk_per_trade_pct']}
                step={0.001}
                min={0.001}
                max={0.05}
                suffix="%"
                multiplier={100}
              />
            </SettingRow>

            <SettingRow label="Max Hold (minutes)" description="Maximum time to hold a position">
              <ValidatedNumberInput
                value={get('risk.max_hold_min', 120)}
                onChange={(v) => set('risk.max_hold_min', v)}
                onValidate={(v) => validate('risk.max_hold_min', v, 5, 480)}
                error={errors['risk.max_hold_min']}
                step={5}
                min={5}
                max={480}
                suffix="min"
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <SettingsSection title="Execution Limits" onReset={() => resetSection('limits')}>
            <SettingRow label="Trades per Ticker per Day" description="Maximum trades per symbol per day">
              <ValidatedNumberInput
                value={get('limits.trades_per_ticker_per_day', 1)}
                onChange={(v) => set('limits.trades_per_ticker_per_day', v)}
                onValidate={(v) => validate('limits.trades_per_ticker_per_day', v, 0, 10)}
                error={errors['limits.trades_per_ticker_per_day']}
                step={1}
                min={0}
                max={10}
              />
            </SettingRow>

            <SettingRow label="Max Open Positions" description="Maximum concurrent open positions">
              <ValidatedNumberInput
                value={get('limits.max_open_positions', 5)}
                onChange={(v) => set('limits.max_open_positions', v)}
                onValidate={(v) => validate('limits.max_open_positions', v, 1, 20)}
                error={errors['limits.max_open_positions']}
                step={1}
                min={1}
                max={20}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Strategy Tab */}
        {activeTab === 'strategy' && (
          <SettingsSection title="Strategy Tuning" onReset={() => resetSection('strategy')}>
            <SettingRow label="Momentum Entry %" description="Minimum momentum to trigger entry override">
              <ValidatedNumberInput
                value={get('strategy.mom_entry_pct', 0.002)}
                onChange={(v) => set('strategy.mom_entry_pct', v)}
                onValidate={(v) => validate('strategy.mom_entry_pct', v, 0.0005, 0.02)}
                error={errors['strategy.mom_entry_pct']}
                step={0.0005}
                min={0.0005}
                max={0.02}
                suffix="%"
                multiplier={100}
              />
            </SettingRow>

            <SettingRow label="Momentum Lookback" description="Number of bars to calculate momentum">
              <ValidatedNumberInput
                value={get('strategy.mom_lookback', 8)}
                onChange={(v) => set('strategy.mom_lookback', v)}
                onValidate={(v) => validate('strategy.mom_lookback', v, 2, 30)}
                error={errors['strategy.mom_lookback']}
                step={1}
                min={2}
                max={30}
                suffix="bars"
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* ML Tab */}
        {activeTab === 'ml' && (
          <SettingsSection title="ML Configuration" onReset={() => resetSection('ml')}>
            <SettingRow label="Direction Min Probability" description="Minimum probability for ML direction signal">
              <ValidatedNumberInput
                value={get('ml.dir_min', 0.62)}
                onChange={(v) => set('ml.dir_min', v)}
                onValidate={(v) => validate('ml.dir_min', v, 0.5, 0.9)}
                error={errors['ml.dir_min']}
                step={0.01}
                min={0.5}
                max={0.9}
              />
            </SettingRow>

            <SettingRow label="Use Win Gate" description="Enable win probability gating">
              <Toggle
                value={get('ml.use_win_gate', false)}
                onChange={(v) => set('ml.use_win_gate', v)}
              />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Save Button */}
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

function SettingsSection({ title, onReset, children }) {
  return (
    <div style={cardStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary }}>
          {title}
        </span>
        <button
          onClick={onReset}
          style={{
            ...buttonStyle,
            padding: '6px 12px',
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          Reset to Defaults
        </button>
      </div>
      <div style={{ display: 'grid', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
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
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={value ? toggleOnStyle : toggleOffStyle}
    >
      {value ? 'ON' : 'OFF'}
    </button>
  );
}

function ValidatedNumberInput({ value, onChange, onValidate, error, step = 1, min, max, suffix = '', multiplier = 1 }) {
  const displayValue = multiplier !== 1 ? (value * multiplier).toFixed(multiplier === 100 ? 1 : 2) : value;

  const handleChange = (e) => {
    const raw = Number(e.target.value);
    const actual = multiplier !== 1 ? raw / multiplier : raw;
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
          step={multiplier !== 1 ? step * multiplier : step}
          min={min != null ? (multiplier !== 1 ? min * multiplier : min) : undefined}
          max={max != null ? (multiplier !== 1 ? max * multiplier : max) : undefined}
          style={{
            ...inputStyle,
            width: 80,
            textAlign: 'center',
            borderColor: error ? colors.error : colors.border,
          }}
        />
        {suffix && (
          <span style={{ color: colors.textMuted, fontSize: 13 }}>{suffix}</span>
        )}
      </div>
      {error && (
        <div style={{ color: colors.error, fontSize: 11, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
