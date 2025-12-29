import {
  CreateReUiPlan, CreateReUiPlanElementSet
  , CreateReUiPlanComponent, ReUiPlanElementSetBuilder
  , ReUiPlanComponentBuilder, PropsOf
} from './UiPlan/ReUiPlanBuilder.js';
import type { CNTX } from './UiPlan/ReUiPlan.js';
import { ComponentWrapper } from './components/ReComponentWrapper.js';
//import { ReComponentAttributeBinder, ReComponentRecordBinder } from './components/ReComponentProps';
//import { Bind } from './data/binders.js'

function ReUiPlanner()  {
  const plan = {
    makeUiPlan: (name: string, version: string = 'default') => {
    return CreateReUiPlan(name, version)
  },

    makeElementSetPlan: (): ReUiPlanElementSetBuilder<CNTX, any> =>  {
    return CreateReUiPlanElementSet(undefined as any, [])
  },

  makeElementPlan: <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<CNTX, T, any> => {
    return CreateReUiPlanComponent<CNTX, T, any>(undefined, component, [])
  },

 
}
  return plan
}

export const Re = ReUiPlanner()


