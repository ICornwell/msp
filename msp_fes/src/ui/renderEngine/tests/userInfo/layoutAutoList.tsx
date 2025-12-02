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
    
    /* (
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
    ) */

    return userInfoLauout
}