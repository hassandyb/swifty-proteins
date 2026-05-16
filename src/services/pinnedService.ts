import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@pinned_ligands';

export interface PinnedLigand {
  ligandId: string;
  addedAt: number;
}

/**
 * Get all pinned ligands
 */
export const getPinnedLigandsAsync = async (): Promise<PinnedLigand[]> => {
  try {
    const json = await AsyncStorage.getItem(FAVORITES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error getting pinned ligands:', error);
    return [];
  }
};

/**
 * Add ligand to pinned
 */
export const pinLigandAsync = async (ligandId: string): Promise<boolean> => {
  try {
    const pinned = await getPinnedLigandsAsync();
    
    // Check if already pinned
    if (pinned.some(l => l.ligandId === ligandId)) {
      return true;
    }

    pinned.unshift({ ligandId, addedAt: Date.now() });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(pinned));
    return true;
  } catch (error) {
    console.error(`Error pinning ${ligandId}:`, error);
    return false;
  }
};

/**
 * Remove ligand from pinned
 */
export const unpinLigandAsync = async (ligandId: string): Promise<boolean> => {
  try {
    let pinned = await getPinnedLigandsAsync();
    pinned = pinned.filter(l => l.ligandId !== ligandId);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(pinned));
    return true;
  } catch (error) {
    console.error(`Error unpinning ${ligandId}:`, error);
    return false;
  }
};

/**
 * Check if ligand is pinned
 */
export const isPinnedAsync = async (ligandId: string): Promise<boolean> => {
  try {
    const pinned = await getPinnedLigandsAsync();
    return pinned.some(l => l.ligandId === ligandId);
  } catch (error) {
    console.error('Error checking if pinned:', error);
    return false;
  }
};

/**
 * Clear all pinned ligands
 */
export const clearPinnedAsync = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing pinned:', error);
    return false;
  }
};
