import { ReGroupComponent } from '../components/ReGroup.js'
import { Re } from '../index.js'
import { PresetTextComponent } from '../../components/primatives/presets/PresetText.js'

//import { ReUiPlanElementSetBuilder } from '../UiPlan/ReUiPlanBuilder.ts'
//import { TestClassA, TestClassB } from './fluxSchema.test.ts'
import { userInfoFluxorData, userPreferencesFluxorData } from './userInfo/UserInfo.js'

describe('ReUiPlanBuilder', () => { 
  it('using inline elements', () => {
    const builder = Re.makeUiPlan('testPlan')
    .withDescription('An example plan')
//    .withSchema([TestClassA, TestClassB])
    .withRules(['rule1', 'rule2'])
    .withElementSet.usingFluxor(userInfoFluxorData)
    
      .fromInlineElementSet
        .withSharedProps()
          .withDisplayMode('editable')
          .withLabelPosition('start')
        .endSharedProps
        .showingItem.fromComponentElement(PresetTextComponent)
          .withLabel('Standalone Component')
          .withComponentProps({ })
          .withValueBinding((context)=>context.localData.phoneNumber)
          .endElement
        .showingItem.fromComponentElement(ReGroupComponent)
              .withLabel('container')
           
            .containingElementSet()
              
              .showingItem.fromFluxorElement()
                .withLabel('Child Component 1')
                .withValueBinding((context)=>context)
              .endElement
              .usingFluxor(userPreferencesFluxorData, (context)=>context.localData.preferences)
              .withSharedProps()
                .withDisplayMode('readonly')
                .withComponentProps({ style: { color: 'blue' } })
              .endSharedProps
              .showingItem.fromComponentElement(PresetTextComponent)
               
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
    const text1Builder = Re.makeElementPlan(PresetTextComponent)
        .withLabel('Standalone Component')
        .withComponentProps({textVariant: 'header1'  })

/*     const text2Builder = Re.makeElementPlan(PresetTextComponent)
        .withLabel('Standalone Component') */

    const builder = Re.makeUiPlan('testPlan')
    .withDescription('An example plan')
 //   .withSchema([TestClassA, TestClassB])
    .withRules(['rule1', 'rule2'])
    .withElementSet.usingFluxor(userInfoFluxorData).fromInlineElementSet
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