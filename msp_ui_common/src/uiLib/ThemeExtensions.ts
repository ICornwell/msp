export interface Sizing {
  heights: {
    containerTitles: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  }
}

export interface MspCustomThemeOptions {
  sizing?: Sizing;
}

declare module "@mui/material/styles" {
  interface ThemeOptions {
    mspCustom?: import('./ThemeExtensions.js').MspCustomThemeOptions;
  }

  interface Theme {
    mspCustom?: import('./ThemeExtensions.js').MspCustomThemeOptions;
  }
}
