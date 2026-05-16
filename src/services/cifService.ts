import { Molecule } from '../types/protein.types';
import { API_URLS } from '../constants/api';
import { parseCif, CifParseError } from './cifParser';
import { isValidLigandId } from '../utils/moleculeHelpers';
import { storage } from '../utils/storage';

const CACHE_PREFIX = 'cif_cache_';
const CACHE_VERSION = 'v1';

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends Error {
  constructor(ligandId: string) {
    super(`Ligand ${ligandId} not found in the database.`);
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends Error {
  constructor() {
    super('Request timeout. Please try again.');
    this.name = 'TimeoutError';
  }
}

const getCacheKey = (ligandId: string): string =>
  `${CACHE_PREFIX}${CACHE_VERSION}_${ligandId.toUpperCase()}`;

const getCached = async (ligandId: string): Promise<string | null> => {
  try {
    const cached = await storage.getItem(getCacheKey(ligandId));
    //console.log(`[cifService] getCached for ${ligandId}: ${cached ? 'HIT' : 'MISS'}`);
    return cached;
  } catch (error) {
    console.error(`[cifService] getCached error:`, error);
    return null;
  }
};

const setCached = async (ligandId: string, rawText: string): Promise<void> => {
  try {
    await storage.setItem(getCacheKey(ligandId), rawText);
    //console.log(`[cifService] Cached ${ligandId}, size: ${rawText.length} bytes`);
  } catch (error) {
    console.warn(`[cifService] Failed to cache ${ligandId}:`, error);
  }
};

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[fetchWithTimeout] Fetching ${url}`);
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (err) {
    const errorMessage = (err as Error).message || '';
    const errorName = (err as Error).name || '';
    
    console.log(`[fetchWithTimeout] Caught error - name: ${errorName}, message: ${errorMessage}`);
    
    if (errorName === 'AbortError') {
      throw new TimeoutError();
    }
    
    // Detect DNS/URL resolution failures or fetch failures on invalid URLs
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('getaddrinfo') ||
        errorMessage.includes('DNS')) {
      throw new NetworkError(
        `Connection failed: Invalid URL or server unreachable. Check your server address.`
      );
    }
    
    throw new NetworkError(
      'No internet connection. Please check your network.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const cifService = {
  fetchRaw: async (ligandId: string): Promise<{ rawText: string; fromCache: boolean }> => {
    const sanitized = ligandId.toUpperCase().trim();
    //console.log(`[cifService.fetchRaw] Starting for ${sanitized}`);

    if (!isValidLigandId(sanitized)) {
      console.error(`[cifService.fetchRaw] Invalid ligand ID: ${ligandId}`);
      throw new CifParseError(`Invalid ligand identifier: ${ligandId}`);
    }

    const cached = await getCached(sanitized);
    if (cached) {
      //console.log(`[cifService.fetchRaw] Returning cached for ${sanitized}`);
      return { rawText: cached, fromCache: true };
    }

    const url = API_URLS.getCifUrl(sanitized);
    //console.log(`[cifService.fetchRaw] Fetching from network: ${url}`);
    const response = await fetchWithTimeout(url, 10000);
    //console.log(`[cifService.fetchRaw] Response status: ${response.status}`);

    if (response.status === 404) {
      console.error(`[cifService.fetchRaw] 404 Not Found for ${sanitized}`);
      throw new NotFoundError(sanitized);
    }
    if (!response.ok) {
      console.error(`[cifService.fetchRaw] HTTP ${response.status} for ${sanitized}`);
      throw new NetworkError(`Failed to fetch ligand data (HTTP ${response.status}).`);
    }

    const rawText = await response.text();
    //console.log(`[cifService.fetchRaw] Received raw text length: ${rawText.length}`);
    if (!rawText || rawText.trim().length === 0) {
      console.error(`[cifService.fetchRaw] Empty response for ${sanitized}`);
      throw new CifParseError('Failed to parse ligand data. The file may be corrupted.');
    }

    await setCached(sanitized, rawText);
    return { rawText, fromCache: false };
  },

  fetchAndParse: async (ligandId: string): Promise<Molecule> => {
    //console.log(`[cifService.fetchAndParse] Start for ${ligandId}`);
    const sanitized = ligandId.toUpperCase().trim();
    const { rawText } = await cifService.fetchRaw(sanitized);
    const molecule = parseCif(rawText, sanitized);
    //console.log(`[cifService.fetchAndParse] Parse success: ${molecule.atoms.length} atoms, ${molecule.bonds.length} bonds`);
    return molecule;
  },

  isCached: async (ligandId: string): Promise<boolean> => {
    const cached = await getCached(ligandId.toUpperCase());
    return cached !== null;
  },

  clearCache: async (ligandId?: string): Promise<void> => {
    if (ligandId) {
      await storage.deleteItem(getCacheKey(ligandId.toUpperCase()));
    }
  },
};