import { useState } from 'react';
import {
  colors,
  borderRadius,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
  transitions,
} from '../lib/theme';

export default function Layout({ children, active = 'dashboard' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', key: 'dashboard' },
    { href: '/analytics', label: 'Analytics', key: 'analytics' },
    { href: '/history', label: 'History', key: 'history' },
    { href: '/symbols', label: 'Symbols', key: 'symbols' },
    { href: '/timing', label: 'Timing', key: 'timing' },
    { href: '/settings', label: 'Settings', key: 'settings' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      color: colors.textPrimary,
    }}>
      {/* Styles + animations */}
      <style>{`
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
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes slideIn {
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
      <header style={{
        height: 72,
        padding: '0 24px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(13, 15, 18, 0.9)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/images/flux_logo.png"
            alt="Flux"
            style={{
              height: 48,
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </a>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

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
            background: colors.accent,
            boxShadow: `0 0 8px ${colors.accent}`,
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: colors.textSecondary,
          }}>
            Live
          </span>
        </div>

        {/* Version badge */}
        <div style={{
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

        {/* Hamburger button */}
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
            background: colors.bgSecondary,
            borderRight: `1px solid ${colors.border}`,
            zIndex: 101,
            animation: 'slideIn 0.25s ease',
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
                src="/images/flux_logo.png"
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
                </a>
              ))}
            </nav>

            {/* Menu footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${colors.border}`,
              color: colors.textMuted,
              fontSize: fontSize.xs,
            }}>
              Flux Trading Platform v1.0
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main style={{ padding: spacing.xl }}>
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
