import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, Directory, File } from 'expo-file-system';

const CACHE_DIR = new Directory(Paths.cache, 'ligands');
const CACHE_INDEX_KEY = '@ligand_cache_index';

export interface CacheEntry {
  ligandId: string;
  timestamp: number;
  fileSize: number;
}

/**
 * Initialize cache directory
 */
export const initializeCache = async () => {
  try {
    if (!CACHE_DIR.exists) {
      CACHE_DIR.create();
    }
  } catch (error) {
    console.error('Error initializing cache:', error);
  }
};

/**
 * Save CIF file to cache
 */
export const saveToCacheAsync = async (
  ligandId: string,
  cifContent: string
): Promise<boolean> => {
  try {
    const file = new File(CACHE_DIR, `${ligandId}.cif`);
    file.write(cifContent);

    // Update cache index
    const index = await getCacheIndexAsync();
    index[ligandId] = {
      ligandId,
      timestamp: Date.now(),
      fileSize: cifContent.length,
    };
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));

    return true;
  } catch (error) {
    console.error(`Error saving ${ligandId} to cache:`, error);
    return false;
  }
};

/**
 * Get CIF file from cache
 */
export const getFromCacheAsync = async (ligandId: string): Promise<string | null> => {
  try {
    const file = new File(CACHE_DIR, `${ligandId}.cif`);

    if (file.exists) {
      const content = await file.text();
      return content;
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${ligandId} from cache:`, error);
    return null;
  }
};

/**
 * Check if ligand is cached
 */
export const isCachedAsync = async (ligandId: string): Promise<boolean> => {
  try {
    const index = await getCacheIndexAsync();
    return ligandId in index;
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};

/**
 * Get cache index
 */
export const getCacheIndexAsync = async (): Promise<Record<string, CacheEntry>> => {
  try {
    const indexJson = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    return indexJson ? JSON.parse(indexJson) : {};
  } catch (error) {
    console.error('Error getting cache index:', error);
    return {};
  }
};

/**
 * Clear specific cached ligand
 */
export const clearCacheAsync = async (ligandId: string): Promise<boolean> => {
  try {
    const file = new File(CACHE_DIR, `${ligandId}.cif`);
    
    if (file.exists) {
      await file.delete();
    }

    const index = await getCacheIndexAsync();
    delete index[ligandId];
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));

    return true;
  } catch (error) {
    console.error(`Error clearing cache for ${ligandId}:`, error);
    return false;
  }
};

/**
 * Clear all cache
 */
export const clearAllCacheAsync = async (): Promise<boolean> => {
  try {
    if (CACHE_DIR.exists) {
      await CACHE_DIR.delete();
    }
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
    await initializeCache();
    return true;
  } catch (error) {
    console.error('Error clearing all cache:', error);
    return false;
  }
};

/**
 * Get cache size in bytes
 */
export const getCacheSizeAsync = async (): Promise<number> => {
  try {
    const index = await getCacheIndexAsync();
    return Object.values(index).reduce((total, entry) => total + entry.fileSize, 0);
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};
