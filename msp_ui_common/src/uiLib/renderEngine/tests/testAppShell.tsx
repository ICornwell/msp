import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext.js';
import { EngineComponentProvider } from '../../renderEngine/contexts/ReComponentsContext.js';

import { createTheme } from '@mui/material/styles'
import { CustomThemeProvider } from '../components/CustomThemeProvider.js';

// import { NavItem, Tab } from '../types.ts';
export default function EngineComponents() {
 
  

  return null
}


export const TestAppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  
  return (
    <CustomThemeProvider theme={createTheme()}>
      <ReProvider>
        <EngineComponentProvider>
          <EngineComponents />
          <h1>Test App Shell</h1>
          <>
            {children}
          </>
        </EngineComponentProvider>
      </ReProvider>
    </CustomThemeProvider>
  );
};