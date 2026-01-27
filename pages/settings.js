// pages/settings.js
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { fetchSettings, saveSettings } from '../lib/api';
import {
  colors,
  borderRadius,
  cardStyle,
  buttonPrimaryStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
} from '../lib/theme';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSettings();
        setSettings(res?.settings ?? {});
      } catch (e) {
        setErr(String(e?.message || e));
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

  async function onSave() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await saveSettings(settings);
      setSettings(res?.settings ?? settings);
      setMsg('Settings saved');
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setErr(String(e?.message || e));
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
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: colors.textPrimary }}>
          Settings
        </h1>
        <p style={{ margin: '8px 0 0', color: colors.textMuted, fontSize: 13 }}>
          Configure trading parameters and risk management
        </p>
      </div>

      {/* Messages */}
      {msg && (
        <div style={{
          ...cardStyle,
          background: colors.accentDark,
          borderColor: colors.accentMuted,
          color: colors.accent,
          marginBottom: 16,
        }}>
          {msg}
        </div>
      )}
      {err && (
        <div style={{
          ...cardStyle,
          background: '#1a0a0a',
          borderColor: colors.error,
          color: colors.error,
          marginBottom: 16,
        }}>
          {err}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16, maxWidth: 800 }}>
        {/* Safety Section */}
        <SettingsCard title="Safety" icon="shield">
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
        </SettingsCard>

        {/* Trading Section */}
        <SettingsCard title="Trading" icon="chart">
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={get('thresholds.conf_threshold', 0.55)}
                onChange={(e) => set('thresholds.conf_threshold', Number(e.target.value))}
                style={{ width: 200, accentColor: colors.accent }}
              />
              <span style={{
                fontWeight: 700,
                color: colors.accent,
                minWidth: 45,
              }}>
                {(get('thresholds.conf_threshold', 0.55) * 100).toFixed(0)}%
              </span>
            </div>
          </SettingRow>
        </SettingsCard>

        {/* Risk Management Section */}
        <SettingsCard title="Risk Management" icon="shield">
          <SettingRow label="Stop Loss %" description="Percentage loss to trigger stop loss">
            <NumberInput
              value={get('risk.stop_loss_pct', 0.01)}
              onChange={(v) => set('risk.stop_loss_pct', v)}
              step={0.001}
              min={0.001}
              max={0.1}
              suffix="%"
              multiplier={100}
            />
          </SettingRow>

          <SettingRow label="Take Profit %" description="Percentage gain to trigger take profit">
            <NumberInput
              value={get('risk.take_profit_pct', 0.02)}
              onChange={(v) => set('risk.take_profit_pct', v)}
              step={0.001}
              min={0.001}
              max={0.1}
              suffix="%"
              multiplier={100}
            />
          </SettingRow>

          <SettingRow label="Risk per Trade %" description="Percentage of account to risk per trade">
            <NumberInput
              value={get('risk.risk_per_trade_pct', 0.005)}
              onChange={(v) => set('risk.risk_per_trade_pct', v)}
              step={0.001}
              min={0.001}
              max={0.05}
              suffix="%"
              multiplier={100}
            />
          </SettingRow>

          <SettingRow label="Max Hold (minutes)" description="Maximum time to hold a position">
            <NumberInput
              value={get('risk.max_hold_min', 120)}
              onChange={(v) => set('risk.max_hold_min', v)}
              step={5}
              min={5}
              max={480}
              suffix="min"
            />
          </SettingRow>
        </SettingsCard>

        {/* Execution Limits Section */}
        <SettingsCard title="Execution Limits" icon="limit">
          <SettingRow label="Trades per Ticker per Day" description="Maximum trades per symbol per day">
            <NumberInput
              value={get('limits.trades_per_ticker_per_day', 1)}
              onChange={(v) => set('limits.trades_per_ticker_per_day', v)}
              step={1}
              min={0}
              max={10}
            />
          </SettingRow>

          <SettingRow label="Max Open Positions" description="Maximum concurrent open positions">
            <NumberInput
              value={get('limits.max_open_positions', 5)}
              onChange={(v) => set('limits.max_open_positions', v)}
              step={1}
              min={1}
              max={20}
            />
          </SettingRow>
        </SettingsCard>

        {/* Strategy Section */}
        <SettingsCard title="Strategy Tuning" icon="gear">
          <SettingRow label="Momentum Entry %" description="Minimum momentum to trigger entry override">
            <NumberInput
              value={get('strategy.mom_entry_pct', 0.002)}
              onChange={(v) => set('strategy.mom_entry_pct', v)}
              step={0.0005}
              min={0.0005}
              max={0.02}
              suffix="%"
              multiplier={100}
            />
          </SettingRow>

          <SettingRow label="Momentum Lookback" description="Number of bars to calculate momentum">
            <NumberInput
              value={get('strategy.mom_lookback', 8)}
              onChange={(v) => set('strategy.mom_lookback', v)}
              step={1}
              min={2}
              max={30}
              suffix="bars"
            />
          </SettingRow>
        </SettingsCard>

        {/* ML Configuration Section */}
        <SettingsCard title="ML Configuration" icon="brain">
          <SettingRow label="Direction Min Probability" description="Minimum probability for ML direction signal">
            <NumberInput
              value={get('ml.dir_min', 0.62)}
              onChange={(v) => set('ml.dir_min', v)}
              step={0.01}
              min={0.5}
              max={0.9}
              suffix=""
              multiplier={1}
            />
          </SettingRow>

          <SettingRow label="Use Win Gate" description="Enable win probability gating">
            <Toggle
              value={get('ml.use_win_gate', false)}
              onChange={(v) => set('ml.use_win_gate', v)}
            />
          </SettingRow>
        </SettingsCard>

        {/* Save Button */}
        <div style={{ display: 'flex', gap: 12 }}>
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
function SettingsCard({ title, icon, children }) {
  return (
    <div style={cardStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 800,
          color: colors.textPrimary,
        }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
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

function NumberInput({ value, onChange, step = 1, min, max, suffix = '', multiplier = 1 }) {
  const displayValue = multiplier !== 1 ? (value * multiplier).toFixed(multiplier === 100 ? 1 : 2) : value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="number"
        value={displayValue}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChange(multiplier !== 1 ? raw / multiplier : raw);
        }}
        step={multiplier !== 1 ? step * multiplier : step}
        min={min != null ? (multiplier !== 1 ? min * multiplier : min) : undefined}
        max={max != null ? (multiplier !== 1 ? max * multiplier : max) : undefined}
        style={{
          ...inputStyle,
          width: 80,
          textAlign: 'center',
        }}
      />
      {suffix && (
        <span style={{ color: colors.textMuted, fontSize: 13 }}>{suffix}</span>
      )}
    </div>
  );
}
