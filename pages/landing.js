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
      description: 'Machine learning models analyze market patterns and execute trades with precision timing.',
      icon: '⚡',
    },
    {
      title: 'Risk Management',
      description: 'Built-in guardrails protect your capital with configurable stop-loss and position limits.',
      icon: '🛡️',
    },
    {
      title: 'Real-time Analytics',
      description: 'Track performance metrics, win rates, and P&L with comprehensive dashboards.',
      icon: '📊',
    },
    {
      title: 'Paper Trading Mode',
      description: 'Test strategies risk-free before deploying real capital to the markets.',
      icon: '📝',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Your Broker',
      description: 'Link your trading account securely through our encrypted API integration.',
    },
    {
      number: '02',
      title: 'Configure Strategy',
      description: 'Set your risk parameters, choose symbols, and customize trading behavior.',
    },
    {
      number: '03',
      title: 'Let ML Trade',
      description: 'Sit back as intelligent algorithms execute trades based on your preferences.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Trades Executed' },
    { value: '89%', label: 'Avg Win Rate' },
    { value: '24/7', label: 'Market Monitoring' },
    { value: '<50ms', label: 'Execution Speed' },
  ];

  return (
    <>
      <Head>
        <title>Flux | ML-Powered Trading Platform</title>
        <meta name="description" content="Trade smarter with ML. Flux uses machine learning to analyze markets and execute trades with precision." />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: colors.bgPrimary,
        color: colors.textPrimary,
        fontFamily: fontFamily.sans,
        overflow: 'hidden',
      }}>
        {/* Styles */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(212, 165, 116, 0.3); }
            50% { box-shadow: 0 0 40px rgba(212, 165, 116, 0.5); }
          }

          @keyframes chart-line {
            0% { stroke-dashoffset: 1000; }
            100% { stroke-dashoffset: 0; }
          }

          @keyframes bar-grow {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }

          .nav-link {
            position: relative;
            transition: color 0.2s ease;
          }

          .nav-link:hover {
            color: ${colors.accent} !important;
          }

          .feature-card {
            transition: all 0.3s ease;
          }

          .feature-card:hover {
            transform: translateY(-4px);
            border-color: ${colors.borderAccent} !important;
          }

          .step-card {
            transition: all 0.3s ease;
          }

          .step-card:hover {
            background: ${colors.bgTertiary} !important;
          }

          .cta-button {
            transition: all 0.2s ease;
          }

          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(212, 165, 116, 0.3) !important;
          }

          .ghost-button {
            transition: all 0.2s ease;
          }

          .ghost-button:hover {
            background: ${colors.bgTertiary} !important;
            border-color: ${colors.borderLight} !important;
          }

          @media (max-width: 968px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
              text-align: center;
            }
            .hero-visual {
              display: none !important;
            }
            .features-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .steps-grid {
              grid-template-columns: 1fr !important;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .hero-buttons {
              justify-content: center !important;
            }
            .landing-section {
              padding: 60px 16px !important;
            }
            .landing-hero-title {
              font-size: 36px !important;
            }
          }

          @media (max-width: 640px) {
            .features-grid {
              grid-template-columns: 1fr !important;
            }
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
            .landing-hero-title {
              font-size: 28px !important;
            }
            .landing-section {
              padding: 40px 12px !important;
            }
            .hero-buttons {
              flex-direction: column !important;
              width: 100% !important;
            }
            .hero-buttons button, .hero-buttons a {
              width: 100% !important;
            }
          }
        `}</style>

        {/* Navigation */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 24px',
          ...glassStyle,
          borderBottom: `1px solid ${colors.border}`,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Logo */}
            <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src="/images/flux_new_logo.png"
                alt="Flux"
                style={{ height: 44, width: 'auto' }}
              />
            </a>

            {/* Nav Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  boxShadow: '0 2px 8px rgba(212, 165, 116, 0.2)',
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
        }}>
          {/* Background gradient */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 30% 20%, rgba(212, 165, 116, 0.08) 0%, transparent 50%),
                         radial-gradient(ellipse at 70% 80%, rgba(212, 165, 116, 0.05) 0%, transparent 40%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
          }} className="hero-grid">
            {/* Hero Content */}
            <div style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: borderRadius.full,
                background: colors.accentDark,
                border: `1px solid ${colors.borderAccent}`,
                marginBottom: 24,
              }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.accent,
                  animation: 'pulse-glow 2s infinite',
                }} />
                <span style={{
                  fontSize: fontSize.xs,
                  fontWeight: fontWeight.semibold,
                  color: colors.accent,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}>
                  ML-Powered Trading
                </span>
              </div>

              {/* Headline */}
              <h1 className="landing-hero-title" style={{
                fontSize: 56,
                fontWeight: fontWeight.extrabold,
                lineHeight: 1.1,
                marginBottom: 24,
                letterSpacing: '-0.03em',
              }}>
                Trade Smarter<br />
                <span style={{ color: colors.accent }}>with ML</span>
              </h1>

              {/* Subheadline */}
              <p style={{
                fontSize: fontSize.lg,
                color: colors.textSecondary,
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 480,
              }}>
                Flux uses machine learning to analyze market patterns and execute trades with precision.
                Set your strategy once, let ML handle the rest.
              </p>

              {/* CTA Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }} className="hero-buttons">
                <button
                  onClick={() => router.push('/login?signup=true')}
                  className="cta-button"
                  style={{
                    padding: '16px 32px',
                    borderRadius: borderRadius.md,
                    background: colors.accent,
                    border: 'none',
                    color: colors.bgPrimary,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    fontFamily: fontFamily.sans,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(212, 165, 116, 0.25)',
                  }}
                >
                  Start Trading Free
                </button>
                <button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="ghost-button"
                  style={{
                    padding: '16px 32px',
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
                  Learn More
                </button>
              </div>
            </div>

            {/* Hero Visual - Animated Chart */}
            <div className="hero-visual" style={{
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
              position: 'relative',
            }}>
              <div style={{
                background: colors.bgCard,
                borderRadius: borderRadius.xl,
                border: `1px solid ${colors.border}`,
                padding: 24,
                boxShadow: shadows.xl,
                animation: 'float 6s ease-in-out infinite',
              }}>
                {/* Chart Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}>
                  <div>
                    <div style={{
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                      marginBottom: 4,
                    }}>
                      Portfolio Value
                    </div>
                    <div style={{
                      fontSize: fontSize['2xl'],
                      fontWeight: fontWeight.bold,
                      fontFamily: fontFamily.mono,
                    }}>
                      $124,832.50
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: borderRadius.full,
                    background: colors.successDark,
                    color: colors.success,
                    fontSize: fontSize.sm,
                    fontWeight: fontWeight.semibold,
                  }}>
                    +12.4%
                  </div>
                </div>

                {/* SVG Chart */}
                <svg viewBox="0 0 400 150" style={{ width: '100%', height: 150 }}>
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 50}
                      x2="400"
                      y2={i * 50}
                      stroke={colors.border}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Area fill */}
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,120 C50,100 80,110 120,80 C160,50 200,70 240,40 C280,10 320,30 360,20 L360,150 L0,150 Z"
                    fill="url(#chartGradient)"
                  />

                  {/* Main line */}
                  <path
                    d="M0,120 C50,100 80,110 120,80 C160,50 200,70 240,40 C280,10 320,30 360,20"
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 1000,
                      animation: 'chart-line 2s ease forwards',
                    }}
                  />

                  {/* Data points */}
                  {[[0, 120], [120, 80], [240, 40], [360, 20]].map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="5"
                      fill={colors.bgPrimary}
                      stroke={colors.accent}
                      strokeWidth="2"
                      style={{
                        opacity: isLoaded ? 1 : 0,
                        transition: `opacity 0.3s ease ${0.5 + i * 0.1}s`,
                      }}
                    />
                  ))}
                </svg>

                {/* Stats row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  marginTop: 20,
                  paddingTop: 20,
                  borderTop: `1px solid ${colors.border}`,
                }}>
                  {[
                    { label: 'Win Rate', value: '89%', color: colors.success },
                    { label: 'Trades', value: '147', color: colors.textPrimary },
                    { label: 'P&L', value: '+$12.4K', color: colors.success },
                  ].map((stat, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                        marginBottom: 4,
                      }}>
                        {stat.label}
                      </div>
                      <div style={{
                        fontSize: fontSize.md,
                        fontWeight: fontWeight.bold,
                        color: stat.color,
                        fontFamily: fontFamily.mono,
                      }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{
          padding: '100px 24px',
          background: colors.bgSecondary,
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.bold,
                marginBottom: 16,
              }}>
                Everything You Need to Trade
              </h2>
              <p style={{
                fontSize: fontSize.lg,
                color: colors.textSecondary,
                maxWidth: 600,
                margin: '0 auto',
              }}>
                Powerful features designed to give you an edge in the markets.
              </p>
            </div>

            {/* Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 24,
            }} className="features-grid">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="feature-card"
                  style={{
                    background: colors.bgCard,
                    borderRadius: borderRadius.lg,
                    border: `1px solid ${colors.border}`,
                    padding: 28,
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 * i}s`,
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: borderRadius.md,
                    background: colors.accentDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    marginBottom: 20,
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{
                    fontSize: fontSize.md,
                    fontWeight: fontWeight.semibold,
                    marginBottom: 12,
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontSize: fontSize.sm,
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                  }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{
          padding: '100px 24px',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{
                fontSize: fontSize['2xl'],
                fontWeight: fontWeight.bold,
                marginBottom: 16,
              }}>
                How It Works
              </h2>
              <p style={{
                fontSize: fontSize.lg,
                color: colors.textSecondary,
                maxWidth: 600,
                margin: '0 auto',
              }}>
                Get started in minutes with three simple steps.
              </p>
            </div>

            {/* Steps */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 32,
            }} className="steps-grid">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="step-card"
                  style={{
                    padding: 32,
                    borderRadius: borderRadius.lg,
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                    position: 'relative',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 * i}s`,
                  }}
                >
                  <div style={{
                    fontSize: 48,
                    fontWeight: fontWeight.extrabold,
                    color: colors.accentDark,
                    marginBottom: 16,
                    fontFamily: fontFamily.mono,
                  }}>
                    {step.number}
                  </div>
                  <h3 style={{
                    fontSize: fontSize.lg,
                    fontWeight: fontWeight.semibold,
                    marginBottom: 12,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontSize: fontSize.sm,
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                  }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{
          padding: '80px 24px',
          background: colors.bgSecondary,
        }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 32,
            }} className="stats-grid">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                    transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 * i}s`,
                  }}
                >
                  <div style={{
                    fontSize: 40,
                    fontWeight: fontWeight.extrabold,
                    color: colors.accent,
                    marginBottom: 8,
                    fontFamily: fontFamily.mono,
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: fontSize.sm,
                    color: colors.textSecondary,
                    fontWeight: fontWeight.medium,
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '120px 24px',
          position: 'relative',
        }}>
          {/* Background accent */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            background: `radial-gradient(circle, rgba(212, 165, 116, 0.1) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{
            maxWidth: 700,
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
          }}>
            <h2 style={{
              fontSize: fontSize['3xl'],
              fontWeight: fontWeight.extrabold,
              marginBottom: 20,
              lineHeight: 1.2,
            }}>
              Ready to Trade Smarter?
            </h2>
            <p style={{
              fontSize: fontSize.lg,
              color: colors.textSecondary,
              marginBottom: 40,
              lineHeight: 1.6,
            }}>
              Join thousands of traders using ML to gain an edge in the markets.
              Start with paper trading, no credit card required.
            </p>
            <button
              onClick={() => router.push('/login?signup=true')}
              className="cta-button"
              style={{
                padding: '18px 48px',
                borderRadius: borderRadius.md,
                background: colors.accent,
                border: 'none',
                color: colors.bgPrimary,
                fontSize: fontSize.lg,
                fontWeight: fontWeight.bold,
                fontFamily: fontFamily.sans,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(212, 165, 116, 0.3)',
              }}
            >
              Get Started for Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '40px 24px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <div style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}>
              <img
                src="/images/flux_new_logo.png"
                alt="Flux"
                style={{ height: 32, width: 'auto', opacity: 0.8 }}
              />
              <span style={{
                fontSize: fontSize.sm,
                color: colors.textMuted,
              }}>
                {new Date().getFullYear()} Flux Trading. All rights reserved.
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
            }}>
              {['Privacy', 'Terms', 'Contact'].map((link) => (
                <a
                  key={link}
                  href={`/${link.toLowerCase()}`}
                  style={{
                    fontSize: fontSize.sm,
                    color: colors.textSecondary,
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.color = colors.accent}
                  onMouseLeave={(e) => e.target.style.color = colors.textSecondary}
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
