// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { useColorScheme } from 'nativewind';
import { storage } from '../utils/storage';
import { ThemeMode } from '../types/protein.types';
import { darkTheme, lightTheme } from '../constants/theme';

const THEME_KEY = 'sp_theme_mode';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  effectiveScheme: ColorSchemeName;
  colors: typeof darkTheme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setColorScheme } = useColorScheme();
  const systemScheme = Appearance.getColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await storage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
        }
      } catch (err) {
        console.warn('Failed to load theme preference:', err);
      } finally {
        setIsInitialized(true);
      }
    };
    load();
  }, []);


  useEffect(() => {
    if (!isInitialized) return;

    const safeSystemScheme: 'light' | 'dark' =
      systemScheme === 'dark' ? 'dark' : 'light';

    const effectiveScheme: 'light' | 'dark' =
      themeMode === 'system' ? safeSystemScheme : themeMode;

    setColorScheme(effectiveScheme);

    storage.setItem(THEME_KEY, themeMode).catch((err) => {
      console.warn('Failed to save theme preference:', err);
    });
  }, [themeMode, systemScheme, isInitialized, setColorScheme]);

  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);
  const isDark = themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark');

  const effectiveScheme: 'light' | 'dark' =
    isDark ? 'dark' : 'light';

  const colors = isDark ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, effectiveScheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};