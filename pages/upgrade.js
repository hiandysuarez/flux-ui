// pages/upgrade.js - Subscription upgrade/pricing page
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { fetchSubscriptionLimits, upgradeSubscription } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  darkTheme,
  borderRadius,
  fontSize,
  fontWeight,
  fontFamily,
  spacing,
  transitions,
  shadows,
} from '../lib/theme';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '2 live trades total',
      'Up to $500 account equity',
      'Unlimited paper trading',
      'Basic analytics',
    ],
    highlight: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$14.99',
    period: '/month',
    features: [
      'Unlimited live trades',
      'Up to $5,000 account equity',
      'Unlimited paper trading',
      'Full analytics suite',
      'Email support',
    ],
    highlight: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    features: [
      'Unlimited live trades',
      'No equity limits',
      'Unlimited paper trading',
      'Full analytics suite',
      'Priority support',
      'Early access to features',
    ],
    highlight: false,
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [upgrading, setUpgrading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const colors = darkTheme;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchSubscriptionLimits()
        .then(data => {
          if (data.ok) setCurrentPlan(data.plan || 'free');
        })
        .catch(console.error);
    }
  }, [user, authLoading, router]);

  const handleUpgrade = async (planId) => {
    if (planId === currentPlan) return;

    setUpgrading(planId);
    setError(null);
    setSuccess(null);

    try {
      const result = await upgradeSubscription(planId);
      if (result.ok) {
        setCurrentPlan(planId);
        setSuccess(`Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`);
        // Redirect after a moment
        setTimeout(() => router.push('/'), 2000);
      } else {
        setError(result.error || 'Upgrade failed');
      }
    } catch (e) {
      setError(e.message || 'Upgrade failed');
    } finally {
      setUpgrading(null);
    }
  };

  const planOrder = { free: 0, plus: 1, pro: 2 };

  if (authLoading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.accent,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: `${spacing.xxl} ${spacing.lg}` }}>
        <h1 style={{
          fontSize: fontSize['2xl'],
          fontWeight: fontWeight.bold,
          fontFamily: fontFamily.display,
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}>
          Choose Your Plan
        </h1>
        <p style={{
          fontSize: fontSize.md,
          fontFamily: fontFamily.sans,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: spacing.xxl,
        }}>
          Unlock more trading power with Plus or Pro
        </p>

        {error && (
          <div style={{
            padding: `${spacing.md} ${spacing.lg}`,
            background: `${colors.error}15`,
            border: `1px solid ${colors.error}30`,
            borderRadius: borderRadius.md,
            color: colors.error,
            marginBottom: spacing.lg,
            textAlign: 'center',
            fontFamily: fontFamily.sans,
            fontSize: fontSize.sm,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: `${spacing.md} ${spacing.lg}`,
            background: `${colors.success}15`,
            border: `1px solid ${colors.success}30`,
            borderRadius: borderRadius.md,
            color: colors.success,
            marginBottom: spacing.lg,
            textAlign: 'center',
            fontFamily: fontFamily.sans,
            fontSize: fontSize.sm,
          }}>
            {success}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: spacing.lg,
        }}>
          {PLANS.map(plan => {
            const isCurrent = plan.id === currentPlan;
            const canUpgrade = planOrder[plan.id] > planOrder[currentPlan];
            const isDowngrade = planOrder[plan.id] < planOrder[currentPlan];

            return (
              <div
                key={plan.id}
                style={{
                  background: colors.bgSecondary,
                  border: plan.highlight
                    ? `2px solid ${colors.accent}`
                    : `1px solid ${colors.border}`,
                  borderRadius: borderRadius.xl,
                  padding: spacing.xl,
                  position: 'relative',
                  boxShadow: plan.highlight ? shadows.lg : shadows.sm,
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: colors.accent,
                    color: colors.bgPrimary,
                    padding: `4px ${spacing.md}`,
                    borderRadius: borderRadius.full,
                    fontSize: fontSize.xs,
                    fontWeight: fontWeight.semibold,
                    fontFamily: fontFamily.sans,
                    whiteSpace: 'nowrap',
                  }}>
                    MOST POPULAR
                  </div>
                )}

                <h3 style={{
                  fontSize: fontSize.xl,
                  fontWeight: fontWeight.semibold,
                  fontFamily: fontFamily.sans,
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                }}>
                  {plan.name}
                </h3>

                <div style={{ marginBottom: spacing.lg }}>
                  <span style={{
                    fontSize: fontSize['2xl'],
                    fontWeight: fontWeight.bold,
                    fontFamily: fontFamily.display,
                    color: colors.textPrimary,
                  }}>
                    {plan.price}
                  </span>
                  <span style={{
                    fontSize: fontSize.sm,
                    fontFamily: fontFamily.sans,
                    color: colors.textMuted,
                  }}>
                    {plan.period}
                  </span>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: `0 0 ${spacing.lg} 0`,
                }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.sm,
                      fontSize: fontSize.sm,
                      fontFamily: fontFamily.sans,
                      color: colors.textSecondary,
                    }}>
                      <span style={{ color: colors.success }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => canUpgrade && handleUpgrade(plan.id)}
                  disabled={isCurrent || !canUpgrade || upgrading === plan.id}
                  style={{
                    width: '100%',
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    border: 'none',
                    background: isCurrent
                      ? colors.bgTertiary
                      : canUpgrade
                        ? colors.accent
                        : colors.bgTertiary,
                    color: isCurrent || !canUpgrade
                      ? colors.textMuted
                      : colors.bgPrimary,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.semibold,
                    fontFamily: fontFamily.sans,
                    cursor: canUpgrade && !isCurrent ? 'pointer' : 'not-allowed',
                    transition: transitions.normal,
                    opacity: upgrading === plan.id ? 0.7 : 1,
                  }}
                >
                  {upgrading === plan.id
                    ? 'Processing...'
                    : isCurrent
                      ? 'Current Plan'
                      : isDowngrade
                        ? 'Downgrade'
                        : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        <p style={{
          marginTop: spacing.xxl,
          textAlign: 'center',
          fontSize: fontSize.xs,
          fontFamily: fontFamily.sans,
          color: colors.textMuted,
        }}>
          Stripe payment integration coming soon. Contact support for manual upgrades.
        </p>
      </div>
    </Layout>
  );
}
