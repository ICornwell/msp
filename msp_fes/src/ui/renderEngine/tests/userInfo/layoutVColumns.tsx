import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { TextComponent } from '../../../components/primatives/editing/textInput'
import { MoneyComponent } from '../../../components/primatives/editing/moneyInput'
import { CheckboxComponent } from '../../../components/primatives/editing/checkboxInput'
import { ColumnsComponent } from '../../../components/containers/columns'
import { LabelFrameComponent } from '../../../components/containers/labelframe'
import { TableComponent } from '../../../components/tables/table'



export function UserInfoLayout() {
   const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
     
     .withElementSet
      
     
      .forDataDescribedBy(userInfoFluxorData)
      .fromInlineElementSet
       .showingItem.fromInlineElementUsingComponent(TableComponent)
          .withLabel('User Info Table')
          .tableWithColumns([
            {
              header: 'User Name',
              cell: (context) => context.localData.userName
            },
            {
              header: 'Email Address',
              cell: (context) => context.localData.email
            },
            {
              header: 'Credit Limit',
              cell: (context) => context.localData.creditLimit
            }])
            
        .endElement
        .showingItem.fromInlineElementUsingComponent(ColumnsComponent)
          .withComponentProps({columns: 2, fillDirection: 'down'})
          .withDecorators().showing.fromInlineElementUsingComponent(LabelFrameComponent)
            .withLabel('User Information')
          
            .endElement
          .endDecoratorSet
          .containingElementSet()
          .withSharedProps()
            .withDisplayMode('editing')
          .endSharedProps
  
          .showingItem.fromInlineElementUsingComponent(TextComponent)
              .withValueBinding((context) => context.localData.userName)
              .withHelperText('Please enter your full name')
            .endElement
            .showingItem.fromInlineElementUsingComponent(TextComponent)
              .withValueBinding((context) => context.localData.email)
            .endElement
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
        .endElement
     .endSet 
     
     .BuildUiPlan()
    return userInfoLauout
}