import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext.tsx';
import { EngineComponentProvider, useEngineComponentsContext } from '../../renderEngine/contexts/ReComponentsContext.tsx';

import {CheckboxComponent} from '../../components/primatives/checkboxInput.tsx';
import {NumberComponent} from '../../components/primatives/numberInput.tsx';
import {MoneyComponent} from '../../components/primatives/moneyInput.tsx';
import {TextComponent} from '../../components/primatives/textInput.tsx';
import {ButtonComponent} from '../../components/primatives/button.tsx';
import {ColumnsComponent} from '../../components/containers/columns.tsx';

import {ReGroupComponent} from '../components/ReGroup.tsx';
import {ReFluxListComponent} from '../components/ReFluxList.tsx';


import { createTheme } from '@mui/material/styles'
import { CustomThemeProvider } from '../components/CustomThemeProvider.tsx';

// import { NavItem, Tab } from '../types.ts';
export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();
  addComponent(ButtonComponent);
  addComponent(TextComponent);
  addComponent(NumberComponent);
  addComponent(MoneyComponent);
  addComponent(CheckboxComponent);
  addComponent(ColumnsComponent);
  
  addComponent(ReGroupComponent);
  addComponent(ReFluxListComponent);
  

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