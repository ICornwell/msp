import { isMatch, Matcher } from "./isMatch.js";

export type ServiceActivityExec = (payload: any, serviceResult: ServiceActivityResultBuilder) => Promise<ServiceActivityResultBuilder>;

export type ServiceActivityList = ServiceActivityExec[] | ServiceActivityExec;

export type ServiceActivity = {
    activityName: Matcher;
    namespace: Matcher;
    version: Matcher;
    context: Matcher
    funcs: ServiceActivityExec | ServiceActivityExec[];
}

export type ServiceActivityResult = {
    activityName: string;
    namespace: string;
    version: string;
    updatedPayload?: any;
    success: boolean;
    message?: string;
    error?: any;
    logs?: string[];
    result?: any;
}

export type ServiceActivityResultBuilder = {
    updatePayload: (payload: any) => ServiceActivityResultBuilder;
    updateResult: (result: any) => ServiceActivityResultBuilder;
    success: (result?: any) => ServiceActivityResultBuilder;
    failed: (message?: string, error?: any) => ServiceActivityResultBuilder;
    log: (message: string) => ServiceActivityResultBuilder;
    currentResult: () => any;
}

export const defaultResult: ServiceActivityResult = {
    activityName: '',
    namespace: '',
    version: '',
    updatedPayload: undefined,
    success: false,
    message: undefined,
    error: undefined,
    logs: [],
    result: undefined
}

export function CreateResultBuilder(result?: ServiceActivityResult): ServiceActivityResultBuilder {
    if (!result) {
        result = defaultResult
    }
    return {
        updatePayload: function (payload: any) {
            result.updatedPayload = payload;
            return this;
        },
        updateResult: function (result: any) {
            result.result = result;
            return this;
        },
        success: function (result?: any) {
            result.success = true;
            if (result) {
                result.result = result;
            }
            return this;
        },
        failed: function (message?: string, error?: any) {
            result.success = false;
            if (message) {
                result.message = message;
            }
            if (error) {
                result.error = error;
            }
            return this;
        },
        log: function (message: string) {
            if (!result.logs) {
                result.logs = [];
            }
            result.logs.push(message);
            return this;
        },
        currentResult: function () {
            return defaultResult;
        }
    }
}

export function addServiceActivityToSet(set: ServiceActivity[], activity: ServiceActivity) {
    if (Array.isArray(activity.funcs)) {
        set.push(...(activity.funcs.map((f) => ({
            namespace: activity.namespace,
            activityName: activity.activityName,
            version: activity.version,
            context: activity.context,
            funcs: f
        }))));
    } else {
        set.push({
            namespace: activity.namespace,
            activityName: activity.activityName,
            version: activity.version,
            context: activity.context,
            funcs: activity.funcs
        });
    }
}

export type ActivitySet = {
    use: (serviceActivity: ServiceActivity) => void;
    useBefore: (serviceActivity: ServiceActivity) => void;
    useAfter: (serviceActivity: ServiceActivity) => void;
    handle: (namespace: string, activityName: string, version: string, payload: any, resultBuilder?: ServiceActivityResultBuilder) => Promise<ServiceActivityResultBuilder>;
}


export function activitySet(): ActivitySet {

    const activities: ServiceActivity[] = []

    const middlewareBefore: ServiceActivity[] = []
    const middlewareAfter: ServiceActivity[] = []



    function useBefore(serviceActivity: ServiceActivity): void {
        addServiceActivityToSet(middlewareBefore, serviceActivity);
    }
    function useAfter(serviceActivity: ServiceActivity): void {
        addServiceActivityToSet(middlewareAfter, serviceActivity);
    }

    function use(serviceActivity: ServiceActivity): void {
        addServiceActivityToSet(activities, serviceActivity);
    }

    async function handle(namespace: string, activityName: string, version: string,
        payload: any, resultBuilder?: ServiceActivityResultBuilder): Promise<ServiceActivityResultBuilder> {
        const rb = (!resultBuilder) ? CreateResultBuilder() : resultBuilder;

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
        await runAllMatches(middlewareBefore, rb);
        await runAllMatches(activities, rb);
        await runAllMatches(middlewareAfter, rb);

        return rb;
    }

    return {
        use,
        useBefore,
        useAfter,
        handle
    }
}