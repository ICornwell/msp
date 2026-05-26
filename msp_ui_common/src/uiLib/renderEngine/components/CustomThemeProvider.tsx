import { createElement } from 'react';
//import { useContext } from 'react';
import { createTheme as createMuiTheme, ThemeProvider } from '@mui/material/styles';

// Create a default theme
const defaultTheme = createMuiTheme();

// Create a theme context
//const ThemeContext = createContext(defaultTheme);

// Custom ThemeProvider
export const CustomThemeProvider = ({ theme, children }: { theme: any, children: any }) => {
  return createElement(ThemeProvider, { theme: theme || defaultTheme }, children);
};

// Custom useTheme hook
//export const useCustomTheme = () => useContext(ThemeContext);