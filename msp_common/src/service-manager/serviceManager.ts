import type { ServiceActivity, ServiceActivityResultBuilder } from './serviceActivitySet';
import { isMatch } from './isMatch';
import { CreateResultBuilder, defaultResult, addServiceActivityToSet } from './serviceActivitySet';

export function serviceManager() {
    const activities: ServiceActivity[] = []
    return {
        use: function (serviceActivity: ServiceActivity): void {
            addServiceActivityToSet(activities, serviceActivity);
        },

        runAllMatches: async function (namespace: string, activityName: string, version: string, payload: any): Promise<any> {
            const rb = CreateResultBuilder(defaultResult)

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
            await runAllMatches(activities, rb);

            return rb
        }
    }
}