import type { ActivitySet, ServiceActivity, ServiceActivityResult, ServiceActivityResultBuilder } from './serviceActivitySet.js';
import { isMatch } from './isMatch.js';
import { CreateResultBuilder, defaultResult, addServiceActivityToSet } from './serviceActivitySet.js';

export function serviceManager() {
    const activities: ServiceActivity[] = []
    const activitySets: ActivitySet[] = [] 
    return {
        use: function (serviceActivity: ServiceActivity | ServiceActivity[] | ActivitySet): void {
            if ('handle' in serviceActivity) {
                activitySets.push(serviceActivity);
                return;
            }
            const activityArray = Array.isArray(serviceActivity) ? serviceActivity : [serviceActivity];
            for (const serviceActivity of activityArray)
                addServiceActivityToSet(activities, serviceActivity);
        },

        runAllMatches: async function (namespace: string, activityName: string, version: string, payload: any): Promise<ServiceActivityResult> {
            const result = {
                ...defaultResult,
                namespace: namespace,
                activityName:  activityName,
                version: version
            }
            const rb = CreateResultBuilder(result)

            async function runAllMatches(candidateActivies: ServiceActivity[], resultBuilder: ServiceActivityResultBuilder) {
                const matchingActivities = candidateActivies.filter((handler) => isMatch(namespace, handler.namespace)
                    && isMatch(activityName, handler.activityName)
                    && isMatch(version, handler.version));
                for (const activity of matchingActivities) {
                    for (const func of Array.isArray(activity.funcs) ? activity.funcs : [activity.funcs]) {
                        await func(payload, resultBuilder);
                        if (resultBuilder.currentResult().updatedPayload) {
                            payload = resultBuilder.currentResult().updatedPayload;
                        }
                    }
                }
            }
            for (const activitySet of activitySets) {
                await activitySet.handle(namespace, activityName, version, payload, rb);
            }
            await runAllMatches(activities, rb);

            return result
        }
    }
}