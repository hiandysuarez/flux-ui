import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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

// ---------------------------------------------------------------------------
// SVG Icon components -- lightweight inline icons, no emoji
// ---------------------------------------------------------------------------

function IconBrain({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 4.55 7.08A5 5 0 0 1 18 14a5 5 0 0 1-3 4.58V22h-6v-3.42A5 5 0 0 1 6 14a5 5 0 0 1 1.45-4.92A5 5 0 0 1 12 2z" />
      <path d="M12 2v8" />
      <path d="M8 8l4 4 4-4" />
    </svg>
  );
}

function IconShield({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconChart({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconTerminal({ color, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const router = useRouter();
  const colors = darkTheme;
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      title: 'ML-Powered Decisions',
      description: 'Models trained on market microstructure analyze patterns and execute with precision timing.',
      Icon: IconBrain,
    },
    {
      title: 'Risk Management',
      description: 'Configurable stop-loss, position sizing, and daily drawdown limits protect your capital.',
      Icon: IconShield,
    },
    {
      title: 'Real-time Analytics',
      description: 'Live P&L, trade logs, and performance breakdowns in a single dashboard.',
      Icon: IconChart,
    },
    {
      title: 'Paper Trading',
      description: 'Validate strategies against live market data without risking real capital.',
      Icon: IconTerminal,
    },
  ];

  return (
    <>
      <Head>
        <title>Flux | ML-Powered Intraday Trading</title>
        <meta name="description" content="Flux is an ML-powered intraday stock trading platform. Analyze markets, manage risk, and execute trades with machine learning." />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: colors.bgPrimary,
        color: colors.textPrimary,
        fontFamily: fontFamily.sans,
        overflow: 'hidden',
      }}>
        {/* --- Styles --- */}
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes subtlePulse {
            0%, 100% { opacity: 1; }
            50%      { opacity: 0.5; }
          }
          @keyframes drawLine {
            from { stroke-dashoffset: 600; }
            to   { stroke-dashoffset: 0; }
          }

          .cta-button { transition: background ${transitions.normal}, box-shadow ${transitions.normal}, transform ${transitions.fast}; }
          .cta-button:hover { background: ${colors.accentHover}; box-shadow: 0 6px 20px rgba(212,165,116,0.25); transform: translateY(-1px); }
          .cta-button:active { transform: translateY(0); }

          .ghost-button { transition: background ${transitions.normal}, border-color ${transitions.normal}; }
          .ghost-button:hover { background: ${colors.bgTertiary}; border-color: ${colors.borderLight}; }

          .feature-card { transition: border-color ${transitions.normal}, transform ${transitions.normal}; }
          .feature-card:hover { border-color: ${colors.borderAccent}; transform: translateY(-3px); }

          @media (max-width: 968px) {
            .hero-grid { grid-template-columns: 1fr; text-align: center; }
            .hero-visual { display: none; }
            .features-grid { grid-template-columns: repeat(2, 1fr); }
            .hero-buttons { justify-content: center; }
          }
          @media (max-width: 640px) {
            .features-grid { grid-template-columns: 1fr; }
            .hero-buttons { flex-direction: column; width: 100%; }
            .hero-buttons button { width: 100%; }
          }
        `}</style>

        {/* --- Nav --- */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: `${spacing.lg}px ${spacing.xl}px`,
          ...glassStyle,
          borderBottom: `1px solid ${colors.border}`,
          opacity: isLoaded ? 1 : 0,
          transition: `opacity 0.5s ease`,
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/images/flux_new_logo.png" alt="Flux" style={{ height: 44, width: 'auto' }} />
            </a>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <button
                onClick={() => router.push('/login')}
                className="ghost-button"
                style={{
                  padding: '10px 20px',
                  borderRadius: borderRadius.md,
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.semibold,
                  fontFamily: fontFamily.sans,
                  cursor: 'pointer',
                }}
              >
                Log In
              </button>
              <button
                onClick={() => router.push('/login?signup=true')}
                className="cta-button"
                style={{
                  padding: '10px 24px',
                  borderRadius: borderRadius.md,
                  background: colors.accent,
                  border: 'none',
                  color: colors.bgPrimary,
                  fontSize: fontSize.sm,
                  fontWeight: fontWeight.bold,
                  fontFamily: fontFamily.sans,
                  cursor: 'pointer',
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* --- Hero --- */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
        }}>
          {/* Subtle top-left ambient light -- toned down */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 25% 15%, rgba(212,165,116,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />

          <div
            className="hero-grid"
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 80,
              alignItems: 'center',
            }}
          >
            {/* Left -- copy */}
            <div style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
            }}>
              {/* Status badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: borderRadius.full,
                background: colors.accentDark,
                border: `1px solid ${colors.borderAccent}`,
                marginBottom: spacing.xl,
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: colors.accent,
                  display: 'inline-block',
                  animation: 'subtlePulse 2.4s ease-in-out infinite',
                }} />
                <span style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                  color: colors.accent,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  ML-Powered Trading
                </span>
              </div>

              <h1 style={{
                fontSize: fontSize.hero,
                fontWeight: fontWeight.extrabold,
                fontFamily: fontFamily.display,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: spacing.xl,
              }}>
                Intraday trading,<br />
                <span style={{ color: colors.accent }}>driven by ML</span>
              </h1>

              <p style={{
                fontSize: fontSize.lg,
                color: colors.textSecondary,
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 500,
              }}>
                Flux connects to your broker, analyzes live market data with machine learning models, and executes intraday trades within the risk parameters you define.
              </p>

              {/* CTA */}
              <div className="hero-buttons" style={{ display: 'flex', alignItems: 'center', gap: spacing.lg }}>
                <button
                  onClick={() => router.push('/login?signup=true')}
                  className="cta-button"
                  style={{
                    padding: '14px 32px',
                    borderRadius: borderRadius.md,
                    background: colors.accent,
                    border: 'none',
                    color: colors.bgPrimary,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    fontFamily: fontFamily.sans,
                    cursor: 'pointer',
                  }}
                >
                  Start Paper Trading
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="ghost-button"
                  style={{
                    padding: '14px 32px',
                    borderRadius: borderRadius.md,
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.semibold,
                    fontFamily: fontFamily.sans,
                    cursor: 'pointer',
                  }}
                >
                  Log In
                </button>
              </div>
            </div>

            {/* Right -- abstract terminal / product visualization */}
            <div
              className="hero-visual"
              style={{
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateY(0)' : 'translateY(24px)',
                transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s',
              }}
            >
              <div style={{
                background: colors.bgCard,
                borderRadius: borderRadius.xl,
                border: `1px solid ${colors.border}`,
                overflow: 'hidden',
                boxShadow: shadows.xl,
              }}>
                {/* Terminal title bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 16px',
                  borderBottom: `1px solid ${colors.border}`,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors.borderLight }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors.borderLight }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors.borderLight }} />
                  <span style={{
                    marginLeft: 12,
                    fontSize: fontSize.xs,
                    color: colors.textMuted,
                    fontFamily: fontFamily.mono,
                  }}>
                    flux — dashboard
                  </span>
                </div>

                {/* Visualization area */}
                <div style={{ padding: 24 }}>
                  {/* Signal line chart */}
                  <svg viewBox="0 0 400 120" style={{ width: '100%', height: 120, display: 'block' }}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.accent} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Horizontal grid */}
                    {[30, 60, 90].map(y => (
                      <line key={y} x1="0" y1={y} x2="400" y2={y} stroke={colors.border} strokeWidth="0.5" />
                    ))}
                    {/* Area */}
                    <path
                      d="M0,95 C30,90 50,85 80,70 C110,55 130,65 160,50 C190,35 210,45 240,30 C270,15 300,25 330,18 C360,12 380,16 400,10 L400,120 L0,120 Z"
                      fill="url(#areaFill)"
                    />
                    {/* Line */}
                    <path
                      d="M0,95 C30,90 50,85 80,70 C110,55 130,65 160,50 C190,35 210,45 240,30 C270,15 300,25 330,18 C360,12 380,16 400,10"
                      fill="none"
                      stroke={colors.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      style={{ strokeDasharray: 600, animation: 'drawLine 1.8s ease forwards' }}
                    />
                  </svg>

                  {/* Simulated log lines */}
                  <div style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: `1px solid ${colors.border}`,
                    fontFamily: fontFamily.mono,
                    fontSize: fontSize.xs,
                    lineHeight: 2,
                    color: colors.textMuted,
                  }}>
                    <div><span style={{ color: colors.textMuted }}>09:31:02</span> <span style={{ color: colors.accent }}>SIGNAL</span> <span style={{ color: colors.textSecondary }}>AAPL</span> long entry @ 227.34</div>
                    <div><span style={{ color: colors.textMuted }}>09:31:02</span> <span style={{ color: colors.success }}>FILLED</span> <span style={{ color: colors.textSecondary }}>AAPL</span> 50 shares @ 227.35</div>
                    <div><span style={{ color: colors.textMuted }}>09:44:18</span> <span style={{ color: colors.accent }}>SIGNAL</span> <span style={{ color: colors.textSecondary }}>AAPL</span> exit target hit</div>
                    <div><span style={{ color: colors.textMuted }}>09:44:18</span> <span style={{ color: colors.success }}>CLOSED</span> <span style={{ color: colors.textSecondary }}>AAPL</span> +$42.50</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Features --- */}
        <section id="features" style={{
          padding: '80px 24px',
          background: colors.bgSecondary,
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: spacing.xl,
            }} className="features-grid">
              {features.map((feature, i) => {
                const FeatureIcon = feature.Icon;
                return (
                  <div
                    key={i}
                    className="feature-card"
                    style={{
                      background: colors.bgCard,
                      borderRadius: borderRadius.lg,
                      border: `1px solid ${colors.border}`,
                      padding: spacing.xl,
                      opacity: isLoaded ? 1 : 0,
                      transform: isLoaded ? 'translateY(0)' : 'translateY(16px)',
                      transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${0.08 * i}s`,
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: borderRadius.md,
                      background: colors.accentDark,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: spacing.lg,
                    }}>
                      <FeatureIcon color={colors.accent} size={20} />
                    </div>
                    <h3 style={{
                      fontSize: fontSize.sm,
                      fontWeight: fontWeight.semibold,
                      marginBottom: spacing.sm,
                    }}>
                      {feature.title}
                    </h3>
                    <p style={{
                      fontSize: fontSize.xs,
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                    }}>
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- Footer --- */}
        <footer style={{
          padding: '32px 24px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl }}>
              <img src="/images/flux_new_logo.png" alt="Flux" style={{ height: 28, width: 'auto', opacity: 0.7 }} />
              <span style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
                {new Date().getFullYear()} Flux Trading
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xl }}>
              {['Privacy', 'Terms'].map((link) => (
                <a
                  key={link}
                  href={`/${link.toLowerCase()}`}
                  style={{
                    fontSize: fontSize.xs,
                    color: colors.textMuted,
                    textDecoration: 'none',
                    transition: `color ${transitions.fast}`,
                  }}
                  onMouseEnter={(e) => e.target.style.color = colors.textSecondary}
                  onMouseLeave={(e) => e.target.style.color = colors.textMuted}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
