import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  spacing: 6,
  palette: {
    grey: {"700": "#4532f3ff", "300": "#1283f7ff"},
    primary: {
      dark: '#005a9e',
      main: '#0078d4',
      contrastText: '#2e359bff',
      
    },
    secondary: {
      dark: '#1a5fb4',
      main: '#2b88d8',
      contrastText: '#d7d7d7',
    },

    background: {
      default: '#e7e7e7',
      paper: '#e0e0e0',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
    divider: '#505050',
  },
  typography: {
    allVariants: {
      color: '#333333',
    },
    fontFamily: 'Bahnschrift, sans-serif',
    fontSize: 12,
    body1: {
      color: '#333333',
    },
    body2: {
      color: '#555555',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          //  backgroundColor: '#fff',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        input: {
          paddingTop: '4px',
          paddingBottom: '2px',
          fontWeight: 400,
          ":read-only": {
            backgroundColor: '#e0e0e0'
          },
        },
        underline: {
          marginTop: '6px',
        },
      },
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiFormControl: {
      
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginTop: '-5px',
        },
      },
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiInputBase: {
      styleOverrides: {
        readOnly: {

        }
      },
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        filled: {
          marginTop: '-14px',
          fontWeight: 300,
        }
      },
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiListItem: {
      defaultProps: {
        dense: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          marginTop: '5px',
          paddingTop: '0px',
          paddingBottom: '4px',
        },
      },
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiFab: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiTextField: {
      defaultProps: {
        margin: 'dense',
      },
    },
    MuiToolbar: {
      defaultProps: {
        variant: 'dense',
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
        },
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          height: '20px',
        }
      },
      defaultProps: {
        size: 'small',
      },
    },
    MuiButtonBase:{
      styleOverrides:{
        root:{
          "&.MuiCheckbox-root":{
           justifyContent: 'start',
          }
        }
      }
    }
  },
});

export default theme;