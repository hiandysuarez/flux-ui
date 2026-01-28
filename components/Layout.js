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
  const linkStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: borderRadius.md,
    border: `1px solid ${isActive ? colors.accentMuted : 'transparent'}`,
    background: isActive ? colors.accentDark : 'transparent',
    color: isActive ? colors.accent : colors.textSecondary,
    textDecoration: 'none',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    transition: `all ${transitions.fast}`,
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      color: colors.textPrimary,
    }}>
      {/* Responsive styles + animations */}
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
          .nav-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .nav-link:hover {
          color: ${colors.textPrimary} !important;
          background: ${colors.bgHover} !important;
        }
      `}</style>

      {/* Header - Sticky with glass effect */}
      <header style={{
        height: 64,
        padding: '0 24px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        background: 'rgba(13, 15, 18, 0.85)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: borderRadius.md,
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentMuted} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: fontWeight.black,
            fontSize: fontSize.lg,
            color: colors.bgPrimary,
            boxShadow: '0 2px 8px rgba(0, 255, 136, 0.3)',
          }}>
            F
          </div>
          <span style={{
            fontWeight: fontWeight.black,
            fontSize: '22px',
            letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.textPrimary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Flux
          </span>
        </div>

        {/* Navigation */}
        <nav className="nav-wrapper" style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'nowrap',
        }}>
          <a href="/" className="nav-link" style={linkStyle(active === 'dashboard')}>
            Dashboard
          </a>
          <a href="/analytics" className="nav-link" style={linkStyle(active === 'analytics')}>
            Analytics
          </a>
          <a href="/history" className="nav-link" style={linkStyle(active === 'history')}>
            History
          </a>
          <a href="/symbols" className="nav-link" style={linkStyle(active === 'symbols')}>
            Symbols
          </a>
          <a href="/timing" className="nav-link" style={linkStyle(active === 'timing')}>
            Timing
          </a>
          <a href="/settings" className="nav-link" style={linkStyle(active === 'settings')}>
            Settings
          </a>
        </nav>

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
      </header>

      {/* Main content */}
      <main style={{ padding: spacing.xl }}>
        {children}
      </main>
    </div>
  );
}
