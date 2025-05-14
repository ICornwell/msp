import { Re } from '../index.ts'
import { TestClassA, TestClassB } from './fluxSchema.test.ts'

describe('ReUiPlanBuilder', () => { 
  it('should create a ReUiPlanBuilder with default values', () => {
    const builder = Re.UiPlan('testPlan')
    const plan = builder.build()
    expect(plan.schemas).toMatchObject({})
    expect(plan.rules).toMatchObject([])
    expect(plan.fluxors).toMatchObject([])
    expect(plan.mainPlanElementSet).toMatchObject({})
    expect(plan.description).toBe('')
  })

  it('should set schemas correctly', () => {
    const builder = Re.UiPlan('testPlan').withSchema(TestClassA)
    const plan = builder.build()
    const exampleClass = new TestClassA()
    const expectedSchema = exampleClass['~getSchema']()

    expect(plan.schemas).toMatchObject({
      TestA: expectedSchema
    })
  })

  it('should set rules correctly', () => {
    const builder = Re.UiPlan('testPlan').withRules(['rule1', 'rule2'])
    const plan = builder.build()
    expect(plan.rules).toEqual(['rule1', 'rule2'])
  })

  // it('should set Fluxors correctly', () => {
  //   const builder = Re.UiPlan('testPlan').withFluxorSet(['guide1', 'guide2'])
  //   expect(builder.Fluxors).toEqual(['guide1', 'guide2'])
  // })


  it('should set mainPlanElement correctly', () => {
    const mainElement = Re.Element
      .showFixedComponent('TestComponent', Re.ComponentOptions
        .setLabel('Test Label')
        .setHelperText('Test Helper Text')
        .setError(false)
        .addDecorators(['decorator1', 'decorator2'])
      )
      
    const builder = Re.UiPlan('testPlan').withMainPlanElementSet(mainElement)
    const plan = builder.build()
    expect(plan.mainPlanElementSet).toMatchObject(mainElement.build())
  })

  it('should set description correctly', () => {
    const builder = Re.UiPlan('testPlan').withDescription('Test description')
    const plan = builder.build()
    expect(plan.description).toEqual('Test description')
  })

  it('should build a ReUiPlan with the correct values', () => {
    const mainElement = Re.Element.showFixedComponent('TestComponent', Re.ComponentOptions
      .setLabel('Test Label')
      .disable()
      .withValueBinding(Re.Bind.Attribute.FromPath({recordPropertyPath: 'testPath', dataAttributeName: 'testSchema'}))
    )
    const plan = Re.UiPlan('testPlan')
      .withSchema(TestClassA)
      .withRules(['rule1'])
   //   .withFluxorSet(['guide1'])
      .withMainPlanElementSet(mainElement)
      .withDescription('Test description')
      .build()

    expect(plan.id).toEqual('testPlan')
    expect(plan.name).toEqual('testPlan')
    expect(plan.schemas).toEqual(expectedSchema)
    expect(plan.rules).toEqual(['rule1'])
    expect(plan.fluxors).toEqual([])
    expect(plan.mainPlanElementSet).toEqual(mainElement.build())
  })
})

const expectedSchema = {
 "TestA": {
    "attributes": [
      {
        "_parentObjectKeyName":"TestA",
        "_schemaName": "TestClassA",
        "attributeName": "test1",
        "defaultValue": "default value",
        "dictionaryName": "test1",
        "label": "Test Label",
        "preferredDisplayType": "text",
      },
      {
        "_parentObjectKeyName":"TestA",
        "_schemaName": "TestClassA",
        "attributeName": "test2",
        "defaultValue": "default value",
        "dictionaryName": "test2",
        "label": "Test Label",
        "preferredDisplayType": "text",
      },
      {
        "_parentObjectKeyName":"TestA",
        "_schemaName": "TestClassA",
        "attributeName": "test3",
        "defaultValue": "default value",
        "dictionaryName": "test3",
        "label": "Test Label",
        "preferredDisplayType": "text",
      },
    ],
    "name": "TestA",
    "source": "fluxor",
  },
}