import { LIGANDS } from '../constants/ligands';
import { LigandItem, Atom } from '../types/protein.types';

export const isValidLigandId = (id: string): boolean => {
  const result = /^[A-Z0-9]{1,5}$/.test(id.toUpperCase().trim());
  console.log(`[isValidLigandId] Input: "${id}" -> Output: ${result}`);
  return result;
};

export const getLigandItems = (): LigandItem[] => {
  return LIGANDS.map((id, index) => ({ id, index }));
};

export const filterLigands = (
  ligands: LigandItem[],
  query: string
): LigandItem[] => {
  if (!query.trim()) return ligands;
  const normalized = query.toUpperCase().trim();
  return ligands.filter((l) => l.id.includes(normalized));
};

export const getMolecularFormula = (atoms: Atom[]): string => {
  const elementCounts: Record<string, number> = {};

  atoms.forEach((atom) => {
    const element = atom.element.toUpperCase();
    elementCounts[element] = (elementCounts[element] || 0) + 1;
  });

  const sortedElements = Object.keys(elementCounts).sort((a, b) => {
    if (a === 'C') return -1;
    if (b === 'C') return 1;
    if (a === 'H') return -1;
    if (b === 'H') return 1;
    return a.localeCompare(b);
  });

  return sortedElements
    .map((element) => {
      const count = elementCounts[element];
      return count === 1 ? element : `${element}${count}`;
    })
    .join('');
};

export const getElementStats = (atoms: Atom[]): Record<string, number> => {
  const stats: Record<string, number> = {};
  atoms.forEach((atom) => {
    const element = atom.element.toUpperCase();
    stats[element] = (stats[element] || 0) + 1;
  });
  return stats;
};

export const getElementColor = (element: string): string => {
  const colors: Record<string, string> = {
    H: '#FFFFFF',
    C: '#000000',
    N: '#0000FF',
    O: '#FF0000',
    S: '#FFFF00',
    P: '#FFA500',
    F: '#90EE90',
    Cl: '#90EE90',
    Br: '#8B4513',
    I: '#A020F0',
  };
  return colors[element.toUpperCase()] || '#CCCCCC';
};

export const getElementDescription = (element: string): string => {
  const descriptions: Record<string, string> = {
    H: 'Hydrogen - Critical for organic molecules',
    C: 'Carbon - Foundation of organic chemistry',
    N: 'Nitrogen - Essential for proteins and nucleic acids',
    O: 'Oxygen - Crucial for respiration and water',
    S: 'Sulfur - Important in amino acids and proteins',
    P: 'Phosphorus - Key for DNA/RNA and energy',
    F: 'Fluorine - Highly reactive halogen',
    Cl: 'Chlorine - Common in salts and disinfectants',
    Br: 'Bromine - Reddish-brown halogen',
    I: 'Iodine - Essential micronutrient',
  };
  return descriptions[element.toUpperCase()] || 'Element - Unknown';
};