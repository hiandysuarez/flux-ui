import React from 'react';
import { darkTheme, fontFamily, fontSize, fontWeight, shadows } from '../lib/theme';

/**
 * Global Error Boundary - catches unhandled JS errors and shows a fallback UI
 * instead of crashing the entire app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Report to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const colors = darkTheme;

    if (this.state.hasError) {
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
            padding: '32px',
            textAlign: 'center',
            boxShadow: shadows.lg,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>!</div>
            <h1 style={{
              fontSize: fontSize.xl,
              fontWeight: fontWeight.bold,
              marginBottom: '8px',
              color: colors.textPrimary,
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontSize: fontSize.sm,
              color: colors.textSecondary,
              marginBottom: '24px',
              lineHeight: 1.6,
            }}>
              An unexpected error occurred. Your trading data is safe.
            </p>

            {this.state.error && (
              <div style={{
                background: colors.bgTertiary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left',
                maxHeight: '120px',
                overflow: 'auto',
              }}>
                <code style={{
                  fontSize: fontSize.xs,
                  color: colors.error,
                  fontFamily: fontFamily.mono,
                  wordBreak: 'break-all',
                }}>
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.medium,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.borderColor = colors.accent}
                onMouseOut={(e) => e.target.style.borderColor = colors.border}
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  background: colors.accent,
                  border: 'none',
                  color: colors.bgPrimary,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
