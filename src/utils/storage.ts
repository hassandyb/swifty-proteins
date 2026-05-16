import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const storage = {
  setItem: async (key: string, value: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },

  deleteItem: async (key: string): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};