import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext';
import { CheckboxComponent } from './primatives/checkboxInput';
import { NumberComponent } from './primatives/numberInput';
import { MoneyComponent } from './primatives/moneyInput';
import { TextComponent } from './primatives/textInput';
import { ButtonComponent } from './primatives/button';
import { ColumnsComponent } from './containers/columns';

import { ReGroupComponent } from '../renderEngine/components/ReGroup';
import { ReFluxListComponent } from '../renderEngine/components/ReFluxList';

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

