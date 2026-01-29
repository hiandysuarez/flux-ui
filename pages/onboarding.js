import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { colors, fontSize, fontWeight, shadows, transitions } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { fetchPresets, completeOnboarding, fetchUserSettings } from '../lib/api';
import PresetSelector from '../components/PresetSelector';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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
      const result = await completeOnboarding(selectedPreset);
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Welcome to Flux
          </h1>
          <p style={{
            fontSize: fontSize.base,
            color: colors.textSecondary,
            maxWidth: '400px',
            margin: '0 auto',
          }}>
            Choose a trading profile to get started. You can customize these settings later.
          </p>
        </div>

        {/* Preset Selection */}
        <PresetSelector
          presets={presets}
          selected={selectedPreset}
          onSelect={setSelectedPreset}
        />

        {/* Info Box */}
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

        {/* Submit Button */}
        <button
          onClick={handleComplete}
          disabled={submitting}
          style={{
            width: '100%',
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
          {submitting ? 'Setting up...' : 'Start Trading'}
        </button>

        <p style={{
          marginTop: '16px',
          textAlign: 'center',
          fontSize: fontSize.xs,
          color: colors.textMuted,
        }}>
          Paper trading is free. No credit card required.
        </p>
      </div>
    </div>
  );
}
