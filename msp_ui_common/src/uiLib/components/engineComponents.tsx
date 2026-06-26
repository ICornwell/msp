import { useEngineComponentsContext } from '../renderEngine/contexts/ReComponentsContext.js';

import { ColumnsComponent } from './containers/columns.js';
import { LabelFrameComponent } from './containers/labelframe.js';
import { StepperComponent } from './containers/stepper.js';

import { ReGroupComponent } from '../renderEngine/components/ReGroup.js';
import { ReFluxListComponent } from '../renderEngine/components/ReFluxList.js';

import { TableComponent } from './tables/table.js';
import { PresetBooleanComponent } from './primatives/presets/PresetBoolean.js';
import { BasicButtonComponent } from './primatives/BasicButton.js';
import { PresetNumberComponent } from './primatives/presets/PresetNumber.js';
import { PresetMoneyComponent } from './primatives/presets/PresetMoney.js';
import { PresetTextComponent } from './primatives/presets/PresetText.js';
import { PresetDateComponent } from './primatives/presets/PresetDate.js';
import { PresetLinkComponent } from './primatives/presets/PresetLink.js';
import { PresetSelectComponent } from './primatives/presets/PresetSelect.js';
import { PresetSecretComponent } from './primatives/presets/PresetSecret.js';
import { StatusIconComponent } from './primatives/StatusIcon.js';
import { StatusLabelComponent } from './primatives/StatusLabel.js';

export default function EngineComponents() {
  const { addComponent } = useEngineComponentsContext();

  // addComponent(ButtonComponent);

  addComponent(ColumnsComponent);
  addComponent(LabelFrameComponent);
  addComponent(StepperComponent);

  addComponent(ReGroupComponent);
  addComponent(ReFluxListComponent);

  addComponent(TableComponent);

  addComponent(PresetBooleanComponent);
  addComponent(BasicButtonComponent);
  addComponent(PresetNumberComponent);
  addComponent(PresetMoneyComponent);
  addComponent(PresetTextComponent);
  addComponent(PresetSecretComponent);
  addComponent(PresetDateComponent);
  addComponent(PresetLinkComponent);
  addComponent(PresetSelectComponent);
  addComponent(StatusIconComponent);
  addComponent(StatusLabelComponent);
  return null
}

