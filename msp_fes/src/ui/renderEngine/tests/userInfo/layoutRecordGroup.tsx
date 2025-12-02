import {Re} from '../../index'
import { userInfoFluxorData } from './UserInfo'


export function UserInfoLayout() {
  const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
   
    .withElementSet.forDataDescribedBy(userInfoFluxorData)
    .fromInlineElementSet
    .endSet
    .build()


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