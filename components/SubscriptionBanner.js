// components/SubscriptionBanner.js
// Banner shown when user approaches or hits subscription limits
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchSubscriptionLimits } from '../lib/api';
import {
  darkTheme,
  borderRadius,
  fontSize,
  fontWeight,
  fontFamily,
  spacing,
  transitions,
} from '../lib/theme';

export default function SubscriptionBanner() {
  const router = useRouter();
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const colors = darkTheme;

  useEffect(() => {
    fetchSubscriptionLimits()
      .then(data => {
        if (data.ok) setLimits(data);
      })
      .catch(err => console.error('SubscriptionBanner fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Don't show if loading, no limits, can trade, or dismissed
  if (loading || !limits || dismissed) return null;
  if (limits.can_trade && !limits.suggest_upgrade) return null;
  if (limits.plan === 'admin') return null; // Admin never sees this

  const isBlocked = !limits.can_trade;

  const getMessage = () => {
    if (limits.reason === 'trade_limit_reached') {
      return `You've used all ${limits.trade_limit} free live trades. Upgrade to Plus for unlimited trading.`;
    }
    if (limits.reason === 'equity_cap_reached') {
      const cap = limits.equity_cap?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      const upgrade = limits.suggest_upgrade === 'pro' ? 'Pro' : 'Plus';
      return `Your account equity has reached the ${cap} ${limits.plan} tier limit. Upgrade to ${upgrade} to continue trading.`;
    }
    return null;
  };

  const message = getMessage();
  if (!message) return null;

  const upgradeTier = limits.suggest_upgrade === 'pro' ? 'Pro' : 'Plus';

  return (
    <div style={{
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      background: isBlocked
        ? `linear-gradient(135deg, ${colors.error}15, ${colors.error}08)`
        : `linear-gradient(135deg, ${colors.warning}15, ${colors.warning}08)`,
      border: `1px solid ${isBlocked ? colors.error : colors.warning}30`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
        <span style={{ fontSize: '20px' }}>{isBlocked ? '⚠️' : '📈'}</span>
        <div>
          <div style={{
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            fontFamily: fontFamily.sans,
            color: colors.textPrimary,
            marginBottom: '2px',
          }}>
            {isBlocked ? 'Trading Paused' : 'Approaching Limit'}
          </div>
          <div style={{
            fontSize: fontSize.xs,
            fontFamily: fontFamily.sans,
            color: colors.textSecondary,
          }}>
            {message}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: spacing.sm }}>
        <button
          onClick={() => router.push('/upgrade')}
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            borderRadius: borderRadius.md,
            border: 'none',
            background: colors.accent,
            color: colors.bgPrimary,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            fontFamily: fontFamily.sans,
            cursor: 'pointer',
            transition: transitions.fast,
            whiteSpace: 'nowrap',
          }}
        >
          Upgrade to {upgradeTier}
        </button>
        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
            background: 'transparent',
            color: colors.textMuted,
            fontSize: fontSize.sm,
            fontFamily: fontFamily.sans,
            cursor: 'pointer',
            transition: transitions.fast,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
