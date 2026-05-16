/**
 * CPK Color mappings for atomic visualization
 * Uses standard Jmol CPK color scheme for molecular structures
 */

export const CPK_COLORS = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  CL: '#1FF01F',
  BR: '#A62929',
  I: '#940094',
  FE: '#E06633',
  CA: '#3DFF00',
  MG: '#8AFF00',
  ZN: '#7D80B0',
  CU: '#FF8033',
  NA: '#AB5CF2',
  K: '#8F40D4',
  DEFAULT: '#FF69B4',
} as const;

/**
 * Get CPK color for an element symbol
 * @param element - Element symbol (e.g., 'C', 'N', 'O')
 * @returns Hex color string (e.g., '#FFFFFF')
 */
export const getCPKColor = (element: string): string => {
  const normalized = element.toUpperCase().trim();
  return CPK_COLORS[normalized as keyof typeof CPK_COLORS] || CPK_COLORS.DEFAULT;
};

/**
 * Alias for getCPKColor for compatibility
 */
export const getElementColor = getCPKColor;

/**
 * Convert hex color string to THREE.Color
 * @param hex - Hex color string (e.g., '#FFFFFF' or 'FFFFFF')
 * @returns THREE.Color object
 */
export const hexToThreeColor = (hex: string): number => {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  return parseInt(cleanHex, 16);
};
