import { useState } from 'react';
import { useRouter } from 'next/router';
import { colors, fontSize, fontWeight, shadows, transitions } from '../lib/theme';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await signUp(email, password);
        setSuccess('Check your email to confirm your account!');
      } else {
        await signIn(email, password);
        // Redirect to onboarding or dashboard
        router.push('/onboarding');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '400px',
        background: colors.bgSecondary,
        borderRadius: '16px',
        padding: '32px',
        boxShadow: shadows.xl,
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <h1 style={{
            fontSize: fontSize['2xl'],
            fontWeight: fontWeight.bold,
            color: colors.accent,
            marginBottom: '8px',
          }}>
            Flux
          </h1>
          <p style={{
            fontSize: fontSize.sm,
            color: colors.textSecondary,
          }}>
            AI-Powered Trading Platform
          </p>
        </div>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          marginBottom: '24px',
          background: colors.bgTertiary,
          borderRadius: '8px',
          padding: '4px',
        }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'login' ? colors.bgSecondary : 'transparent',
              color: mode === 'login' ? colors.textPrimary : colors.textMuted,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
              transition: transitions.fast,
            }}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: mode === 'signup' ? colors.bgSecondary : 'transparent',
              color: mode === 'signup' ? colors.textPrimary : colors.textMuted,
              fontWeight: fontWeight.medium,
              cursor: 'pointer',
              transition: transitions.fast,
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: colors.bgTertiary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: fontSize.base,
                outline: 'none',
              }}
              placeholder="you@example.com"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              color: colors.textSecondary,
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                background: colors.bgTertiary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                fontSize: fontSize.base,
                outline: 'none',
              }}
              placeholder="••••••••"
            />
          </div>

          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: fontSize.sm,
                fontWeight: fontWeight.medium,
                color: colors.textSecondary,
                marginBottom: '6px',
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.bgTertiary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.textPrimary,
                  fontSize: fontSize.base,
                  outline: 'none',
                }}
                placeholder="••••••••"
              />
            </div>
          )}

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

          {success && (
            <div style={{
              padding: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#22c55e',
              fontSize: fontSize.sm,
              marginBottom: '16px',
            }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: colors.accent,
              border: 'none',
              borderRadius: '8px',
              color: colors.bgPrimary,
              fontSize: fontSize.base,
              fontWeight: fontWeight.semibold,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: transitions.fast,
            }}
          >
            {loading ? 'Please wait...' : (mode === 'login' ? 'Log In' : 'Create Account')}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: fontSize.xs,
          color: colors.textMuted,
        }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
