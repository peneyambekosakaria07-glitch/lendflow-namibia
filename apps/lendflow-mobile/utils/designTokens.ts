// Design tokens from design-tokens.json
// Used across all mobile screens

export const colors = {
  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1A1A1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  accent: '#CCFF00',
  info: '#00F0FF',
  success: '#00E676',
  warning: '#FFD600',
  danger: '#FF3B3B',
  border: '#222222',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontFamily: {
    heading: 'Archivo Black, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    huge: 48,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
};