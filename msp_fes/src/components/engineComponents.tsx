import { JSX } from 'preact/jsx-runtime';
import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext';
import CheckBoxInput from './primatives/checkboxInput';
import NumberInput from './primatives/numberInput';
import TextInput from './primatives/textInput';
import Button from './primatives/button';
import Columns from './containers/columns';
import { EngineComponentNames } from './eningeComponentNames';
import { ReUiPlanElement } from '../renderEngine/UiPlan/ReUiPlan';

export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();

  addComponent(EngineComponentNames.Button, (elementOptions: ReUiPlanElement) => (<Button {...(mapToProps(elementOptions))} />));
  addComponent(EngineComponentNames.TextInput, (elementOptions: ReUiPlanElement) => (<TextInput {...(mapToProps(elementOptions))} />));
  addComponent(EngineComponentNames.NumberInput, (elementOptions: ReUiPlanElement) => (<NumberInput {...(mapToProps(elementOptions))} />));
  addComponent(EngineComponentNames.CheckBoxInput, (elementOptions: ReUiPlanElement) => (<CheckBoxInput {...(mapToProps(elementOptions))} />));
  addComponent(EngineComponentNames.Columns, (elementOptions: ReUiPlanElement) => (<Columns {...(mapToProps(elementOptions))} />));

  return null
}

function mapToProps(elementOptions: ReUiPlanElement): any {
  return {
    ...elementOptions
  }
}