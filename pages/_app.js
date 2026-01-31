import { fontFamily, darkTheme } from '../lib/theme';
import { AuthProvider } from '../lib/auth';

export default function App({ Component, pageProps }) {
  const colors = darkTheme;

  return (
    <AuthProvider>
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          font-family: ${fontFamily.sans};
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        body {
          background: ${colors.bgPrimary};
          color: ${colors.textPrimary};
          line-height: 1.5;
        }

        /* CSS Variables */
        :root {
          --bg-primary: ${colors.bgPrimary};
          --bg-secondary: ${colors.bgSecondary};
          --bg-tertiary: ${colors.bgTertiary};
          --bg-card: ${colors.bgCard};
          --bg-hover: ${colors.bgHover};
          --bg-elevated: ${colors.bgElevated};
          --text-primary: ${colors.textPrimary};
          --text-secondary: ${colors.textSecondary};
          --text-muted: ${colors.textMuted};
          --accent: ${colors.accent};
          --accent-hover: ${colors.accentHover};
          --accent-muted: ${colors.accentMuted};
          --accent-dark: ${colors.accentDark};
          --border: ${colors.border};
          --border-light: ${colors.borderLight};
          --border-accent: ${colors.borderAccent};
          --error: ${colors.error};
          --error-dark: ${colors.errorDark};
          --warning: ${colors.warning};
          --success: ${colors.success};
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: ${colors.bgPrimary};
        }

        ::-webkit-scrollbar-thumb {
          background: ${colors.border};
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.borderLight};
        }

        /* Selection styling - gold */
        ::selection {
          background: ${colors.accentDark};
          color: ${colors.textPrimary};
        }

        /* Focus outline - gold for accessibility */
        :focus-visible {
          outline: 2px solid ${colors.accent};
          outline-offset: 2px;
        }

        button {
          font-family: inherit;
        }

        input, select, textarea {
          font-family: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        /* Smooth animations */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ===========================================
           RESPONSIVE UTILITIES
           =========================================== */

        /* Mobile-first responsive grid */
        .mobile-stack {
          display: grid;
          gap: 16px;
        }

        /* Table scroll wrapper */
        .table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Hide on mobile */
        .hide-mobile {
          display: block;
        }

        /* ===========================================
           TABLET BREAKPOINT (768px)
           =========================================== */
        @media (max-width: 768px) {
          /* Typography scaling */
          .hero-text {
            font-size: 36px !important;
          }
          .section-title {
            font-size: 20px !important;
          }

          /* Grid stacking */
          .mobile-stack {
            grid-template-columns: 1fr !important;
          }
          .grid-2-col {
            grid-template-columns: 1fr !important;
          }
          .grid-3-col {
            grid-template-columns: 1fr !important;
          }

          /* Header adjustments */
          .header-badge {
            display: none !important;
          }

          /* Card padding */
          .card-responsive {
            padding: 16px !important;
          }

          /* Main content padding */
          main {
            padding: 16px !important;
          }

          /* Hide less important columns */
          .hide-mobile {
            display: none !important;
          }
        }

        /* ===========================================
           MOBILE BREAKPOINT (640px)
           =========================================== */
        @media (max-width: 640px) {
          /* Smaller typography */
          .hero-text {
            font-size: 28px !important;
          }
          .section-title {
            font-size: 18px !important;
          }

          /* Tighter spacing */
          .card-responsive {
            padding: 12px !important;
          }

          main {
            padding: 12px !important;
          }

          /* Full width buttons on mobile */
          .btn-mobile-full {
            width: 100% !important;
          }

          /* Stack flex items */
          .flex-mobile-col {
            flex-direction: column !important;
            align-items: stretch !important;
          }
        }

        /* ===========================================
           SMALL MOBILE (480px)
           =========================================== */
        @media (max-width: 480px) {
          .hero-text {
            font-size: 24px !important;
          }

          /* Even tighter padding */
          main {
            padding: 8px !important;
          }
        }
      `}</style>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
