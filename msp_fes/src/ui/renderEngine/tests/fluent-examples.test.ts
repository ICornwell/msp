import TextInput, {TextComponent, TextInputProps} from '../../components/primatives/editing/textInput.tsx'
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
        .withSharedProps()
          .withDisplayMode('editable')
          .withLabelPosition('start')
        .endSharedProps
        .showingItem.fromInlineElementUsingComponent(TextComponent)
          .withLabel('Standalone Component')
          .withComponentProps({ })
          .withValueBinding((context)=>context.localData.phoneNumber)
          .endElement
        .showingItem.fromInlineElementUsingComponent(ReGroupComponent)
              .withLabel('container')
           
            .containingElementSet()
              
              .showingItem.fromInlineElementUsingDataMap()
                .withLabel('Child Component 1')
                .withValueBinding((context)=>context.localData.userName)
              .endElement
              .forDataDescribedBy(userPreferencesFluxorData, (context)=>context.localData.preferences)
              .withSharedProps()
                .withDisplayMode('readonly')
                .withComponentProps({ style: { color: 'blue' } })
              .endSharedProps
              .showingItem.fromInlineElementUsingComponent(TextComponent)
               
                .withLabel('Standalone Component')
                .withComponentProps({type: 'email'  })
                .withValueBinding((context)=>context.localData.colorPalette)
              .endElement
          .endSet
        .endElement
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
      .showingItem.fromElementBuilder(text1Builder)
     /*  .showingContainer.fromInlineContainerElementUsingComponent(ReGroupComponent)
        .withValueBinding((context)=>context.localData)
        .withLabel('container')
        .endElement.containing
          .showingItem.fromElementBuilder(text2Builder)
      .endSet */
      .endSet

    const plan = builder.BuildUiPlan()

    expect(plan.description).toBe('An example plan')
  })

 
})