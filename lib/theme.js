// lib/theme.js - Professional Trading UI Design System

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fontFamily = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};

export const fontSize = {
  xs: '11px',
  sm: '13px',
  base: '14px',
  md: '16px',
  lg: '18px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
};

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const letterSpacing = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.05em',
};

// =============================================================================
// THEME COLORS - Dark and Light modes
// =============================================================================

export const darkTheme = {
  // Backgrounds - subtle blue undertone for depth
  bgPrimary: '#08090a',
  bgSecondary: '#0d0f12',
  bgTertiary: '#13161a',
  bgCard: '#0d0f12',
  bgHover: '#1a1d23',
  bgElevated: '#181b21',

  // Accent (Green)
  accent: '#00ff88',
  accentHover: '#00e67a',
  accentMuted: '#00cc6a',
  accentDark: 'rgba(0, 255, 136, 0.12)',
  accentGlow: 'rgba(0, 255, 136, 0.08)',

  // Text - better contrast hierarchy
  textPrimary: '#f0f2f5',
  textSecondary: '#8b919a',
  textMuted: '#5c6370',

  // Status
  success: '#00ff88',
  error: '#ff5f6d',
  errorDark: 'rgba(255, 95, 109, 0.12)',
  warning: '#ffb347',
  warningDark: 'rgba(255, 179, 71, 0.12)',
  info: '#5c9eff',

  // Borders - softer
  border: '#1e2228',
  borderLight: '#2a2f38',
  borderAccent: 'rgba(0, 255, 136, 0.25)',
};

export const lightTheme = {
  // Backgrounds - clean white/gray
  bgPrimary: '#f8f9fa',
  bgSecondary: '#ffffff',
  bgTertiary: '#f0f2f5',
  bgCard: '#ffffff',
  bgHover: '#e9ecef',
  bgElevated: '#ffffff',

  // Accent (Green - slightly darker for light mode contrast)
  accent: '#00aa55',
  accentHover: '#009948',
  accentMuted: '#00883d',
  accentDark: 'rgba(0, 170, 85, 0.12)',
  accentGlow: 'rgba(0, 170, 85, 0.08)',

  // Text - dark text for light mode
  textPrimary: '#1a1a1a',
  textSecondary: '#4a5568',
  textMuted: '#718096',

  // Status
  success: '#00aa55',
  error: '#e53e3e',
  errorDark: 'rgba(229, 62, 62, 0.12)',
  warning: '#d69e2e',
  warningDark: 'rgba(214, 158, 46, 0.12)',
  info: '#3182ce',

  // Borders - subtle gray
  border: '#e2e8f0',
  borderLight: '#cbd5e0',
  borderAccent: 'rgba(0, 170, 85, 0.25)',
};

// Default colors export (dark theme for backwards compatibility)
export const colors = darkTheme;

// =============================================================================
// GLASSMORPHISM STYLES
// =============================================================================

export const glassStyleDark = {
  background: 'rgba(13, 15, 18, 0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

export const glassStyleLight = {
  background: 'rgba(255, 255, 255, 0.75)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
};

// Helper to get glass style based on theme
export const getGlassStyle = (theme = 'dark') =>
  theme === 'light' ? glassStyleLight : glassStyleDark;

// Helper to get theme colors
export const getThemeColors = (theme = 'dark') =>
  theme === 'light' ? lightTheme : darkTheme;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  '3xl': 48,
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// =============================================================================
// SHADOWS - Multi-level elevation system
// =============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
  md: '0 4px 12px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.6)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.7)',
  glow: '0 0 20px rgba(0, 255, 136, 0.15)',
  glowStrong: '0 0 30px rgba(0, 255, 136, 0.25)',
  inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.3)',
};

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '0.1s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
};

// =============================================================================
// VISUAL EFFECTS - Trading Terminal Aesthetic
// =============================================================================

export const visualEffects = {
  // Terminal grid pattern background
  gridPattern: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(0, 255, 136, 0.02) 40px,
      rgba(0, 255, 136, 0.02) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(0, 255, 136, 0.02) 40px,
      rgba(0, 255, 136, 0.02) 41px
    )
  `,

  // Subtle scanline effect
  scanlines: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    )
  `,

  // Data glow effects
  dataGlow: '0 0 20px rgba(0, 255, 136, 0.3)',
  dataGlowStrong: '0 0 30px rgba(0, 255, 136, 0.5)',
  errorGlow: '0 0 20px rgba(255, 95, 109, 0.3)',

  // Danger gradient for risk visualization (value indicator)
  dangerGradient: 'linear-gradient(90deg, #ff5f6d 0%, #ffb347 25%, #00ff88 50%, #ffb347 75%, #ff5f6d 100%)',

  // Safe zone gradient (green center, yellow edges)
  safeZoneGradient: 'linear-gradient(90deg, #ff5f6d 0%, #ffb347 15%, #00ff88 35%, #00ff88 65%, #ffb347 85%, #ff5f6d 100%)',

  // Positive/negative backgrounds
  positiveBg: 'rgba(0, 255, 136, 0.08)',
  negativeBg: 'rgba(255, 95, 109, 0.08)',

  // Pulsing animation for live indicators
  pulseAnimation: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  // Data streaming indicator
  streamAnimation: `
    @keyframes stream {
      0% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1); }
      100% { opacity: 0.3; transform: scale(0.8); }
    }
  `,
};

// Light theme visual effects (toned down)
export const visualEffectsLight = {
  gridPattern: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 40px,
      rgba(0, 170, 85, 0.03) 40px,
      rgba(0, 170, 85, 0.03) 41px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 40px,
      rgba(0, 170, 85, 0.03) 40px,
      rgba(0, 170, 85, 0.03) 41px
    )
  `,
  scanlines: 'none',
  dataGlow: '0 0 15px rgba(0, 170, 85, 0.2)',
  dataGlowStrong: '0 0 25px rgba(0, 170, 85, 0.35)',
  errorGlow: '0 0 15px rgba(229, 62, 62, 0.2)',
  dangerGradient: 'linear-gradient(90deg, #e53e3e 0%, #d69e2e 25%, #00aa55 50%, #d69e2e 75%, #e53e3e 100%)',
  safeZoneGradient: 'linear-gradient(90deg, #e53e3e 0%, #d69e2e 15%, #00aa55 35%, #00aa55 65%, #d69e2e 85%, #e53e3e 100%)',
  positiveBg: 'rgba(0, 170, 85, 0.08)',
  negativeBg: 'rgba(229, 62, 62, 0.08)',
};

// Helper to get visual effects based on theme
export const getVisualEffects = (theme = 'dark') =>
  theme === 'light' ? visualEffectsLight : visualEffects;

// =============================================================================
// DATA FRESHNESS COLORS
// =============================================================================

export const freshnessColors = {
  fresh: '#00ff88',      // < 30 seconds
  stale: '#ffb347',      // < 2 minutes
  old: '#ff5f6d',        // > 2 minutes
};

// =============================================================================
// LOOKBACK PRESETS
// =============================================================================

export const lookbackOptions = {
  trades: [
    { value: 10, label: '10' },
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
  ],
  charts: [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
  ],
  analytics: [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
    { value: 'mtd', label: 'MTD' },
    { value: 'ytd', label: 'YTD' },
    { value: 'custom', label: 'Custom' },
  ],
};

// =============================================================================
// COMPONENT STYLES
// =============================================================================

// Card
export const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  boxShadow: shadows.md,
  transition: `all ${transitions.normal}`,
};

export const cardHoverStyle = {
  borderColor: colors.borderAccent,
  boxShadow: `${shadows.md}, ${shadows.glow}`,
  transform: 'translateY(-1px)',
};

// Buttons
export const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  padding: '10px 18px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgTertiary,
  color: colors.textPrimary,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  cursor: 'pointer',
  transition: `all ${transitions.fast}`,
  outline: 'none',
};

export const buttonPrimaryStyle = {
  ...buttonStyle,
  background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentMuted} 100%)`,
  border: 'none',
  color: colors.bgPrimary,
  fontWeight: fontWeight.bold,
  boxShadow: '0 2px 8px rgba(0, 255, 136, 0.3)',
};

export const buttonDangerStyle = {
  ...buttonStyle,
  background: colors.errorDark,
  borderColor: 'rgba(255, 95, 109, 0.3)',
  color: colors.error,
};

export const buttonGhostStyle = {
  ...buttonStyle,
  background: 'transparent',
  border: 'none',
  color: colors.textSecondary,
};

// Input
export const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgPrimary,
  color: colors.textPrimary,
  fontSize: fontSize.sm,
  outline: 'none',
  transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
};

export const inputFocusStyle = {
  borderColor: colors.accentMuted,
  boxShadow: `0 0 0 3px ${colors.accentDark}`,
};

// Badge
export const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: borderRadius.full,
  border: `1px solid ${colors.border}`,
  background: colors.bgCard,
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
};

// Toggle
export const toggleOnStyle = {
  border: `1px solid ${colors.accentMuted}`,
  background: colors.accentDark,
  color: colors.accent,
  borderRadius: borderRadius.full,
  padding: '4px 12px',
  fontSize: fontSize.xs,
  fontWeight: fontWeight.bold,
  cursor: 'pointer',
  transition: `all ${transitions.fast}`,
};

export const toggleOffStyle = {
  border: `1px solid ${colors.border}`,
  background: colors.bgSecondary,
  color: colors.textMuted,
  borderRadius: borderRadius.full,
  padding: '4px 12px',
  fontSize: fontSize.xs,
  fontWeight: fontWeight.bold,
  cursor: 'pointer',
  transition: `all ${transitions.fast}`,
};

// =============================================================================
// SEMANTIC STYLES
// =============================================================================

// Decision colors
export const decisionColors = {
  BUY: colors.accent,
  SELL: colors.error,
  HOLD: colors.textMuted,
};

// Table
export const tableRowHoverBg = colors.bgHover;

export const tableHeaderStyle = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: letterSpacing.wide,
  background: colors.bgSecondary,
  borderBottom: `1px solid ${colors.border}`,
};

export const tableCellStyle = {
  padding: '14px 16px',
  fontSize: fontSize.sm,
  borderBottom: `1px solid ${colors.border}`,
};

// Skeleton loading animation
export const skeletonStyle = {
  background: `linear-gradient(90deg, ${colors.bgSecondary} 25%, ${colors.bgTertiary} 50%, ${colors.bgSecondary} 75%)`,
  backgroundSize: '200% 100%',
  borderRadius: borderRadius.sm,
  animation: 'shimmer 1.5s infinite',
};

// =============================================================================
// TYPOGRAPHY PRESETS
// =============================================================================

export const typography = {
  h1: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.tight,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.tight,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    color: colors.textPrimary,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    color: colors.textMuted,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
};
