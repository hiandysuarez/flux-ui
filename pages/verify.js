import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { darkTheme, fontFamily, fontSize, fontWeight, shadows } from '../lib/theme';

export default function VerifyEmail() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const colors = darkTheme;
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // If user is confirmed, redirect to onboarding/dashboard
    if (!loading && user?.email_confirmed_at) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const { supabase } = await import('../lib/supabase');
      if (supabase && user?.email) {
        await supabase.auth.resend({ type: 'signup', email: user.email });
        setResendCooldown(60);
      }
    } catch (e) {
      console.error('Resend failed:', e);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: colors.bgPrimary,
      }}>
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: colors.bgPrimary,
      color: colors.textPrimary,
      fontFamily: fontFamily.sans,
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: shadows.lg,
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: colors.accentDark,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '28px',
        }}>
          @
        </div>

        <h1 style={{
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
          marginBottom: '8px',
        }}>
          Check your email
        </h1>

        <p style={{
          fontSize: fontSize.base,
          color: colors.textSecondary,
          marginBottom: '8px',
          lineHeight: 1.6,
        }}>
          We sent a verification link to
        </p>

        {user?.email && (
          <p style={{
            fontSize: fontSize.md,
            fontWeight: fontWeight.semibold,
            color: colors.accent,
            marginBottom: '24px',
          }}>
            {user.email}
          </p>
        )}

        <p style={{
          fontSize: fontSize.sm,
          color: colors.textMuted,
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          Click the link in the email to verify your account.
          If you don't see it, check your spam folder.
        </p>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          style={{
            background: resendCooldown > 0 ? colors.bgTertiary : 'transparent',
            border: `1px solid ${colors.border}`,
            color: resendCooldown > 0 ? colors.textMuted : colors.textPrimary,
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            width: '100%',
            marginBottom: '12px',
            transition: 'all 0.2s',
          }}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
        </button>

        <button
          onClick={() => router.push('/login')}
          style={{
            background: 'transparent',
            border: 'none',
            color: colors.textMuted,
            padding: '8px',
            cursor: 'pointer',
            fontSize: fontSize.sm,
          }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
