import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext.js';

import { ColumnsComponent } from './containers/columns';
import { LabelFrameComponent } from './containers/labelframe.js';

import { ReGroupComponent } from '../renderEngine/components/ReGroup.js';
import { ReFluxListComponent } from '../renderEngine/components/ReFluxList.js';

import { TableComponent } from './tables/table.js';
import { PresetBooleanComponent } from './primatives/presets/PresetBoolean.js';
import { PresetNumberComponent } from './primatives/presets/PresetNumber.js';
import { PresetMoneyComponent } from './primatives/presets/PresetMoney.js';
import { PresetTextComponent } from './primatives/presets/PresetText.js';
import { PresetDateComponent } from './primatives/presets/PresetDate.js';

export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();

  // addComponent(ButtonComponent);
 
  addComponent(ColumnsComponent);
  addComponent(LabelFrameComponent);

  addComponent(ReGroupComponent);
  addComponent(ReFluxListComponent);

  addComponent(TableComponent);

  addComponent(PresetBooleanComponent);
   addComponent(PresetNumberComponent);
  addComponent(PresetMoneyComponent);
  addComponent(PresetTextComponent);
  addComponent(PresetDateComponent);
  return null
}

