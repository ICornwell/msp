import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext';
import { CheckboxComponent } from './primatives/editing/checkboxInput';
import { CheckboxReadOnlyComponent, CheckboxEditableComponent } from './primatives/readonly/checkboxInput';
import { NumberComponent } from './primatives/editing/numberInput';
import { NumberReadOnlyComponent, NumberEditableComponent } from './primatives/readonly/numberInput';
import { MoneyComponent } from './primatives/editing/moneyInput';
import { MoneyReadOnlyComponent, MoneyEditableComponent } from './primatives/readonly/moneyInput';
import { TextComponent } from './primatives/editing/textInput';
import { TextReadOnlyComponent, TextEditableComponent } from './primatives/readonly/textInput';
import { ButtonComponent } from './primatives/editing/button';
import { ColumnsComponent } from './containers/columns';
import { LabelFrameComponent } from './containers/labelframe';

import { ReGroupComponent } from '../renderEngine/components/ReGroup';
import { ReFluxListComponent } from '../renderEngine/components/ReFluxList';

import { TableComponent } from './tables/table';

export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();

  addComponent(ButtonComponent);
  addComponent(TextComponent);
  addComponent(TextReadOnlyComponent);
  addComponent(TextEditableComponent);
  addComponent(NumberComponent);
  addComponent(NumberReadOnlyComponent);
  addComponent(NumberEditableComponent);
  addComponent(MoneyComponent);
  addComponent(MoneyReadOnlyComponent);
  addComponent(MoneyEditableComponent);
  addComponent(CheckboxComponent);
  addComponent(CheckboxReadOnlyComponent);
  addComponent(CheckboxEditableComponent);
  addComponent(ColumnsComponent);
  addComponent(LabelFrameComponent);

  addComponent(ReGroupComponent);
  addComponent(ReFluxListComponent);

  addComponent(TableComponent);

  return null
}

