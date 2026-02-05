import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth';
import { fetchUserSettings, saveUserSettings } from '../lib/api';
import {
  darkTheme,
  borderRadius,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  transitions,
  glassStyle,
} from '../lib/theme';

export default function Layout({ children, active = 'dashboard' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradingMode, setTradingMode] = useState('paper');
  const [modeLoading, setModeLoading] = useState(false);
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Dark Luxe theme - single theme
  const colors = darkTheme;

  // Fetch trading mode on mount
  useEffect(() => {
    async function loadTradingMode() {
      if (!user) return;
      try {
        const res = await fetchUserSettings();
        if (res?.settings?.trading_mode) {
          setTradingMode(res.settings.trading_mode);
        }
      } catch (e) {
        console.error('Failed to load trading mode:', e);
      }
    }
    loadTradingMode();
  }, [user]);

  // Handle mode change
  const handleModeChange = async (newMode) => {
    if (newMode === tradingMode || modeLoading) return;

    // Confirm before switching to live
    if (newMode === 'live') {
      const confirmed = window.confirm(
        'Switch to LIVE mode?\n\nThis will execute real trades with real money. Make sure your broker account is properly configured.'
      );
      if (!confirmed) return;
    }

    setModeLoading(true);
    try {
      await saveUserSettings({ trading_mode: newMode });
      setTradingMode(newMode);
    } catch (e) {
      console.error('Failed to save trading mode:', e);
      // Check if it's a "no live account" error (403)
      const errorMsg = e.message || '';
      if (errorMsg.includes('403') || errorMsg.toLowerCase().includes('live trading not available')) {
        alert('Live trading is not available.\n\nPlease link a live broker account or upgrade your subscription to enable live trading.');
      } else {
        alert('Failed to change trading mode. Please try again.');
      }
    } finally {
      setModeLoading(false);
    }
  };

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: colors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${colors.border}`,
          borderTopColor: colors.accent,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const navLinks = [
    { href: '/', label: 'Dashboard', key: 'dashboard' },
    { href: '/analytics', label: 'Analytics', key: 'analytics' },
    { href: '/history', label: 'History', key: 'history' },
    { href: '/symbols', label: 'Symbols', key: 'symbols' },
    { href: '/timing', label: 'Timing', key: 'timing' },
    { href: '/optimize', label: 'Optimize', key: 'optimize', badge: 'ML' },
  ];

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: tradingMode === 'live' ? '#050810' : colors.bgPrimary,
      transition: 'background-color 0.4s ease',
      color: colors.textPrimary,
    }}>
      {/* Styles + animations */}
      <style>{`
        /* Responsive utilities */
        @media (max-width: 768px) {
          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .responsive-hide {
            display: none !important;
          }
          .responsive-flex-col {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .header-compact {
            padding: 0 12px !important;
          }
          .header-badge-hide {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .logo-small {
            height: 36px !important;
          }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .menu-link {
          transition: all 0.15s ease;
        }

        .menu-link:hover {
          background: ${colors.bgHover} !important;
          padding-left: 24px !important;
        }
      `}</style>

      {/* Header */}
      <header className="header-compact" style={{
        height: 64,
        padding: '0 16px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        ...glassStyle,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* Hamburger button - LEFT side */}
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 5,
            width: 44,
            height: 44,
            borderRadius: borderRadius.md,
            background: colors.bgTertiary,
            border: `1px solid ${colors.border}`,
            cursor: 'pointer',
            transition: `all ${transitions.fast}`,
          }}
          aria-label="Open menu"
        >
          <span style={{ width: 20, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
          <span style={{ width: 20, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
          <span style={{ width: 20, height: 2, background: colors.textPrimary, borderRadius: 1 }} />
        </button>

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/images/flux_new_logo.png"
            alt="Flux"
            className="logo-small"
            style={{
              height: 40,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </a>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Paper/Live Mode Toggle */}
        <div style={{
          display: 'flex',
          background: colors.bgSecondary,
          borderRadius: '20px',
          padding: '4px',
          border: `1px solid ${colors.border}`,
          opacity: modeLoading ? 0.7 : 1,
        }}>
          <button
            onClick={() => handleModeChange('paper')}
            disabled={modeLoading}
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              border: 'none',
              cursor: modeLoading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: fontFamily.sans,
              background: tradingMode === 'paper' ? colors.accentDark : 'transparent',
              color: tradingMode === 'paper' ? colors.accent : colors.textMuted,
              transition: 'all 0.2s ease',
            }}
          >
            Paper
          </button>
          <button
            onClick={() => handleModeChange('live')}
            disabled={modeLoading}
            style={{
              padding: '6px 16px',
              borderRadius: '16px',
              border: 'none',
              cursor: modeLoading ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: fontFamily.sans,
              background: tradingMode === 'live' ? 'rgba(63, 185, 80, 0.15)' : 'transparent',
              color: tradingMode === 'live' ? colors.success : colors.textMuted,
              transition: 'all 0.2s ease',
            }}
          >
            Live
          </button>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: borderRadius.full,
          background: colors.bgTertiary,
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: tradingMode === 'live' ? colors.success : colors.accent,
            boxShadow: tradingMode === 'live' ? `0 0 8px ${colors.success}` : `0 0 8px ${colors.accent}`,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: colors.textSecondary,
          }}>
            {tradingMode === 'live' ? 'Live' : 'Paper'}
          </span>
        </div>

        {/* Version badge - hidden on mobile */}
        <div className="header-badge-hide" style={{
          padding: '6px 12px',
          borderRadius: borderRadius.full,
          background: colors.bgTertiary,
          border: `1px solid ${colors.border}`,
          fontSize: fontSize.xs,
          color: colors.textMuted,
          fontWeight: fontWeight.semibold,
        }}>
          v1.0
        </div>
      </header>

      {/* Slide-out menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 100,
              animation: 'fadeIn 0.2s ease',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Menu panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            ...glassStyle,
            borderRight: `1px solid ${colors.border}`,
            zIndex: 101,
            animation: 'slideInFromLeft 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: shadows.xl,
          }}>
            {/* Menu header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <img
                src="/images/flux_new_logo.png"
                alt="Flux"
                style={{ height: 40, width: 'auto' }}
              />
              <button
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: borderRadius.md,
                  background: colors.bgTertiary,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: fontSize.lg,
                  fontWeight: fontWeight.bold,
                }}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '12px 0' }}>
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className="menu-link"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 20px',
                    color: active === link.key ? colors.accent : colors.textPrimary,
                    fontSize: fontSize.base,
                    fontWeight: active === link.key ? fontWeight.bold : fontWeight.medium,
                    textDecoration: 'none',
                    background: active === link.key ? colors.accentDark : 'transparent',
                    borderLeft: active === link.key ? `3px solid ${colors.accent}` : '3px solid transparent',
                  }}
                >
                  {link.label}
                  {link.badge && (
                    <span style={{
                      marginLeft: 'auto',
                      padding: '2px 8px',
                      borderRadius: borderRadius.full,
                      background: `linear-gradient(135deg, ${colors.accent}, #C4956A)`,
                      color: colors.bgPrimary,
                      fontSize: fontSize.xs,
                      fontWeight: fontWeight.bold,
                      letterSpacing: '0.02em',
                    }}>
                      {link.badge}
                    </span>
                  )}
                </a>
              ))}
            </nav>

            {/* Menu footer */}
            <div style={{ borderTop: `1px solid ${colors.border}` }}>
              {/* Settings link */}
              <a
                href="/settings"
                className="menu-link"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  color: active === 'settings' ? colors.accent : colors.textPrimary,
                  fontSize: fontSize.base,
                  fontWeight: active === 'settings' ? fontWeight.bold : fontWeight.medium,
                  textDecoration: 'none',
                  background: active === 'settings' ? colors.accentDark : 'transparent',
                  borderLeft: active === 'settings' ? `3px solid ${colors.accent}` : '3px solid transparent',
                }}
              >
                Settings
              </a>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="menu-link"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 20px',
                  width: '100%',
                  color: colors.textSecondary,
                  fontSize: fontSize.base,
                  fontWeight: fontWeight.medium,
                  background: 'transparent',
                  border: 'none',
                  borderLeft: '3px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Logout
              </button>

              {/* Version footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: `1px solid ${colors.border}`,
                color: colors.textMuted,
                fontSize: fontSize.xs,
              }}>
                Flux Trading Platform v1.0
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main style={{ padding: spacing.lg, maxWidth: 1400, margin: '0 auto' }}>
        {children}
      </main>

      {/* Pulse animation for live indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
