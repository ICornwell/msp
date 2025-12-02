import {TextComponent} from '../../components/primatives/textInput.tsx'
import { ReGroupComponent } from '../components/ReGroup.tsx'
import { Re } from '../index.ts'
//import { ReUiPlanElementSetBuilder } from '../UiPlan/ReUiPlanBuilder.ts'
//import { TestClassA, TestClassB } from './fluxSchema.test.ts'
import { userInfoFluxorData, userPreferencesFluxorData } from './userInfo/UserInfo.ts'

describe('ReUiPlanBuilder', () => { 
  it('using inline elements', () => {
    const builder = Re.UiPlan('testPlan')
    .withDescription('An example plan')
//    .withSchema([TestClassA, TestClassB])
    .withRules(['rule1', 'rule2'])
    .withElementSet.forDataDescribedBy(userInfoFluxorData)
    
      .fromInlineElementSet
        .showingStandalone.fromInlineElementUsingComponent(TextComponent)
          .withLabel('Standalone Component')
          .withComponentProps({ })
          .withValueBinding((context)=>context.localData.phoneNumber)
          .endElement
        .showingContainer.fromInlineContainerElementUsingComponent(ReGroupComponent)
              .withLabel('container')
            .endElement
            .containingForDataDescribedBy(userPreferencesFluxorData)
              .showingStandalone.fromInlineElementUsingDataMap()
                .withLabel('Child Component 1')
                .endElement
              .showingStandalone.fromInlineElementUsingComponent(TextComponent)
                .withLabel('Standalone Component')
                .withComponentProps({type: 'email'  })
                .withValueBinding((context)=>context.localData.colorPalette)
                .endElement
          .endSet
      .endSet
      

    const plan = builder.BuildUiPlan()

    expect(plan.description).toBe('An example plan')
  })

  it('using external builder elements', () => {
    const text1Builder = Re.StandaloneElement(TextComponent)
        .withLabel('Standalone Component')
        .withComponentProps({textVariant: 'header1'  })

    const text2Builder = Re.StandaloneElement(TextComponent)
        .withLabel('Standalone Component')

    const builder = Re.UiPlan('testPlan')
    .withDescription('An example plan')
 //   .withSchema([TestClassA, TestClassB])
    .withRules(['rule1', 'rule2'])
    .withElementSet.forDataDescribedBy(userInfoFluxorData).fromInlineElementSet
      .showingStandalone.fromElementBuilder(text1Builder)
      .showingContainer.fromInlineContainerElementUsingComponent(ReGroupComponent)
        .withValueBinding((context)=>context.localData)
        .withLabel('container')
        .endElement.containing
          .showingStandalone.fromElementBuilder(text2Builder)
      .endSet
      .endSet

    const plan = builder.BuildUiPlan()

    expect(plan.description).toBe('An example plan')
  })

 
})