import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/textInput'
import { MoneyComponent } from '../../../components/primatives/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/checkboxInput'
import { ColumnsComponent } from '../../../components/containers/columns'



export function UserInfoLayout() {
   const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
     
     .withElementSet.forDataDescribedBy(userInfoFluxorData)
      .fromInlineElementSet
        .showingContainer.fromInlineContainerElementUsingComponent(ColumnsComponent)
          .withComponentProps({columns: 2, fillDirection: 'down'})
          .endElement.containing
            .showingStandalone.fromInlineElementUsingComponent(TextComponent)
                .withValueBinding((context) => context.localData.userName)
              .endElement
              .showingStandalone.fromInlineElementUsingComponent(TextComponent)
                .withValueBinding((context) => context.localData.email)
              .endElement
              .showingStandalone.fromInlineElementUsingComponent(MoneyComponent)
                .withLabel({executionPlan:'', expression: (context) => context.localData.userName + "'s Credit Limit" })
                .withValueBinding((context) => context.localData.creditLimit)
              .endElement
              .showingStandalone.fromInlineElementUsingComponent(CheckboxComponent)
                .withValueBinding((context) => context.localData.marketingConsent)
              .endElement
              .showingStandalone.fromInlineElementUsingComponent(TextComponent)
                .withLabel("User Name")
                .withValueBinding((context) => context.localData.userName)
              .endElement
        .endSet
     .endSet
     
     .BuildUiPlan()
    return userInfoLauout
}