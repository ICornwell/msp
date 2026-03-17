import * as uiLibNs from 'msp_ui_common/uiLib'

import { userInfoFluxorData } from '../../../fluxorObjects/userActorFluxor.js';

type UiLibModule = typeof uiLibNs;
type UiLibModuleWithDefault = UiLibModule & { default?: UiLibModule };

const uiLib: UiLibModule = (uiLibNs as UiLibModuleWithDefault).default ?? uiLibNs;
const { Re, PresetTextComponent } = uiLib;


export function UserInfoLayout() {
  const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
    
    .withElementSet.usingFluxor(userInfoFluxorData)
     .fromInlineElementSet
      .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.name)
        .endElement
        .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.email)
        .endElement
        .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
       
    .endSet
    .BuildUiPlan()

    return userInfoLauout
}