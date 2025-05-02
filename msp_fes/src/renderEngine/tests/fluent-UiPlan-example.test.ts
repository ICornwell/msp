import { Re } from '../index.ts'

describe('ReUiPlanBuilder', () => { 
  it('should create a ReUiPlanBuilder with default values', () => {
    const builder = Re.UiPlan('testPlan')
    const plan = builder.build()
    expect(plan.schemas).toBeUndefined()
    expect(plan.rules).toBeUndefined()
    expect(plan.fluxors).toBeUndefined()
    expect(plan.mainPlanElementSet).toBeUndefined()
    expect(plan.description).toBeUndefined()
  })

  it('should set schemas correctly', () => {
    const builder = Re.UiPlan('testPlan').withSchema(['schema1', 'schema2'])
    const plan = builder.build()
    expect(plan.schemas).toEqual(['schema1', 'schema2'])
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
    expect(plan.mainPlanElementSet).toEqual(mainElement)
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
      .withSchema(['schema1'])
      .withRules(['rule1'])
   //   .withFluxorSet(['guide1'])
      .withMainPlanElementSet(mainElement)
      .withDescription('Test description')
      .build()

    expect(plan.id).toEqual('testPlan')
    expect(plan.name).toEqual('testPlan')
    expect(plan.schemas).toEqual(['schema1'])
    expect(plan.rules).toEqual(['rule1'])
    expect(plan.fluxors).toEqual(['guide1'])
    expect(plan.mainPlanElementSet).toEqual(mainElement)
  })
})