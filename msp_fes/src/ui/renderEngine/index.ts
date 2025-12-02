import {
  CreateReUiPlan, CreateReUiPlanElementSet
  , CreateReUiPlanComponent, ReUiPlanElementSetBuilder
  , ReUiPlanComponentBuilder, PropsOf
} from './UiPlan/ReUiPlanBuilder.js';
import type { CNTX } from './UiPlan/ReUiPlan.js';
import { ComponentWrapper } from './components/ReComponentWrapper.js';
//import { ReComponentAttributeBinder, ReComponentRecordBinder } from './components/ReComponentProps';
//import { Bind } from './data/binders.js'

class ReUiPlan {
  UiPlan(name: string, version: string = 'default') {
    return CreateReUiPlan(name, version)
  }

  get ElementSet(): ReUiPlanElementSetBuilder<CNTX, any> {
    return CreateReUiPlanElementSet(undefined as any, [])
  }

  StandaloneElement<T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<CNTX, T, PropsOf<T>, any> {
    return CreateReUiPlanComponent<CNTX, T, PropsOf<T>, any>(undefined, component.displayName, [])
  }

  ContainerElement<T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<CNTX, T, PropsOf<T>, any> {
    return CreateReUiPlanComponent<CNTX, T, PropsOf<T>, any>(undefined, component.displayName, [])
  }
 /*  get Bind() {
    return Bind
  } */
}

export const Re = new ReUiPlan()


// export const Re =  {
//     UiPlan: CreateReUiPlan,
//     Element: CreateReUiPlanElement,
//     Component: {
//       Options: CreateReUiPlanComponent()
//     },
//     Binders : {
//       Simple: simple,
//       Function: functionAttribute
//     }
//   }
