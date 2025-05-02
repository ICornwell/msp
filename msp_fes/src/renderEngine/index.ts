import {CreateReUiPlan, CreateReUiPlanElement, CreateReUiPlanComponent} from './UiPlan/ReUiPlanBuilder';
import { ReComponentAttributeBinder, ReComponentRecordBinder } from './components/ReComponentProps';
import { Bind } from './data/binders'

class ReUiPlan {
   UiPlan(name: string, version: string = 'default') {
    return CreateReUiPlan(name, version)
  }

  get Element() {
    return CreateReUiPlanElement()
  }

  get ComponentOptions() {
    return CreateReUiPlanComponent<ReComponentAttributeBinder>()
  }

  get ContainerOptions() {
    return CreateReUiPlanComponent<ReComponentRecordBinder>()
  }
  get Bind() {
    return Bind
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
