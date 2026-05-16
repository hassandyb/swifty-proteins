import { useState, useCallback } from 'react';
import { Molecule } from '../types/protein.types';
import { cifService, NetworkError, NotFoundError, TimeoutError } from '../services/cifService';
import { parseCif, CifParseError } from '../services/cifParser';

export type LoadingState = 'idle' | 'loading' | 'parsing' | 'success' | 'error';

interface UseProteinReturn {
  molecule: Molecule | null;
  loadingState: LoadingState;
  error: string | null;
  isCached: boolean;
  fetchMolecule: (ligandId: string) => Promise<void>;
  reset: () => void;
}

const getErrorMessage = (err: unknown): string => {
  console.error('[useProtein] Error caught:', err);
  if (err instanceof NotFoundError) {
    return 'Ligand not found (404). This ligand may not exist in the database.';
  }
  if (err instanceof TimeoutError) {
    return 'Request timeout. Please try again.';
  }
  if (err instanceof NetworkError) {
    return err.message || 'No internet connection. Please check your network.';
  }
  if (err instanceof CifParseError) {
    return 'Failed to parse ligand data. The file may be corrupted.';
  }
  return `An unexpected error occurred: ${String(err)}. Please try again.`;
};

export const useProtein = (): UseProteinReturn => {
  const [molecule, setMolecule] = useState<Molecule | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const fetchMolecule = useCallback(async (ligandId: string) => {
    console.log(`[useProtein.fetchMolecule] Called with ligandId: ${ligandId}`);
    setLoadingState('loading');
    setError(null);
    setMolecule(null);

    try {
      console.log(`[useProtein.fetchMolecule] Calling cifService.fetchRaw for ${ligandId}`);
      const { rawText, fromCache } = await cifService.fetchRaw(ligandId);
      console.log(`[useProtein.fetchMolecule] fetchRaw completed, fromCache=${fromCache}, rawText length=${rawText.length}`);
      setIsCached(fromCache);

      setLoadingState('parsing');
      console.log(`[useProtein.fetchMolecule] Starting parseCif...`);
      await new Promise<void>(resolve => setTimeout(resolve, 0)); // yield to UI
      const mol = parseCif(rawText, ligandId.toUpperCase().trim());
      console.log(`[useProtein.fetchMolecule] Parse success: ${mol.atoms.length} atoms`);
      setMolecule(mol);
      setLoadingState('success');
    } catch (err) {
      console.error(`[useProtein.fetchMolecule] ERROR:`, err);
      const msg = getErrorMessage(err);
      setError(msg);
      setLoadingState('error');
    }
  }, []);

  const reset = useCallback(() => {
    setMolecule(null);
    setLoadingState('idle');
    setError(null);
    setIsCached(false);
  }, []);

  return {
    molecule,
    loadingState,
    error,
    isCached,
    fetchMolecule,
    reset,
  };
};