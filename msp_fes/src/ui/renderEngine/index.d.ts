import { ReUiPlanElementSetBuilder, ReUiPlanComponentBuilder } from './UiPlan/ReUiPlanBuilder.js';
import type { CNTX } from './UiPlan/ReUiPlan.js';
import { ComponentWrapper } from './components/ReComponentWrapper.js';
export declare const Re: {
    makeUiPlan: (name: string, version?: string) => import("./UiPlan/ReUiPlanBuilder.js").ReUiPlanBuilder<CNTX>;
    makeElementSetPlan: () => ReUiPlanElementSetBuilder<CNTX, any>;
    makeElementPlan: <T extends ComponentWrapper<any>>(component: T) => ReUiPlanComponentBuilder<CNTX, T, any>;
};
