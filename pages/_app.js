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

        /* ===========================================
           ANIMATIONS - Enterprise motion system
           =========================================== */

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes highlight {
          0% { background-color: rgba(212, 165, 116, 0.2); }
          100% { background-color: transparent; }
        }

        /* Animation utility classes */
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        /* Staggered animation delays */
        .delay-1 { animation-delay: 0.05s; }
        .delay-2 { animation-delay: 0.1s; }
        .delay-3 { animation-delay: 0.15s; }
        .delay-4 { animation-delay: 0.2s; }
        .delay-5 { animation-delay: 0.25s; }
        .delay-6 { animation-delay: 0.3s; }

        /* Hover transition base class */
        .hover-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        }

        /* Interactive card hover */
        .interactive-card {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .interactive-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(212, 165, 116, 0.2);
          border-color: rgba(212, 165, 116, 0.4);
        }

        .interactive-card:active {
          transform: scale(0.99);
        }

        /* Button press effect */
        .btn-press:active {
          transform: scale(0.98);
        }

        /* Skeleton loading */
        .skeleton {
          background: linear-gradient(90deg, #161B22 25%, #21262D 50%, #161B22 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        /* Value change highlight */
        .value-updated {
          animation: highlight 0.8s ease-out;
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
