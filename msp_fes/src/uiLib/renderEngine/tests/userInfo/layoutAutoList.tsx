import {Re} from '../../index.js'

import { userInfoFluxorData } from './UserInfo.js'
import { PresetTextComponent } from '../../../components/primatives/presets/PresetText.js'
import { PresetMoneyComponent } from '../../../components/primatives/presets/PresetMoney.js'
// import { PresetNumberComponent } from '../../../components/primatives/presets/PresetNumber'
import { PresetBooleanComponent } from '../../../components/primatives/presets/PresetBoolean.js'
// import { ColumnsComponent } from '../../../components/containers/columns'
// import { LabelFrameComponent } from '../../../components/containers/labelframe'
// import { TableComponent } from '../../../components/tables/table'
// import { PresetDateComponent } from '../../../components/primatives/presets/PresetDate'
// import { vehicleFluxorData } from '../../../components/tables/testData'
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