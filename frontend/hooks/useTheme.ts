/**
 * Dark mode, persisted to localStorage and applied to <html>.
 *
 * Wrapped in a hook so three components can share one source of truth instead
 * of each toggling the `dark` class and fighting over the same key.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'taskflow_theme';

const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const readInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved ? saved === 'dark' : prefersDark();
};

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDarkMode, toggleDarkMode };
};