import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/editing/textInput'
import { MoneyComponent } from '../../../components/primatives/editing/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/editing/checkboxInput'
import { ColumnsComponent } from '../../../components/containers/columns'



export function UserInfoLayout() {
   const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
     
     .withElementSet.forDataDescribedBy(userInfoFluxorData)
      .fromInlineElementSet
        .showingContainer.fromInlineContainerElementUsingComponent(ColumnsComponent)
          .withComponentProps({columns: 2, fillDirection: 'down'})
          .endElement.containing
            .withSharedProps()
              .withDisplayMode('editing')
            .endSharedProps
   
            .showingItem.fromInlineElementUsingComponent(TextComponent)
                .withValueBinding((context) => context.localData.userName)
              .endElement
              .showingItem.fromInlineElementUsingComponent(TextComponent)
                .withValueBinding((context) => context.localData.email)
              .endElement
              .withSharedProps()
                .withDisplayMode('readonly')
              .endSharedProps
              .showingItem.fromInlineElementUsingComponent(MoneyComponent)
                .withLabel({executionPlan:'', expression: (context) => context.localData.userName + "'s Credit Limit" })
                .withValueBinding((context) => context.localData.creditLimit)
              .endElement
              .showingItem.fromInlineElementUsingComponent(CheckboxComponent)
                .withValueBinding((context) => context.localData.marketingConsent)
              .endElement
              .showingItem.fromInlineElementUsingComponent(TextComponent)
                .withLabel("User Name")
                .withValueBinding((context) => context.localData.userName)
              .endElement
        .endSet
     .endSet
     
     .BuildUiPlan()
    return userInfoLauout
}