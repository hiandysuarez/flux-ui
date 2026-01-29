// pages/settings.js - Read-only settings view
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import GuardrailHint from '../components/GuardrailHint';
import { fetchUserSettings, fetchPresets, fetchGuardrails } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  colors,
  borderRadius,
  cardStyle,
  inputStyle,
  toggleOnStyle,
  toggleOffStyle,
  fontSize,
  fontWeight,
} from '../lib/theme';

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
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');

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

      try {
        const [settingsRes, presetsRes, guardrailsRes] = await Promise.all([
          fetchUserSettings(),
          fetchPresets(),
          fetchGuardrails().catch(() => ({ ok: true, guardrails: DEFAULT_GUARDRAILS })),
        ]);

        if (settingsRes.ok && settingsRes.settings) {
          setSettings(settingsRes.settings);
        }

        if (presetsRes.ok && presetsRes.presets) {
          setPresets(presetsRes.presets);
        }

        if (guardrailsRes.ok && guardrailsRes.guardrails) {
          setGuardrails(guardrailsRes.guardrails);
        }
      } catch (e) {
        setError(String(e?.message || e));
      }
    }
    load();
  }, [user]);

  // Helper to get values
  const get = (path, fallback) => {
    if (!settings) return fallback;
    const parts = path.split('.');
    let val = settings;
    for (const p of parts) {
      val = val?.[p];
    }
    return val ?? fallback;
  };

  // Find current preset name
  const currentPreset = presets.find(p => p.id === settings?.preset_id);

  if (authLoading || !settings) {
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
          View your trading parameters and risk management
        </p>
      </div>

      {/* Read-only banner */}
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

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 13,
          marginBottom: 24,
        }}>
          {error}
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
          <SettingsSection title="Trading Profile">
            <SettingRow label="Current Preset" description="Your active trading profile">
              <div style={{
                padding: '8px 16px',
                background: colors.bgTertiary,
                borderRadius: 8,
                color: colors.textPrimary,
                fontSize: fontSize.base,
                fontWeight: fontWeight.semibold,
              }}>
                {currentPreset ? currentPreset.name : 'Custom'}
              </div>
            </SettingRow>
            {currentPreset && (
              <div style={{
                padding: '12px 16px',
                background: colors.bgTertiary,
                borderRadius: 8,
                color: colors.textSecondary,
                fontSize: 13,
              }}>
                {currentPreset.description}
              </div>
            )}
          </SettingsSection>
        )}

        {/* Safety Tab */}
        {activeTab === 'safety' && (
          <SettingsSection title="Safety">
            <SettingRow label="Kill Switch" description="When ON, all trading is blocked">
              <ReadOnlyToggle value={get('kill_switch', 'off') === 'on'} />
            </SettingRow>

            <SettingRow label="Mode" description="Paper trading or live trading">
              <ReadOnlyValue value={get('mode', 'paper') === 'paper' ? 'Paper' : 'Live'} />
            </SettingRow>
          </SettingsSection>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <SettingsSection title="Trading">
            <SettingRow label="Symbols" description="Symbols being traded">
              <ReadOnlyValue value={get('symbols', 'QQQ,SPY')} />
            </SettingRow>

            <SettingRow label="Trading Window" description="Time window for trading (PST)">
              <ReadOnlyValue value={`${get('trading_window_start', '06:30')} - ${get('trading_window_end', '10:30')}`} />
            </SettingRow>

            <SettingRow
              label="Confidence Threshold"
              description="Minimum confidence to enter a trade"
              guardrail={guardrails.conf_threshold}
              value={get('conf_threshold', 0.60)}
            >
              <ReadOnlyPercent value={get('conf_threshold', 0.60)} />
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
              <ReadOnlyPercent value={get('stop_loss_pct', 0.01)} />
            </SettingRow>

            <SettingRow
              label="Take Profit %"
              description="Percentage gain to trigger take profit"
              guardrail={guardrails.take_profit_pct}
              value={get('take_profit_pct', 0.02)}
            >
              <ReadOnlyPercent value={get('take_profit_pct', 0.02)} />
            </SettingRow>

            <SettingRow
              label="Risk per Trade %"
              description="Percentage of account to risk per trade"
              guardrail={guardrails.risk_per_trade_pct}
              value={get('risk_per_trade_pct', 0.005)}
            >
              <ReadOnlyPercent value={get('risk_per_trade_pct', 0.005)} />
            </SettingRow>

            <SettingRow
              label="Max Hold (minutes)"
              description="Maximum time to hold a position"
              guardrail={guardrails.max_hold_min}
              value={get('max_hold_min', 120)}
            >
              <ReadOnlyValue value={`${get('max_hold_min', 120)} min`} />
            </SettingRow>

            <SettingRow label="MQ Exit Enabled" description="Exit early when market quality degrades">
              <ReadOnlyToggle value={get('mq_exit_enabled', true)} />
            </SettingRow>

            <SettingRow label="MQ Exit Threshold %" description="Min unrealized loss to trigger mq_exit">
              <ReadOnlyPercent value={get('mq_exit_loss_threshold', 0.001)} />
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
              <ReadOnlyValue value={get('trades_per_ticker_per_day', 1)} />
            </SettingRow>

            <SettingRow
              label="Max Open Positions"
              description="Maximum concurrent open positions"
              guardrail={guardrails.max_open_positions}
              value={get('max_open_positions', 5)}
            >
              <ReadOnlyValue value={get('max_open_positions', 5)} />
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
              <ReadOnlyPercent value={get('mom_entry_pct', 0.002)} />
            </SettingRow>

            <SettingRow
              label="Momentum Lookback"
              description="Number of bars to calculate momentum"
              guardrail={guardrails.mom_lookback}
              value={get('mom_lookback', 8)}
            >
              <ReadOnlyValue value={`${get('mom_lookback', 8)} bars`} />
            </SettingRow>
          </SettingsSection>
        )}
      </div>
    </Layout>
  );
}

// Components

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
