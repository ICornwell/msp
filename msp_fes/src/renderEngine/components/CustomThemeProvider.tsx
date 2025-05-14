import { useState, useEffect, useRef, useContext, useReducer, useCallback, useMemo } from 'react';
import { createTheme as createMuiTheme } from '@mui/material/styles';

// Create a default theme
const defaultTheme = createMuiTheme();

// Create a theme context
const ThemeContext = createContext(defaultTheme);

// Custom ThemeProvider
export const CustomThemeProvider = ({ theme, children }: { theme: any, children: any }) => {
  return (
    <ThemeContext.Provider value={theme || defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom useTheme hook
export const useCustomTheme = () => useContext(ThemeContext);