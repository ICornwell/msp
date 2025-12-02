import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/textInput'
import { MoneyComponent } from '../../../components/primatives/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/checkboxInput'

export function UserInfoLayout() {
  const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
    
    .withElementSet.forDataDescribedBy(userInfoFluxorData)
     .fromInlineElementSet
      .showingStandalone.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
        .showingStandalone.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.email)
        .endElement
        .showingStandalone.fromInlineElementUsingComponent(MoneyComponent)
          .withValueBinding((context) => context.localData.creditLimit)
        .endElement
        .showingStandalone.fromInlineElementUsingComponent(CheckboxComponent)
          .withValueBinding((context) => context.localData.marketingConsent)
        .endElement
        .showingStandalone.fromInlineElementUsingComponent(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
    .endSet
    .build()

    return userInfoLauout
}