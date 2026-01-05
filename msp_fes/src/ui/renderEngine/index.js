import { CreateReUiPlan, CreateReUiPlanElementSet, CreateReUiPlanComponent } from './UiPlan/ReUiPlanBuilder.js';
//import { ReComponentAttributeBinder, ReComponentRecordBinder } from './components/ReComponentProps';
//import { Bind } from './data/binders.js'
function ReUiPlanner() {
    const plan = {
        makeUiPlan: (name, version = 'default') => {
            return CreateReUiPlan(name, version);
        },
        makeElementSetPlan: () => {
            return CreateReUiPlanElementSet(undefined, []);
        },
        makeElementPlan: (component) => {
            return CreateReUiPlanComponent(undefined, component, []);
        },
    };
    return plan;
}
export const Re = ReUiPlanner();
//# sourceMappingURL=index.js.map