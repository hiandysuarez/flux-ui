import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { colors, fontSize, fontWeight, shadows, transitions } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { fetchPresets, completeOnboarding, fetchUserSettings } from '../lib/api';
import PresetSelector from '../components/PresetSelector';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1); // 1 = risk disclosure, 2 = preset selection
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user already completed onboarding
    async function checkOnboarding() {
      try {
        const result = await fetchUserSettings();
        if (result.ok && result.settings) {
          // Already onboarded, go to dashboard
          router.push('/');
          return;
        }
      } catch (err) {
        // 404 means not onboarded yet, which is expected
        if (!err.message.includes('404')) {
          console.error('Check onboarding error:', err);
        }
      }

      // Load presets
      try {
        const presetsResult = await fetchPresets();
        if (presetsResult.ok) {
          setPresets(presetsResult.presets);
        }
      } catch (err) {
        console.error('Load presets error:', err);
      }

      setLoading(false);
    }

    if (user) {
      checkOnboarding();
    }
  }, [user, authLoading, router]);

  const handleComplete = async () => {
    setSubmitting(true);
    setError('');

    try {
      // Pass terms_accepted=true (accepted at signup) and risk_disclosed=true (acknowledged in step 1)
      const result = await completeOnboarding(selectedPreset, true, riskAcknowledged);
      if (result.ok) {
        router.push('/');
      } else {
        setError(result.error || 'Failed to complete setup');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.bgPrimary,
      }}>
        <div style={{ color: colors.textSecondary }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bgPrimary,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        background: colors.bgSecondary,
        borderRadius: '16px',
        padding: '40px',
        boxShadow: shadows.xl,
      }}>
        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: step >= 1 ? colors.accent : colors.bgTertiary,
          }} />
          <div style={{
            width: '40px',
            height: '4px',
            borderRadius: '2px',
            background: step >= 2 ? colors.accent : colors.bgTertiary,
          }} />
        </div>

        {/* Step 1: Risk Disclosure */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(210, 153, 34, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h1 style={{
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.bold,
                color: colors.textPrimary,
                marginBottom: '8px',
              }}>
                Important Risk Disclosure
              </h1>
              <p style={{
                fontSize: fontSize.base,
                color: colors.textSecondary,
              }}>
                Please read and acknowledge before continuing
              </p>
            </div>

            {/* Risk Warning Box */}
            <div style={{
              background: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid rgba(248, 81, 73, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontSize: fontSize.md,
                fontWeight: fontWeight.semibold,
                color: colors.error,
                marginBottom: '12px',
              }}>
                Trading Involves Substantial Risk
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: colors.textSecondary,
                fontSize: fontSize.sm,
                lineHeight: 1.7,
              }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>You may lose money.</strong> Trading involves risk of loss, including the possibility of losing your entire investment.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Past performance does not guarantee future results.</strong> Historical returns are not indicative of future performance.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Automated systems can fail.</strong> Software errors, connectivity issues, or market conditions may cause unexpected behavior.
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Only trade with money you can afford to lose.</strong> Never trade with funds needed for essential expenses.
                </li>
              </ul>
            </div>

            {/* What Flux Is NOT */}
            <div style={{
              background: colors.bgTertiary,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <h4 style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: colors.textPrimary,
                marginBottom: '12px',
              }}>
                Understanding Flux
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                fontSize: fontSize.sm,
              }}>
                <div>
                  <p style={{ color: colors.error, fontWeight: fontWeight.medium, marginBottom: '4px' }}>
                    Flux is NOT:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: colors.textMuted }}>
                    <li>A broker</li>
                    <li>A financial advisor</li>
                    <li>A guarantee of profits</li>
                  </ul>
                </div>
                <div>
                  <p style={{ color: colors.success, fontWeight: fontWeight.medium, marginBottom: '4px' }}>
                    Flux IS:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: colors.textMuted }}>
                    <li>Trading automation software</li>
                    <li>Risk management tools</li>
                    <li>Analytics & insights</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginBottom: '24px',
              padding: '16px',
              background: colors.bgTertiary,
              borderRadius: '8px',
            }}>
              <input
                type="checkbox"
                id="risk-checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginTop: '2px',
                  cursor: 'pointer',
                  accentColor: colors.accent,
                }}
              />
              <label
                htmlFor="risk-checkbox"
                style={{
                  fontSize: fontSize.sm,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  lineHeight: 1.5,
                }}
              >
                I understand that trading involves substantial risk of loss. I acknowledge that Flux is software only
                and does not provide investment advice. I will only trade with capital I can afford to lose.
              </label>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!riskAcknowledged}
              style={{
                width: '100%',
                padding: '16px',
                background: riskAcknowledged ? colors.accent : colors.bgTertiary,
                border: 'none',
                borderRadius: '8px',
                color: riskAcknowledged ? colors.bgPrimary : colors.textMuted,
                fontSize: fontSize.md,
                fontWeight: fontWeight.semibold,
                cursor: riskAcknowledged ? 'pointer' : 'not-allowed',
                transition: transitions.fast,
              }}
            >
              I Understand, Continue
            </button>
          </>
        )}

        {/* Step 2: Preset Selection */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.bold,
                color: colors.textPrimary,
                marginBottom: '8px',
              }}>
                Choose Your Trading Style
              </h1>
              <p style={{
                fontSize: fontSize.base,
                color: colors.textSecondary,
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                Select a profile to get started. You can customize these settings later.
              </p>
            </div>

            <PresetSelector
              presets={presets}
              selected={selectedPreset}
              onSelect={setSelectedPreset}
            />

            <div style={{
              background: colors.bgTertiary,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <h4 style={{
                fontSize: fontSize.sm,
                fontWeight: fontWeight.semibold,
                color: colors.textPrimary,
                marginBottom: '8px',
              }}>
                What happens next?
              </h4>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: colors.textSecondary,
                fontSize: fontSize.sm,
              }}>
                <li style={{ marginBottom: '4px' }}>
                  You'll start with <strong>paper trading</strong> (simulated trades)
                </li>
                <li style={{ marginBottom: '4px' }}>
                  All settings can be adjusted anytime in Settings
                </li>
                <li style={{ marginBottom: '4px' }}>
                  Upgrade to Pro to enable live trading with real money
                </li>
              </ul>
            </div>

            {error && (
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: fontSize.sm,
                marginBottom: '16px',
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '16px 24px',
                  background: colors.bgTertiary,
                  border: 'none',
                  borderRadius: '8px',
                  color: colors.textSecondary,
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.medium,
                  cursor: 'pointer',
                  transition: transitions.fast,
                }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: colors.accent,
                  border: 'none',
                  borderRadius: '8px',
                  color: colors.bgPrimary,
                  fontSize: fontSize.md,
                  fontWeight: fontWeight.semibold,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                  transition: transitions.fast,
                }}
              >
                {submitting ? 'Setting up...' : 'Start Paper Trading'}
              </button>
            </div>

            <p style={{
              marginTop: '16px',
              textAlign: 'center',
              fontSize: fontSize.xs,
              color: colors.textMuted,
            }}>
              Paper trading is free. No credit card required.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
