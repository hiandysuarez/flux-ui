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
      `}</style>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
