// components/TradingModeBanner.js
// Banner showing current trading mode with option to switch
import { useState } from 'react';
import { saveUserSettings } from '../lib/api';
import {
  darkTheme,
  borderRadius,
  fontSize,
  fontWeight,
  fontFamily,
  spacing,
  transitions,
} from '../lib/theme';

export default function TradingModeBanner({ userSettings, brokerStatus, onModeChange }) {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState(null);
  const colors = darkTheme;

  // Get trading mode from USER SETTINGS (not system status)
  const tradingMode = userSettings?.trading_mode || 'paper';
  // Get broker mode from system status (actual Alpaca connection)
  const brokerMode = brokerStatus?.broker_mode || 'paper';

  // Mode configurations
  const modeConfig = {
    paper: {
      icon: '📄',
      color: colors.accent,
      label: 'Paper Mode',
      desc: 'Simulated trades',
      switchTo: 'live',
      switchLabel: 'Switch to Live',
    },
    live: {
      icon: '💰',
      color: colors.success,
      label: 'Live Mode',
      desc: 'Real money trades',
      switchTo: 'paper',
      switchLabel: 'Switch to Paper',
    },
    disabled: {
      icon: '⏸️',
      color: colors.textMuted,
      label: 'Trading Disabled',
      desc: 'No trades executed',
      switchTo: 'paper',
      switchLabel: 'Enable Paper',
    },
  };

  const config = modeConfig[tradingMode] || modeConfig.paper;

  const handleSwitch = async () => {
    const newMode = config.switchTo;

    // Confirmation for switching to live
    if (newMode === 'live') {
      const confirmed = confirm(
        'Switch to Live Mode?\n\n' +
        '• Real money will be used for trades\n' +
        '• Subscription tier limits apply\n' +
        '• Make sure your Alpaca account is configured for live trading'
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    setError(null);

    try {
      const result = await saveUserSettings({ trading_mode: newMode });

      if (!result.ok) {
        // Handle subscription/tier errors
        if (result.reason === 'subscription_limit') {
          setError('Live trading not available. Check your subscription.');
        } else {
          setError(result.error || 'Failed to switch mode');
        }
        return;
      }

      // Success - trigger refresh
      onModeChange?.();
    } catch (e) {
      console.error('Failed to switch trading mode:', e);
      setError('Failed to switch mode. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  // Show warning if broker mode doesn't match trading mode
  const brokerMismatch = tradingMode === 'live' && brokerMode === 'paper';

  return (
    <div style={{
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      background: `linear-gradient(135deg, ${config.color}15, ${config.color}08)`,
      border: `1px solid ${config.color}30`,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 200 }}>
        <span style={{ fontSize: '24px' }}>{config.icon}</span>
        <div>
          <div style={{
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
            fontFamily: fontFamily.sans,
            color: colors.textPrimary,
            marginBottom: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
          }}>
            You are in {config.label}
            {brokerMismatch && (
              <span style={{
                fontSize: fontSize.xs,
                color: colors.warning,
                fontWeight: fontWeight.normal,
              }}>
                (Broker: Paper)
              </span>
            )}
          </div>
          <div style={{
            fontSize: fontSize.sm,
            fontFamily: fontFamily.sans,
            color: colors.textSecondary,
          }}>
            {config.desc}
          </div>
          {error && (
            <div style={{
              fontSize: fontSize.xs,
              fontFamily: fontFamily.sans,
              color: colors.error,
              marginTop: spacing.xs,
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleSwitch}
        disabled={switching}
        style={{
          padding: `${spacing.sm} ${spacing.lg}`,
          borderRadius: borderRadius.md,
          border: `1px solid ${config.color}50`,
          background: 'transparent',
          color: config.color,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
          fontFamily: fontFamily.sans,
          cursor: switching ? 'wait' : 'pointer',
          transition: transitions.fast,
          opacity: switching ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!switching) {
            e.target.style.background = `${config.color}15`;
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'transparent';
        }}
      >
        {switching ? 'Switching...' : config.switchLabel}
      </button>
    </div>
  );
}
