import { ColumnsComponent } from '../../../components/containers/columns'
import { LabelFrameComponent } from '../../../components/containers/labelframe'
import { PresetBooleanComponent } from '../../../components/primatives/presets/PresetBoolean'
import { PresetDateComponent } from '../../../components/primatives/presets/PresetDate'
import { PresetMoneyComponent } from '../../../components/primatives/presets/PresetMoney'
import { PresetNumberComponent } from '../../../components/primatives/presets/PresetNumber'
import { PresetTextComponent } from '../../../components/primatives/presets/PresetText'
import {Re} from '../../index'
import { userInfoFluxorData } from './UserInfo'


export function UserInfoLayout() {
  const userInfoLauout = Re.makeUiPlan('UserInfo', '1.0')
   
    .withElementSet.usingFluxor(userInfoFluxorData)
    .fromInlineElementSet
 
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
                  .withComponentProps({})
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
    
    .BuildUiPlan({})


    /*
      Re.ElementSet.showFixedComponent(EngineComponentNames.Text, Re.StandaloneElement
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.userName}))
      )
      .showFluxorComponent(Re.StandaloneElement
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.userName}))
      )
      .showFluxorComponent(Re.StandaloneElement
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.marketingConsent}))
      )
      .showFluxorComponent(Re.StandaloneElement
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.creditLimit}))
      )
      .showFixedComponent(EngineComponentNames.Text, Re.StandaloneElement
        .withValueBinding(Re.Bind.Attribute.FromFunction({recordFetchingFunction: (data: any) => data.testUserInfo,
           dataAttributeName: attributes.email, sourceType: 'Absolute'}))
      )
      .showFixedComponent(EngineComponentNames.Button, Re.StandaloneElement
        .withLabel('Test Button')
      )
    )
*/
    return userInfoLauout
}