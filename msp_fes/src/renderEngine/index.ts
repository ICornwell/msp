import {CreateReUiPlan, CreateReUiPlanElement, CreateReUiPlanComponent} from './UiPlan/ReUiPlanBuilder';
import { recordAttribute, functionAttribute } from './data/binders'

class ReUiPlan {
   UiPlan(name: string, version: string = 'default') {
    return CreateReUiPlan(name, version)
  }

  get Element() {
    return CreateReUiPlanElement()
  }

  get ComponentOptions() {
    return CreateReUiPlanComponent()
  }
  get Binders() {
    return {
      RecordAttribute: recordAttribute,
      FunctionAttribute: functionAttribute
    }
  }
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
