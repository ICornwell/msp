import { JSX } from 'preact/jsx-runtime';
import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext';
import CheckBoxInput from './primatives/checkboxInput';
import NumberInput from './primatives/numberInput';
import MoneyInput from './primatives/moneyInput';
import TextInput from './primatives/textInput';
import Button from './primatives/button';
import Columns from './containers/columns';
import { EngineComponentNames } from './eningeComponentNames';

import { ReComponentWrapperProps } from '../renderEngine/components/ReComponentProps';



export default function EngineComponents() {
  const { addComponent, addManagedFormComponent, addContainerComponent } = useEngineComponentsContext();

  addComponent(EngineComponentNames.Button, (props: ReComponentWrapperProps) => (<Button {...(mapToProps(props))} />));
  addComponent(EngineComponentNames.Text, (props: ReComponentWrapperProps) => (<TextInput {...(mapToProps(props))} />));
  addComponent(EngineComponentNames.Number, (props: ReComponentWrapperProps) => (<NumberInput {...(mapToProps(props))} />));
  addComponent(EngineComponentNames.Money, (props: ReComponentWrapperProps) => (<MoneyInput {...(mapToProps(props))} />));
  addManagedFormComponent(EngineComponentNames.CheckBox, (props: ReComponentWrapperProps) => (<CheckBoxInput {...(mapToProps(props))} />));
  addContainerComponent(EngineComponentNames.Columns, (props: ReComponentWrapperProps) => (<Columns {...(mapToProps(props))} />));

  return null
}

function mapToProps(props: ReComponentWrapperProps): any {
  return {
    ...props
  }
}