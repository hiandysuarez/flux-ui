import { useRouter } from 'next/router';
import { darkTheme, fontFamily, fontSize, fontWeight, shadows } from '../lib/theme';

export default function Custom404() {
  const router = useRouter();
  const colors = darkTheme;

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
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '72px',
          fontWeight: fontWeight.extrabold,
          color: colors.accent,
          lineHeight: 1,
          marginBottom: '16px',
          fontFamily: fontFamily.mono,
        }}>
          404
        </div>

        <h1 style={{
          fontSize: fontSize.xl,
          fontWeight: fontWeight.bold,
          marginBottom: '8px',
        }}>
          Page not found
        </h1>

        <p style={{
          fontSize: fontSize.base,
          color: colors.textSecondary,
          marginBottom: '32px',
          lineHeight: 1.6,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.medium,
              transition: 'all 0.2s',
            }}
          >
            Go Back
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              background: colors.accent,
              border: 'none',
              color: colors.bgPrimary,
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: fontSize.sm,
              fontWeight: fontWeight.semibold,
              transition: 'all 0.2s',
            }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
