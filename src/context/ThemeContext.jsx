import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guru-theme') || 'mlb';
    }
    return 'mlb';
  });

  useEffect(() => {
    localStorage.setItem('guru-theme', theme);
    // Aplicamos una clase al body para selectores globales si fuera necesario
    if (theme === 'dark') {
      document.body.classList.add('bg-[#050505]');
      document.body.classList.remove('bg-[#001532]');
    } else {
      document.body.classList.add('bg-[#001532]');
      document.body.classList.remove('bg-[#050505]');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
