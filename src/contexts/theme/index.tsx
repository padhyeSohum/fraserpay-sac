
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Get stored theme preference or default to system
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'system';
    } catch (error) {
      console.error('Failed to read theme from localStorage:', error);
      return 'system';
    }
  });

  // Update theme when it changes
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      
      // Remove previous theme classes
      root.classList.remove('light', 'dark');
      
      // Handle system preference
      if (theme === 'system') {
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        
        root.classList.add(systemPreference);
        localStorage.removeItem('theme');
      } else {
        // Apply chosen theme
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        try {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(mediaQuery.matches ? 'dark' : 'light');
        } catch (error) {
          console.error('Error handling theme change:', error);
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          console.error('Error removing theme listener:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up theme listener:', error);
      return undefined;
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
