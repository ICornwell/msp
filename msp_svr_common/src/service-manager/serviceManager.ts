import type { ActivitySet, ServiceActivity, ServiceActivityResult } from './serviceActivitySet.js';
//import { isMatch } from './isMatch.js';
import { CreateResultBuilder, defaultResult, activitySet } from './serviceActivitySet.js';

export function serviceManager() {
    const activities: ActivitySet = activitySet()
    const activitySets: ActivitySet[] = [activities] 
    return {
        use: function (serviceActivity: ServiceActivity | ServiceActivity[] | ActivitySet): void {
            if ('handle' in serviceActivity) {
                activitySets.push(serviceActivity);
                return;
            }

            // make single activity into an array so we can handle both cases the same way
            const activityArray = Array.isArray(serviceActivity) ? serviceActivity : [serviceActivity];
            for (const serviceActivity of activityArray)
                activities.use(serviceActivity);
        },

        runAllMatches: async function (namespace: string, activityName: string, version: string, payload: any): Promise<ServiceActivityResult> {
            const result = {
                ...defaultResult,
                namespace: namespace,
                activityName:  activityName,
                version: version
            }
            const rb = CreateResultBuilder(result)

            for (const activitySet of activitySets) {
                await activitySet.handle(namespace, activityName, version, payload, rb);
            }

            return result
        }
    }
}