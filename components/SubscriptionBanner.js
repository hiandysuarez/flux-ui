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
  const [visible, setVisible] = useState(false);
  const colors = darkTheme;

  useEffect(() => {
    fetchSubscriptionLimits()
      .then(data => {
        if (data.ok) setLimits(data);
      })
      .catch(err => console.error('SubscriptionBanner fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Trigger slide-down animation after mount
  useEffect(() => {
    if (!loading && limits && !dismissed) {
      // Small delay to ensure CSS transition works
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading, limits, dismissed]);

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
    <>
      <style>{`
        @keyframes bannerDropDown {
          0% {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(8px);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Backdrop Overlay */}
      <div
        onClick={() => setDismissed(true)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 998,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(13, 17, 23, 0.7)',
          animation: visible ? 'overlayFadeIn 0.3s ease-out forwards' : 'none',
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Banner */}
      <div style={{
        position: 'fixed',
        top: spacing.xl,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        width: 'calc(100% - 48px)',
        maxWidth: '720px',
        padding: `${spacing.xl} ${spacing.xxl || '32px'}`,
        borderRadius: borderRadius.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.lg,
        background: isBlocked
          ? `linear-gradient(135deg, ${colors.error}22, ${colors.bgCard})`
          : `linear-gradient(135deg, ${colors.warning}22, ${colors.bgCard})`,
        border: `1px solid ${isBlocked ? colors.error : colors.warning}50`,
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px ${isBlocked ? colors.error : colors.warning}20`,
        animation: visible ? 'bannerDropDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.lg, flex: 1 }}>
          <span style={{ fontSize: '28px' }}>{isBlocked ? '⚠️' : '📈'}</span>
          <div>
            <div style={{
              fontSize: fontSize.base,
              fontWeight: fontWeight.bold,
              fontFamily: fontFamily.sans,
              color: colors.textPrimary,
              marginBottom: '4px',
            }}>
              {isBlocked ? 'Trading Paused' : 'Approaching Limit'}
            </div>
            <div style={{
              fontSize: fontSize.sm,
              fontFamily: fontFamily.sans,
              color: colors.textSecondary,
              lineHeight: 1.4,
            }}>
              {message}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <button
            onClick={() => router.push('/upgrade')}
            style={{
              padding: `${spacing.md} ${spacing.xl}`,
              borderRadius: borderRadius.md,
              border: 'none',
              background: colors.accent,
              color: colors.bgPrimary,
              fontSize: fontSize.base,
              fontWeight: fontWeight.bold,
              fontFamily: fontFamily.sans,
              cursor: 'pointer',
              transition: transitions.fast,
              whiteSpace: 'nowrap',
              boxShadow: `0 2px 8px ${colors.accent}40`,
            }}
          >
            Upgrade to {upgradeTier}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.textMuted}50`,
              background: colors.bgSecondary,
              color: colors.textPrimary,
              fontSize: '18px',
              fontFamily: fontFamily.sans,
              cursor: 'pointer',
              transition: transitions.fast,
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}
