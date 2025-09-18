'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeName, getTheme, applyTheme, getSystemTheme } from '@/config/theme';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'vitordo-theme',
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load theme from localStorage or use system preference
    const stored = localStorage.getItem(storageKey) as ThemeName;
    const initialTheme = stored || getSystemTheme();
    
    setThemeName(initialTheme);
    applyTheme(getTheme(initialTheme));
  }, [storageKey]);

  useEffect(() => {
    if (!mounted) return;
    
    const theme = getTheme(themeName);
    applyTheme(theme);
    localStorage.setItem(storageKey, themeName);
  }, [themeName, storageKey, mounted]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeName(newTheme);
  };

  const toggleTheme = () => {
    setThemeName(current => current === 'light' ? 'dark' : 'light');
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const value: ThemeContextType = {
    theme: getTheme(themeName),
    themeName,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}