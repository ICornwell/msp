import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext.tsx';
import { EngineComponentProvider, useEngineComponentsContext } from '../../renderEngine/contexts/ReComponentsContext.tsx';

import {CheckboxComponent} from '../../../../../ui-try-outs/editing/checkboxInput.tsx';
import {NumberComponent} from '../../../../../ui-try-outs/editing/numberInput.tsx';
import {MoneyComponent} from '../../../../../ui-try-outs/editing/moneyInput.tsx';
import {TextComponent} from '../../../../../ui-try-outs/editing/textInput.tsx';
import {ButtonComponent} from '../../../../../ui-try-outs/editing/button.tsx';
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