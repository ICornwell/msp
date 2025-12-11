import {Re} from '../../index'

import { userInfoFluxorData } from './UserInfo'
import { PresetTextComponent } from '../../../components/primatives/presets/PresetText'
import { PresetMoneyComponent } from '../../../components/primatives/presets/PresetMoney'
import { PresetNumberComponent } from '../../../components/primatives/presets/PresetNumber'
import { PresetBooleanComponent } from '../../../components/primatives/presets/PresetBoolean'
import { ColumnsComponent } from '../../../components/containers/columns'
import { LabelFrameComponent } from '../../../components/containers/labelframe'
import { TableComponent } from '../../../components/tables/table'
import { PresetDateComponent } from '../../../components/primatives/presets/PresetDate'



export function UserInfoLayout() {
   const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
     
     .withElementSet
      
     
      .usingFluxor(userInfoFluxorData)
      .fromInlineElementSet
       .showingItem.fromComponentElement(TableComponent)
          .withLabel('User Info Table')
   
            
        .endElement
        .showingItem.fromComponentElement(ColumnsComponent)
          .withComponentProps({columns: 2, fillDirection: 'down'})
          .withDecorators().showing.fromComponentElement(LabelFrameComponent)
            .withLabel('User Information')
          
            .endElement
          .endDecoratorSet
          .containingElementSet()
          .withSharedProps()
            .withDisplayMode('editing')
          .endSharedProps
  
          .showingItem.fromComponentElement(PresetTextComponent)
              .withValueBinding((context) => context.localData.userName)
              .withHelperText('Please enter your full name')
            .endElement
            .showingItem.fromComponentElement(PresetTextComponent)
              .withValueBinding((context) => context.localData.email)
            .endElement
              .showingItem.fromComponentElement(PresetMoneyComponent)
              .withLabel({executionPlan:'', expression: (context) => context.localData.userName + "'s Credit Limit" })
              .withValueBinding((context) => context.localData.creditLimit)
            .endElement
            .showingItem.fromComponentElement(PresetBooleanComponent)
              .withValueBinding((context) => context.localData.marketingConsent)
            .endElement
            .showingItem.fromComponentElement(PresetDateComponent)
              .withLabel("Joined Date")
              .withValueBinding((context) => context.localData.joinedDate)
            .endElement
             .showingItem.fromComponentElement(PresetTextComponent)
              .withLabel("User Name")
              .withValueBinding((context) => context.localData.userName)
            .endElement
            .showingItem.fromComponentElement(PresetNumberComponent)
              .withLabel("Points")
              .withValueBinding((context) => context.localData.schemePoints)
            .endElement
            .withSharedProps()
              .withDisplayMode('readonly')
            .endSharedProps
            .showingItem.fromComponentElement(PresetMoneyComponent)
              .withLabel({executionPlan:'', expression: (context) => context.localData.userName + "'s Credit Limit" })
              .withValueBinding((context) => context.localData.creditLimit)
            .endElement
            .showingItem.fromComponentElement(PresetBooleanComponent)
              .withValueBinding((context) => context.localData.marketingConsent)
            .endElement
            .showingItem.fromComponentElement(PresetTextComponent)
              .withLabel("User Name")
              .withValueBinding((context) => context.localData.userName)
            .endElement
        .endSet
        .endElement
     .endSet 
     
     .BuildUiPlan()
    return userInfoLauout
}