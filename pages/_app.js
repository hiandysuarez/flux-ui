import { fontFamily, darkTheme, lightTheme } from '../lib/theme';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider, useTheme } from '../lib/themeContext';

function ThemedApp({ Component, pageProps }) {
  const { theme } = useTheme();
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <>
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
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* CSS Variables for dynamic theming */
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

        /* Selection styling */
        ::selection {
          background: ${colors.accentDark};
          color: ${colors.textPrimary};
        }

        /* Focus outline for accessibility */
        :focus-visible {
          outline: 2px solid ${colors.accent};
          outline-offset: 2px;
        }

        /* Remove default button styling */
        button {
          font-family: inherit;
        }

        /* Input styling */
        input, select, textarea {
          font-family: inherit;
        }

        /* Link styling */
        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}

export default function App(props) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp {...props} />
      </AuthProvider>
    </ThemeProvider>
  );
}
