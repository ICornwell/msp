import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext.tsx';
import { EngineComponentProvider, useEngineComponentsContext } from '../../renderEngine/contexts/ReComponentsContext.tsx';

import { createTheme } from '@mui/material/styles'
import { CustomThemeProvider } from '../components/CustomThemeProvider.tsx';

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