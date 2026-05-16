import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { StoredUser } from '../types/protein.types';
import { storage } from '../utils/storage';

const STORAGE_KEYS = {
  USERS: 'sp_users',
  LAST_USER: 'sp_last_user',
  SESSION_USER: 'sp_session_user',
  biometricEnabledKey: (username: string) =>
    `sp_biometric_enabled_${username.toLowerCase()}`,
} as const;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
};

const generateSalt = (): string => {
  const bytes = Crypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};



const hashPassword = async (password: string, salt: string): Promise<string> =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);



const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

export const authService = {
  getUsers: async (): Promise<StoredUser[]> => {
    try {
      const raw = await storage.getItem(STORAGE_KEYS.USERS);
      if (!raw) return [];
      return JSON.parse(raw) as StoredUser[];
    } catch (error) {
      console.error('[authService.getUsers]', error);
      return [];
    }
  },

  saveUsers: async (users: StoredUser[]): Promise<void> => {
    await storage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  register: async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (username.trim().length < 3)
        return { success: false, error: 'Username must be at least 3 characters.' };
      if (password.length < 6)
        return { success: false, error: 'Password must be at least 6 characters.' };

      const users = await authService.getUsers();
      const exists = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );
      if (exists) return { success: false, error: 'Username already exists.' };

      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);
      const newUser: StoredUser = { username: username.trim(), passwordHash, salt };

      await authService.saveUsers([...users, newUser]);
      await storage.setItem(STORAGE_KEYS.LAST_USER, username.trim());
      await authService.setSessionUser(username.trim());
      return { success: true };
    } catch (error) {
      console.error('[authService.register]', error);
      return { success: false, error: `Registration failed: ${getErrorMessage(error)}` };
    }
  },

  login: async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = await authService.getUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        await hashPassword(password, 'dummy_salt_constant');
        return { success: false, error: 'Invalid username or password.' };
      }

      const candidateHash = await hashPassword(password, user.salt);
      if (!timingSafeEqual(candidateHash, user.passwordHash)) {
        return { success: false, error: 'Invalid username or password.' };
      }

      await storage.setItem(STORAGE_KEYS.LAST_USER, user.username);
      await authService.setSessionUser(user.username);
      return { success: true };
    } catch (error) {
      console.error('[authService.login]', error);
      return { success: false, error: `Login failed: ${getErrorMessage(error)}` };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await storage.deleteItem(STORAGE_KEYS.SESSION_USER);
    } catch (error) {
      console.error('[authService.logout]', error);
    }
  },

  setSessionUser: async (username: string): Promise<void> => {
    await storage.setItem(STORAGE_KEYS.SESSION_USER, username);
  },

  getSessionUser: async (): Promise<string | null> => {
    try {
      const val = await storage.getItem(STORAGE_KEYS.SESSION_USER);
      return val;
    } catch {
      return null;
    }
  },

  getLastUsername: async (): Promise<string | null> => {
    try {
      const val = await storage.getItem(STORAGE_KEYS.LAST_USER);
      return val;
    } catch {
      return null;
    }
  },

  isBiometricAvailable: async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  },

  isBiometricEnabledForUser: async (username: string): Promise<boolean> => {
    try {
      const deviceOk = await authService.isBiometricAvailable();
      if (!deviceOk) {
        return false;
      }
      const key = STORAGE_KEYS.biometricEnabledKey(username);
      const val = await storage.getItem(key);
      const enabled = val === '1';
      return enabled;
    } catch {
      return false;
    }
  },

  setBiometricEnabled: async (username: string, enabled: boolean): Promise<void> => {
    const key = STORAGE_KEYS.biometricEnabledKey(username);
    await storage.setItem(key, enabled ? '1' : '0');
  },

  isBiometricPromptActive: false,

  authenticateWithBiometrics: async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    authService.isBiometricPromptActive = true;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Swifty Protein',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) return { success: true };
      if (result.error === 'user_cancel')
        return { success: false, error: 'Authentication cancelled.' };
      if (result.error === 'lockout')
        return { success: false, error: 'Too many attempts. Use your password.' };
      return { success: false, error: 'Authentication failed. Try again.' };
    } catch (err) {
      console.error('[authService.authenticateWithBiometrics] threw:', err);
      return { success: false, error: 'Biometric authentication unavailable.' };
    } finally {
      setTimeout(() => {
        authService.isBiometricPromptActive = false;
      }, 500);
    }
  },
};

