import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext.js';
import { EngineComponentProvider } from '../../renderEngine/contexts/ReComponentsContext.js';
import { useEngineComponentsContext } from '../../renderEngine/contexts/ReComponentsContext.js';
import { PresetTextComponent } from '../../components/primatives/presets/PresetText.js';
import { PresetMoneyComponent } from '../../components/primatives/presets/PresetMoney.js';
import { PresetBooleanComponent } from '../../components/primatives/presets/PresetBoolean.js';

import { createTheme } from '@mui/material/styles'
import { CustomThemeProvider } from '../components/CustomThemeProvider.js';

// import { NavItem, Tab } from '../types.ts';
export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();

  addComponent(PresetTextComponent);
  addComponent(PresetMoneyComponent);
  addComponent(PresetBooleanComponent);

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