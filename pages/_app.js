import { colors, fontFamily } from '../lib/theme';
import { AuthProvider } from '../lib/auth';

export default function App({ Component, pageProps }) {
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
          background: rgba(0, 255, 136, 0.3);
          color: #fff;
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
    </AuthProvider>
  );
}
