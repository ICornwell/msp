import {Re} from '../../index'
import {SchemaUserInfo} from './schemaUserInfo'
import { ObjectName, Attributes } from '../../fluxor/fluxSchemaBase'
import {EngineComponentNames} from '../../../components/eningeComponentNames'

const recordPath = ObjectName(SchemaUserInfo)
const attributes = Attributes(SchemaUserInfo)

export function UserInfoLayout() {
  const userInfoLauout = Re.UiPlan('UserInfo', '1.0')
    .withSchema(SchemaUserInfo)
    .withMainPlanElementSet(
      Re.Element.showFixedComponent(EngineComponentNames.Text, Re.ComponentOptions
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.userName}))
      )
      .showFluxorComponent(Re.ComponentOptions
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.userName}))
      )
      .showFluxorComponent(Re.ComponentOptions
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.marketingConsent}))
      )
      .showFluxorComponent(Re.ComponentOptions
        .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: recordPath, dataAttributeName: attributes.creditLimit}))
      )
      .showFixedComponent(EngineComponentNames.Text, Re.ComponentOptions
        .withValueBinding(Re.Bind.Attribute.FromFunction({recordFetchingFunction: (data: any) => data.testUserInfo,
           dataAttributeName: attributes.email, sourceType: 'Absolute'}))
      )
      .showFixedComponent(EngineComponentNames.Button, Re.ComponentOptions
        .setLabel('Test Button')
      )
    )

    return userInfoLauout
}