import React from 'react';

import { ReProvider } from '../../renderEngine/contexts/ReEngineContext';
import { EngineComponentProvider, useEngineComponentsContext } from '../../renderEngine/contexts/ReComponentsContext';

import CheckBoxInput from '../../components/primatives/checkboxInput';
import NumberInput from '../../components/primatives/numberInput';
import MoneyInput from '../../components/primatives/moneyInput';
import TextInput from '../../components/primatives/textInput';
import Button from '../../components/primatives/button';
import Columns from '../../components/containers/columns';

import { ReComponentWrapperProps } from '../../renderEngine/components/ReComponentProps';

import { createTheme } from '@mui/material/styles'
import { CustomThemeProvider } from '../components/CustomThemeProvider';
// import { NavItem, Tab } from '../types.ts';
export default function EngineComponents() {
  const { addComponent, addManagedFormComponent, addContainerComponent } = useEngineComponentsContext();
  addComponent('Button', (props: ReComponentWrapperProps) => (<Button {...(mapToProps(props))} />));
  addComponent('Text', (props: ReComponentWrapperProps) => (<TextInput {...(mapToProps(props))} />));
  addComponent('Number', (props: ReComponentWrapperProps) => (<NumberInput {...(mapToProps(props))} />));
  addComponent('Money', (props: ReComponentWrapperProps) => (<MoneyInput {...(mapToProps(props))} />));
  addManagedFormComponent('CheckBox', (props: ReComponentWrapperProps) => (<CheckBoxInput {...(mapToProps(props))} />));
  addContainerComponent('Columns', (props: ReComponentWrapperProps) => (<Columns {...(mapToProps(props))} />));
  function mapToProps(props: ReComponentWrapperProps): any { return { ...props } }

  return null
}


export const TestAppShell: React.FC = (children) => {
  
  return (
 //   <CustomThemeProvider theme={createTheme()}>
      <ReProvider>
        <EngineComponentProvider>
          <EngineComponents />
          <h1>Test App Shell</h1>
          {children}
        </EngineComponentProvider>
      </ReProvider>
 //   </CustomThemeProvider>
  );
};