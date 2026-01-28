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
// COLORS - Rich dark theme with subtle blue undertones
// =============================================================================

export const colors = {
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
