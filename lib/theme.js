// lib/theme.js - Dark Luxe Trading UI Design System
// Premium navy-charcoal with gold accents

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const fontFamily = {
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'DM Sans', 'Plus Jakarta Sans', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
};

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '15px',
  md: '16px',
  lg: '18px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
  hero: '56px',
};

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
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
// DARK LUXE THEME - Navy-charcoal with gold accents
// =============================================================================

export const darkTheme = {
  // Backgrounds - rich navy-charcoal tones
  bgPrimary: '#0D1117',
  bgSecondary: '#161B22',
  bgTertiary: '#21262D',
  bgCard: '#161B22',
  bgHover: '#21262D',
  bgElevated: '#1C2128',

  // Accent (Gold/Copper)
  accent: '#D4A574',
  accentHover: '#E8C19A',
  accentMuted: '#B8734D',
  accentDark: 'rgba(212, 165, 116, 0.15)',
  accentGlow: 'rgba(212, 165, 116, 0.1)',

  // Text - clean hierarchy (lighter for readability)
  textPrimary: '#F0F6FC',
  textSecondary: '#A8B2BC',
  textMuted: '#6E7681',

  // Status - refined semantic colors
  success: '#3FB950',
  successDark: 'rgba(63, 185, 80, 0.15)',
  error: '#F85149',
  errorDark: 'rgba(248, 81, 73, 0.15)',
  warning: '#D29922',
  warningDark: 'rgba(210, 153, 34, 0.15)',
  info: '#58A6FF',
  infoDark: 'rgba(88, 166, 255, 0.15)',

  // Borders - subtle
  border: '#30363D',
  borderLight: '#3D444D',
  borderAccent: 'rgba(212, 165, 116, 0.4)',
};

// Keep lightTheme export for backwards compatibility but it's now same as dark
export const lightTheme = darkTheme;

// Default colors export
export const colors = darkTheme;

// =============================================================================
// GLASSMORPHISM STYLES
// =============================================================================

export const glassStyle = {
  background: 'rgba(22, 27, 34, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(48, 54, 61, 0.6)',
};

// Legacy exports for backwards compatibility
export const glassStyleDark = glassStyle;
export const glassStyleLight = glassStyle;
export const getGlassStyle = () => glassStyle;
export const getThemeColors = () => darkTheme;

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
// SHADOWS - Sophisticated multi-layer system
// =============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
  md: '0 2px 4px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.2)',
  card: '0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.12)',
};

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
  spring: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// =============================================================================
// ANIMATIONS - Enterprise-grade motion system
// =============================================================================

export const animations = {
  // Durations
  instant: '0.1s',
  fast: '0.15s',
  normal: '0.25s',
  slow: '0.4s',

  // Easings
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Keyframe names (reference for CSS)
  fadeIn: 'fadeIn',
  fadeOut: 'fadeOut',
  slideUp: 'slideUp',
  slideDown: 'slideDown',
  shimmer: 'shimmer',
  pulse: 'pulse',
  scaleIn: 'scaleIn',
};

// =============================================================================
// HOVER STATES - Consistent interaction feedback
// =============================================================================

export const hoverStates = {
  card: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(212, 165, 116, 0.2)',
    borderColor: 'rgba(212, 165, 116, 0.4)',
  },
  cardSubtle: {
    borderColor: 'rgba(212, 165, 116, 0.3)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  button: {
    transform: 'scale(1.02)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  buttonPrimary: {
    background: '#E8C19A',
    boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)',
  },
  link: {
    color: '#E8C19A',
    textDecoration: 'underline',
  },
  icon: {
    color: '#D4A574',
    transform: 'scale(1.1)',
  },
  row: {
    background: '#21262D',
  },
};

// =============================================================================
// ACTIVE/PRESSED STATES - Micro-interactions
// =============================================================================

export const activeStates = {
  button: {
    transform: 'scale(0.98)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
  },
  card: {
    transform: 'scale(0.99)',
  },
};

// =============================================================================
// FOCUS STATES - Accessibility
// =============================================================================

export const focusStates = {
  default: {
    outline: '2px solid #D4A574',
    outlineOffset: '2px',
  },
  inset: {
    boxShadow: 'inset 0 0 0 2px #D4A574',
  },
  ring: {
    boxShadow: '0 0 0 3px rgba(212, 165, 116, 0.4)',
  },
};

// =============================================================================
// VISUAL EFFECTS - Dark Luxe Aesthetic
// =============================================================================

export const visualEffects = {
  // Subtle grid pattern
  gridPattern: 'none',
  scanlines: 'none',

  // Simplified - no glow effects
  dataGlow: 'none',
  dataGlowStrong: 'none',
  errorGlow: 'none',
  successGlow: 'none',

  // Simplified gradient for risk visualization - softer
  dangerGradient: 'linear-gradient(90deg, rgba(248,81,73,0.3) 0%, rgba(210,153,34,0.2) 50%, rgba(63,185,80,0.3) 100%)',
  safeZoneGradient: 'linear-gradient(90deg, rgba(248,81,73,0.2) 0%, rgba(63,185,80,0.15) 50%, rgba(248,81,73,0.2) 100%)',

  // Backgrounds - solid with subtle opacity
  positiveBg: 'rgba(63, 185, 80, 0.1)',
  negativeBg: 'rgba(248, 81, 73, 0.1)',

  // Card - solid background (no gradient)
  cardGradient: colors.bgCard,
};

// Legacy exports
export const visualEffectsLight = visualEffects;
export const getVisualEffects = () => visualEffects;

// =============================================================================
// DATA FRESHNESS COLORS
// =============================================================================

export const freshnessColors = {
  fresh: '#3FB950',
  stale: '#D29922',
  old: '#F85149',
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

// Card - clean solid background
export const cardStyle = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: spacing.xl,
  boxShadow: shadows.card,
  transition: `all ${transitions.normal}`,
};

export const cardHoverStyle = {
  borderColor: colors.borderAccent,
  boxShadow: shadows.md,
};

// Buttons - Gold primary
export const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  padding: '12px 20px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgTertiary,
  color: colors.textPrimary,
  fontSize: fontSize.sm,
  fontWeight: fontWeight.semibold,
  fontFamily: fontFamily.sans,
  cursor: 'pointer',
  transition: `all ${transitions.fast}`,
  outline: 'none',
};

export const buttonPrimaryStyle = {
  ...buttonStyle,
  background: colors.accent,
  border: 'none',
  color: colors.bgPrimary,
  fontWeight: fontWeight.bold,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
};

export const buttonDangerStyle = {
  ...buttonStyle,
  background: colors.errorDark,
  borderColor: 'rgba(248, 81, 73, 0.3)',
  color: colors.error,
};

export const buttonGhostStyle = {
  ...buttonStyle,
  background: 'transparent',
  border: 'none',
  color: colors.textSecondary,
};

// Input - darker background with gold focus
export const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgPrimary,
  color: colors.textPrimary,
  fontSize: fontSize.sm,
  fontFamily: fontFamily.sans,
  outline: 'none',
  transition: `all ${transitions.fast}`,
};

export const inputFocusStyle = {
  borderColor: colors.accent,
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

// Toggle - Gold when ON
export const toggleOnStyle = {
  border: `1px solid ${colors.accent}`,
  background: colors.accentDark,
  color: colors.accent,
  borderRadius: borderRadius.full,
  padding: '6px 14px',
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
  padding: '6px 14px',
  fontSize: fontSize.xs,
  fontWeight: fontWeight.bold,
  cursor: 'pointer',
  transition: `all ${transitions.fast}`,
};

// =============================================================================
// SEMANTIC STYLES
// =============================================================================

export const decisionColors = {
  BUY: colors.success,
  SELL: colors.error,
  HOLD: colors.textMuted,
};

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
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.tight,
    color: colors.textPrimary,
    fontFamily: fontFamily.sans,
  },
  h2: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
    lineHeight: lineHeight.tight,
    color: colors.textPrimary,
    fontFamily: fontFamily.sans,
  },
  h3: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    color: colors.textPrimary,
    fontFamily: fontFamily.sans,
  },
  body: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    color: colors.textPrimary,
    fontFamily: fontFamily.sans,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.normal,
    color: colors.textSecondary,
    fontFamily: fontFamily.sans,
  },
  caption: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    color: colors.textMuted,
    fontFamily: fontFamily.sans,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: fontFamily.sans,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
};
