import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/editing/textInput'
import { MoneyComponent } from '../../../components/primatives/editing/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/editing/checkboxInput'

export function UserInfoLayout() {
  const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
    
    .withElementSet.forDataDescribedBy(userInfoFluxorData)
     .fromInlineElementSet
      .showingItem.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
        .showingItem.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.email)
        .endElement
        .showingItem.fromInlineElementUsingComponent(MoneyComponent)
          .withValueBinding((context) => context.localData.creditLimit)
        .endElement
        .showingItem.fromInlineElementUsingComponent(CheckboxComponent)
          .withValueBinding((context) => context.localData.marketingConsent)
        .endElement
        .showingItem.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
    .endSet
    .build()

    return userInfoLauout
}