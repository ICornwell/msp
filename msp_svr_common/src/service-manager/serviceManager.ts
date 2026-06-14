import type { ServiceActivityResult } from "msp_common";
import type { ActivitySet, ServiceActivity } from './serviceActivitySet.js';
//import { isMatch } from './isMatch.js';
import { CreateResultBuilder, defaultResult, emptyActivitySet } from './serviceActivitySet.js';

export function serviceManager() {
    const activities: ActivitySet = emptyActivitySet()
    const activitySets: ActivitySet[] = [activities] 
    return {
        use: function (serviceActivity: ServiceActivity | ServiceActivity[] | ActivitySet): void {
            if ('isEmpty' in serviceActivity && !serviceActivity.isEmpty()) {
                activitySets.push(serviceActivity);
                return;
            }

            // make single activity into an array so we can handle both cases the same way
            const activityArray: ServiceActivity[] = Array.isArray(serviceActivity) ? serviceActivity as ServiceActivity[] : [serviceActivity as ServiceActivity];
            for (const serviceActivity of activityArray)
                activities.use(serviceActivity);
        },

        runAllMatches: async function (namespace: string, activityName: string, version: string, variantName: string, payload: any): Promise<ServiceActivityResult> {
            const result = {
                ...defaultResult,
                namespace: namespace,
                activityName:  activityName,
                version: version,
                variantName: variantName
            }
            const rb = CreateResultBuilder(result)

            for (const activitySet of activitySets) {
                if (activitySet.hasNamespace(undefined)) {
                    console.log(`Activity set with undefined namespace`);
                }
                if (activitySet.isEmpty() || !activitySet.hasNamespace(namespace)) continue;
                await activitySet.handle(namespace, activityName, version, variantName, payload, rb);
            }

            return result
        }
    }
}