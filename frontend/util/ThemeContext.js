import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  dark: {
    isDark: true,
    // Refined charcoal palette (not pure black) with off-white text — reads
    // premium instead of the harsh pure-black/pure-white "cheap" look.
    bg: '#0f1115',
    headerBg: '#14161b',
    headerBorder: '#242832',
    text: '#f3f4f6',
    subText: '#9aa1ad',
    filterBg: '#1a1d24',
    filterBorder: '#2a2e37',
    filterText: '#e0e2e7',
    iconTint: '#f3f4f6',
    searchBg: '#1a1d24',
    searchBorder: '#2a2e37',
    searchText: '#f3f4f6',
    placeholder: '#7a828e',
    emptyText: '#6b727d',
    scrollBg: '#0f1115',
    // Shared surface tokens (cards, pills, dividers, accent) — used by the
    // influencer profile and reusable across other themed screens.
    card: '#1a1d24',
    cardBorder: '#2a2e37',
    divider: '#242832',
    accent: '#1a5ce6',
    pill: '#22262e',
    pillBorder: '#2f333c',
    pillText: '#c8cdd6',
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
    card: '#ffffff',
    cardBorder: '#ececec',
    divider: '#eeeeee',
    accent: '#1a5ce6',
    pill: '#f0f2f5',
    pillBorder: '#e2e2e2',
    pillText: '#444444',
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
