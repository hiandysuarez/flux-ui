// lib/themeContext.js - Theme context provider with per-user database persistence
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchUserTheme, saveUserTheme } from './api';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState(null);

  // Load theme on mount
  useEffect(() => {
    setMounted(true);

    // Check localStorage first for immediate display (prevents flash)
    const savedTheme = localStorage.getItem('flux-theme');
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
    async function loadUserTheme() {
      try {
        const res = await fetchUserTheme();
        if (res.ok && res.theme) {
          setThemeState(res.theme);
          setUserId(res.user_id);
          localStorage.setItem('flux-theme', res.theme);
        }
      } catch (e) {
        // User not logged in or API not available, use localStorage
        console.debug('Theme: Using localStorage (user not authenticated)');
      }
    }

    if (mounted) {
      loadUserTheme();
    }
  }, [mounted]);

  // Apply theme to document and save
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flux-theme', theme);
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
