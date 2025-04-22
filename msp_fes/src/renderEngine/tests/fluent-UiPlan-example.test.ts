import { Re } from '../index.ts'

describe('ReUiPlanBuilder', () => { 
  it('should create a ReUiPlanBuilder with default values', () => {
    const builder = Re.UiPlan('testPlan')
    expect(builder.schemas).toBeUndefined()
    expect(builder.rules).toBeUndefined()
    expect(builder.Fluxors).toBeUndefined()
    expect(builder.mainPlanElement).toBeUndefined()
    expect(builder.description).toBeUndefined()
  })

  it('should set schemas correctly', () => {
    const builder = Re.UiPlan('testPlan').withSchema(['schema1', 'schema2'])
    expect(builder.schemas).toEqual(['schema1', 'schema2'])
  })

  it('should set rules correctly', () => {
    const builder = Re.UiPlan('testPlan').withRules(['rule1', 'rule2'])
    expect(builder.rules).toEqual(['rule1', 'rule2'])
  })

  it('should set Fluxors correctly', () => {
    const builder = Re.UiPlan('testPlan').withFluxorSet(['guide1', 'guide2'])
    expect(builder.Fluxors).toEqual(['guide1', 'guide2'])
  })


  it('should set mainPlanElement correctly', () => {
    const mainElement = Re.Element
      .showFixedComponent('TestComponent', Re.ComponentOptions
        .setLabel('Test Label')
        .setHelperText('Test Helper Text')
        .setError(false)
        .addDecorators(['decorator1', 'decorator2'])
      )
      
    const builder = Re.UiPlan('testPlan').withMainPlanElement(mainElement)
    expect(builder.mainPlanElement).toEqual(mainElement)
  })

  it('should set description correctly', () => {
    const builder = Re.UiPlan('testPlan').withDescription('Test description')
    expect(builder.description).toEqual('Test description')
  })

  it('should build a ReUiPlan with the correct values', () => {
    const mainElement = Re.Element.showFixedComponent('TestComponent', Re.ComponentOptions
      .setLabel('Test Label')
    )
    const plan = Re.UiPlan('testPlan')
      .withSchema(['schema1'])
      .withRules(['rule1'])
      .withFluxorSet(['guide1'])
      .withMainPlanElement(mainElement)
      .withDescription('Test description')
      .build()

    expect(plan.id).toEqual('testPlan')
    expect(plan.name).toEqual('testPlan')
    expect(plan.schemas).toEqual(['schema1'])
    expect(plan.rules).toEqual(['rule1'])
    expect(plan.fluxors).toEqual(['guide1'])
    expect(plan.mainPlanElement).toEqual(mainElement)
  })
})