import {Re} from 'msp_ui_common/uiLib/renderEngine'
import { PresetTextComponent } from 'msp_ui_common/uiLib/components'

import { userInfoFluxorData } from '../../../fluxorObjects/userActorFluxor.js';


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