import {Re} from '../../index.js'

import { userInfoFluxorData } from './UserInfo.js'
import { PresetTextComponent } from '../../../components/primatives/presets/PresetText.js'
import { PresetMoneyComponent } from '../../../components/primatives/presets/PresetMoney.js'
// import { PresetNumberComponent } from '../../../components/primatives/presets/PresetNumber'
// import { PresetBooleanComponent } from '../../../components/primatives/presets/PresetBoolean'
import { ColumnsComponent } from '../../../components/containers/columns'
// import { LabelFrameComponent } from '../../../components/containers/labelframe'
import { TableComponent } from '../../../components/tables/table.js'
// import { PresetDateComponent } from '../../../components/primatives/presets/PresetDate'
import { vehicleFluxorData } from '../../../components/tables/testData.js'

export function UserInfoLayout1() {
   const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
     .withElementSet
       .usingFluxor(vehicleFluxorData)
      .fromInlineElementSet
       .showingItem.fromComponentElement(TableComponent)
          .withLabel('User Info Table')
          .withHelperText('A table showing vehicle information and calculated premiums')
       //   .enableFiltering(true)
          .withColumns()
          .endColumns
        .endElement
      .endSet
      .BuildUiPlan()
    return userInfoLauout
}

export function UserInfoLayout2() {
   const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
     .withElementSet
       .usingFluxor(vehicleFluxorData)
      .fromInlineElementSet
       .showingItem.fromComponentElement(TableComponent)
       .enableFiltering(true)

          .withLabel('User Info Table')
          .withHelperText('A table showing vehicle information and calculated premiums')
             
        .endElement

      .endSet
      .BuildUiPlan()
    return userInfoLauout
}
export function UserInfoLayout22() {
   const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
     .withElementSet
       .usingFluxor(vehicleFluxorData)
      .fromInlineElementSet
       .showingItem.fromComponentElement(TableComponent)
          .withLabel('User Info Table')
          .withHelperText('A table showing vehicle information and calculated premiums')
    //    .enableFiltering(true)
        

        .endElement

      .endSet
      .BuildUiPlan()
    return userInfoLauout
}

export function UserInfoLayout3() {
  const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
    .withElementSet.usingFluxor(userInfoFluxorData)
    .fromInlineElementSet
        .usingFluxor(userInfoFluxorData)
         .showingItem.fromComponentElement(ColumnsComponent)
       //   .withComponentProps({columns: 2, fillDirection: 'down'})
          .containingElementSet()
              .withSharedProps()
                .withDisplayMode('editing')
              .endSharedProps
              .showingItem.fromComponentElement(PresetTextComponent)
                  .withValueBinding((context) => context.localData.userName)
                  .withHelperText('Please enter your full name')
                  
                .endElement
               
            .endSet
        .endElement 
    .endSet
    
    .BuildUiPlan({})
    return userInfoLauout
}

export function UserInfoLayout() {
   const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
     
     .withElementSet
      
     
       .usingFluxor(vehicleFluxorData)
      .fromInlineElementSet
        
       .showingItem.fromComponentElement(TableComponent)
          .withLabel('User Info Table')
          .withHelperText('A table showing vehicle information and calculated premiums')
       //   .enableFiltering(true)
          
          .withColumns()
          .endColumns
    
      
      .withColumns()
        .column(s => s.registration).pinned('left').pinned('right').withHeader('Reg')
        .column(s => s.type)
        
        // Column group: Vehicle Info
        .columnGroup('vehicleInfo', 'Vehicle Details')
          .column(s => s.make).withHeader('Make')
          .column(s => s.model).withHeader('Model')
          .column(s => s.year).withHeader('Year')
          .column(s => s.value).withHeader('Value').withRenderer
            .fromComponentElement(PresetMoneyComponent)
            .withValueBinding((context) => context.localData.value).endElement
        .endGroup
        
        // Column group: Premium Calculation
        .columnGroup('premium', 'Premium')
          .column(s => s.basePremium).withHeader('Base').withRenderer
          .fromComponentElement(PresetMoneyComponent)
            .withValueBinding((context) => context.localData.basePremium)
          .endElement
          .column(s => s.totalModifier).withHeader('Modifier')
          .column(s => s.adjustedPremium).withHeader('Adjusted').withRenderer
            .fromComponentElement(PresetMoneyComponent)
              .withValueBinding((context) => context.localData.adjustedPremium)
            .endElement
        .endGroup
        
      .endColumns
      
            
        .endElement 
    /*    .fromInlineElementSet
        .usingFluxor(userInfoFluxorData)
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
        .endElement */
     .endSet 
     
     .BuildUiPlan()
    return userInfoLauout
}