// lib/themeContext.js - Theme context provider with per-user database persistence
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchUserTheme, saveUserTheme } from './api';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

// Safe localStorage access (handles SSR)
const getStoredTheme = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('flux-theme');
  } catch {
    return null;
  }
};

const setStoredTheme = (theme) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('flux-theme', theme);
  } catch {
    // localStorage not available
  }
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // Load theme on mount (client-side only)
  useEffect(() => {
    setMounted(true);

    // Check localStorage first for immediate display (prevents flash)
    const savedTheme = getStoredTheme();
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeState(savedTheme);
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Try to load user's theme preference from database
  useEffect(() => {
    if (!mounted) return;

    async function loadUserTheme() {
      try {
        const res = await fetchUserTheme();
        if (res && res.ok && res.theme) {
          setThemeState(res.theme);
          setStoredTheme(res.theme);
        }
      } catch (e) {
        // User not logged in or API not available, use localStorage
        console.debug('Theme: Using localStorage (user not authenticated)');
      }
    }

    loadUserTheme();
  }, [mounted]);

  // Apply theme to document and save
  useEffect(() => {
    if (!mounted) return;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    setStoredTheme(theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);

    // Save to database if user is logged in
    try {
      await saveUserTheme(newTheme);
    } catch (e) {
      // User not logged in, localStorage will be used
      console.debug('Theme: Saved to localStorage only');
    }
  }, [theme]);

  const setTheme = useCallback(async (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light') return;

    setThemeState(newTheme);

    // Save to database if user is logged in
    try {
      await saveUserTheme(newTheme);
    } catch (e) {
      // User not logged in, localStorage will be used
      console.debug('Theme: Saved to localStorage only');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
