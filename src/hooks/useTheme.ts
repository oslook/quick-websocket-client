import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    chrome.storage.local.get(['theme']).then(result => {
      if (result.theme) {
        setIsDark(result.theme === 'dark');
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' }).catch(console.error);
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  return { isDark, toggleTheme };
}; 