import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LigandItem } from '../types/protein.types';
import { getLigandItems, filterLigands } from '../utils/moleculeHelpers';

interface UseLigandsReturn {
  ligands: LigandItem[];
  filteredLigands: LigandItem[];
  searchQuery: string;
  isSearching: boolean;
  setSearchQuery: (q: string) => void;
  clearSearch: () => void;
  totalCount: number;
  filteredCount: number;
}

const DEBOUNCE_MS = 150;

export const useLigands = (): UseLigandsReturn => {
  const allLigands = useMemo(() => getLigandItems(), []);
  const [searchQuery, setSearchQueryRaw] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryRaw(q);
    setIsSearching(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(q);
      setIsSearching(false);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const filteredLigands = useMemo(
    () => filterLigands(allLigands, debouncedQuery),
    [allLigands, debouncedQuery]
  );

  const clearSearch = useCallback(() => {
    setSearchQueryRaw('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  return {
    ligands: allLigands,
    filteredLigands,
    searchQuery,
    isSearching,
    setSearchQuery,
    clearSearch,
    totalCount: allLigands.length,
    filteredCount: filteredLigands.length,
  };
};