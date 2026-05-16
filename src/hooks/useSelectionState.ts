import { useState } from 'react';
import { Atom, Bond } from '../types/protein.types';

export function useSelectionState() {
  const [selectedAtom, setSelectedAtom] = useState<Atom | null>(null);
  const [selectedBond, setSelectedBond] = useState<{ bond: Bond; length: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  const handleAtomDeselect = () => {
    setSelectedAtom(null);
    setSelectedElement(null);
    setSelectedBond(null);
  };

  const handleBondSelect = (bond: Bond, length: number) => {
    setSelectedBond({ bond, length });
    setSelectedAtom(null);
    setSelectedElement(null);
  };

  const handleBondDeselect = () => {
    setSelectedBond(null);
  };

  return {
    selectedAtom, setSelectedAtom,
    selectedBond, setSelectedBond,
    selectedElement, setSelectedElement,
    handleAtomDeselect,
    handleBondSelect,
    handleBondDeselect,
  };
}
