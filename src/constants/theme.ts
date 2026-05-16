export type Theme = {
  bg: string;
  surface: string;
  card: string;
  border: string;
  accent: string;
  accentDim: string;
  text: string;
  muted: string;
  success: string;
  danger: string;
  warning: string;
  barColor: string;
};

export const darkTheme: Theme = {
  bg: '#000000',
  surface: '#000000',
  card: '#111111',
  border: 'rgba(255,255,255,0.1)',
  accent: '#ffffff',
  accentDim: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  muted: '#999999',
  success: '#4ade80',
  danger: '#f87171',
  warning: '#fbbf24',
  barColor: '#555555',
};

export const lightTheme: Theme = {
  bg: '#ffffff',
  surface: '#ffffff',
  card: '#f1f5f9',
  border: 'rgba(0,0,0,0.1)',
  accent: '#000000',
  accentDim: 'rgba(0,0,0,0.08)',
  text: '#000000',
  muted: '#6b7280',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  barColor: '#9ca3af',
};

// Default exported statically for legacy files that aren't yet refactored
export const COLORS = darkTheme;

export const CPK_COLORS = {
  H:  '#FFFFFF',
  C:  '#404040',
  N:  '#3050F8',
  O:  '#FF0D0D',
  S:  '#FFFF30',
  P:  '#FF8000',
  F:  '#90E050',
  CL: '#1FF01F',
  BR: '#A62929',
  I:  '#940094',
  FE: '#E06633',
  CA: '#3DFF00',
  MG: '#8AFF00',
  ZN: '#7D80B0',
  CU: '#FF8033',
  NA: '#AB5CF2',
  K:  '#8F40D4',
  DEFAULT: '#FF69B4',
} as const;
