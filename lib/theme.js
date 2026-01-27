// lib/theme.js - Centralized theme constants

export const colors = {
  // Backgrounds
  bgPrimary: '#0a0a0a',
  bgSecondary: '#111111',
  bgTertiary: '#1a1a1a',
  bgCard: '#0f0f0f',

  // Accent (Green)
  accent: '#00ff88',
  accentMuted: '#00cc6a',
  accentDark: '#0a2a1a',
  accentGlow: 'rgba(0, 255, 136, 0.15)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',

  // Status
  success: '#00ff88',
  error: '#ff4757',
  warning: '#ffa502',
  info: '#3498db',

  // Borders
  border: '#222222',
  borderLight: '#333333',
  borderAccent: 'rgba(0, 255, 136, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Common component styles
export const cardStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  background: colors.bgCard,
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

export const cardHoverStyle = {
  ...cardStyle,
  borderColor: colors.borderAccent,
  boxShadow: `0 0 20px ${colors.accentGlow}`,
};

export const buttonStyle = {
  padding: '10px 16px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgSecondary,
  color: colors.textPrimary,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const buttonPrimaryStyle = {
  ...buttonStyle,
  background: colors.accentDark,
  borderColor: colors.accentMuted,
  color: colors.accent,
};

export const buttonDangerStyle = {
  ...buttonStyle,
  background: '#1a0a0a',
  borderColor: '#3b1515',
  color: '#ff6b6b',
};

export const buttonGhostStyle = {
  ...buttonStyle,
  background: 'transparent',
  opacity: 0.9,
};

export const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.border}`,
  background: colors.bgPrimary,
  color: colors.textPrimary,
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

export const inputFocusStyle = {
  borderColor: colors.accentMuted,
};

export const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: borderRadius.full,
  border: `1px solid ${colors.border}`,
  background: colors.bgCard,
  fontSize: 13,
};

export const toggleOnStyle = {
  border: `1px solid ${colors.accentMuted}`,
  background: colors.accentDark,
  color: colors.accent,
  borderRadius: borderRadius.full,
  padding: '4px 12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export const toggleOffStyle = {
  border: `1px solid ${colors.border}`,
  background: colors.bgSecondary,
  color: colors.textMuted,
  borderRadius: borderRadius.full,
  padding: '4px 12px',
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

// Decision colors
export const decisionColors = {
  BUY: colors.accent,
  SELL: colors.error,
  HOLD: colors.textMuted,
};
