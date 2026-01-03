import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { PresetTextComponent } from '../../../components/primatives/presets/PresetText'
import { PresetMoneyComponent } from '../../../components/primatives/presets/PresetMoney'
import { PresetBooleanComponent } from '../../../components/primatives/presets/PresetBoolean'

export function UserInfoLayout() {
  const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
    
    .withElementSet.usingFluxor(userInfoFluxorData)
     .fromInlineElementSet
      .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
        .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.email)
        .endElement
        .showingItem.fromComponentElement(PresetMoneyComponent)
          .withValueBinding((context) => context.localData.creditLimit)
        .endElement
        .showingItem.fromComponentElement(PresetBooleanComponent)
          .withValueBinding((context) => context.localData.marketingConsent)
        .endElement
        .showingItem.fromComponentElement(PresetTextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
    .endSet
    .BuildUiPlan()

    return userInfoLauout
}