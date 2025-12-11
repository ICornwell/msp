import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/editing/textInput'
import { MoneyComponent } from '../../../components/primatives/editing/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/editing/checkboxInput'

export function UserInfoLayout() {
  const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
    
    .withElementSet.usingFluxor(userInfoFluxorData)
     .fromInlineElementSet
      .showingItem.fromComponentElement(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
        .showingItem.fromComponentElement(TextComponent)
          .withValueBinding((context) => context.localData.email)
        .endElement
        .showingItem.fromComponentElement(MoneyComponent)
          .withValueBinding((context) => context.localData.creditLimit)
        .endElement
        .showingItem.fromComponentElement(CheckboxComponent)
          .withValueBinding((context) => context.localData.marketingConsent)
        .endElement
        .showingItem.fromComponentElement(TextComponent)
          .withValueBinding((context) => context.localData.userName)
        .endElement
    .endSet
    .build()

    return userInfoLauout
}