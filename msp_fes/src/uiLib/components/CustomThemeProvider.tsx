import { createTheme as createMuiTheme, ThemeProvider } from '@mui/material/styles';

// Create a default theme
const defaultTheme = createMuiTheme();

// Custom ThemeProvider
export const CustomThemeProvider = ({ theme, children }: { theme: any, children: any }) => {
  return (
    <ThemeProvider theme={theme || defaultTheme}>
      {children}
    </ThemeProvider>
  );
};



/* import { useContext, createContext } from 'react';
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
export const useCustomTheme = () => useContext(ThemeContext); */