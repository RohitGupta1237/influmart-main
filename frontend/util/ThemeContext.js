import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  dark: {
    isDark: true,
    bg: '#0D0D0D',
    headerBg: '#0D0D0D',
    headerBorder: '#1f1f1f',
    text: '#ffffff',
    subText: 'rgba(255,255,255,0.65)',
    filterBg: '#1a1a1a',
    filterBorder: '#444444',
    filterText: '#e0e0e0',
    iconTint: '#ffffff',
    searchBg: '#1e1e1e',
    searchBorder: '#333333',
    searchText: '#ffffff',
    placeholder: '#888888',
    emptyText: '#666666',
    scrollBg: '#0D0D0D',
  },
  light: {
    isDark: false,
    bg: '#f5f5f5',
    headerBg: '#ffffff',
    headerBorder: '#e5e5e5',
    text: '#111111',
    subText: '#666666',
    filterBg: '#ffffff',
    filterBorder: '#cccccc',
    filterText: '#333333',
    iconTint: '#111111',
    searchBg: '#f0f0f0',
    searchBorder: '#cccccc',
    searchText: '#111111',
    placeholder: '#999999',
    emptyText: '#999999',
    scrollBg: '#f5f5f5',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('appTheme').then((saved) => {
      if (saved !== null) setIsDark(saved === 'dark');
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('appTheme', next ? 'dark' : 'light');
  };

  const theme = isDark ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
