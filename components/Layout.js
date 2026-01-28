import { colors, borderRadius } from '../lib/theme';

export default function Layout({ children, active = 'dashboard' }) {
  const linkStyle = (isActive) => ({
    padding: '8px 14px',
    borderRadius: borderRadius.md,
    border: `1px solid ${isActive ? colors.accentMuted : colors.border}`,
    background: isActive ? colors.accentDark : 'transparent',
    color: isActive ? colors.accent : colors.textPrimary,
    textDecoration: 'none',
    fontWeight: 700,
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bgPrimary,
      color: colors.textPrimary,
    }}>
      {/* Responsive styles */}
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
      `}</style>

      {/* Header - Sticky */}
      <header style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: colors.bgSecondary,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentMuted} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 16,
            color: colors.bgPrimary,
          }}>
            F
          </div>
          <span style={{
            fontWeight: 900,
            fontSize: 20,
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.textPrimary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Flux
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 8 }}>
          <a href="/" style={linkStyle(active === 'dashboard')}>
            Dashboard
          </a>
          <a href="/settings" style={linkStyle(active === 'settings')}>
            Settings
          </a>
        </nav>

        {/* Version badge */}
        <div style={{
          marginLeft: 'auto',
          padding: '4px 10px',
          borderRadius: borderRadius.full,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          fontSize: 11,
          color: colors.textMuted,
          fontWeight: 600,
        }}>
          v1.0
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: 20 }}>
        {children}
      </main>
    </div>
  );
}
