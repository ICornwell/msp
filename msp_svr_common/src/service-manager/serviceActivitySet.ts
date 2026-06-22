import { isMatch, bestVersionMatch, Matcher } from "./isMatch.js";
import { ServiceActivityResult } from "msp_common";

export type ServiceActivityExec = (payload: any, serviceResult: ServiceActivityResultBuilder) => Promise<ServiceActivityResultBuilder>;

export type ServiceActivityList = ServiceActivityExec[] | ServiceActivityExec;

export type ServiceActivity = {
    activityName: Matcher;
    namespace: Matcher;
    version: string;
    variantName: string;
    matchingVersionRange: string
    context: Matcher
    funcs: ServiceActivityExec | ServiceActivityExec[];
}

export type ServiceActivityResultBuilder = {
    updatePayload: (payload: any) => ServiceActivityResultBuilder;
    updateResult: (result: any) => ServiceActivityResultBuilder;
    success: (result?: any, message?: string) => ServiceActivityResultBuilder;
    successfullyFailed: (result?: any,message?: string, error?: any) => ServiceActivityResultBuilder;
    failed: (message?: string, error?: any) => ServiceActivityResultBuilder;
    log: (message: string) => ServiceActivityResultBuilder;
    setNoCacheDataFlag: () => ServiceActivityResultBuilder;
    currentResult: () => any;
}

export function getEmptyResult(): ServiceActivityResult {
    return {
        activityName: '',
        namespace: '',
        version: '',
        variantName: '',
        updatedPayload: undefined,
        success: false,
        message: undefined,
        error: undefined,
        logs: [],
        noCacheData: false,
        result: undefined
    }
}

export function CreateResultBuilder(result?: ServiceActivityResult): ServiceActivityResultBuilder {
    if (!result) {
        result = { ...getEmptyResult()   };
    }
    return {
        updatePayload: function (payload: any) {
            result.updatedPayload = payload;
            return this;
        },
        updateResult: function (value: any) {
            result.result = value;
            return this;
        },
        success: function (value?: any, message?: string) {
            result.success = true;
            if (value) {
                result.result = value;
            }
            result.error = undefined;
            if (message) {
                result.message = message;
            }
            return this;
        },
        successfullyFailed: function (value?: any,message?: string, error?: any) {
            result.success = true;
            if (value) {
                result.result = value;
            }
            if (message) {
                result.message = message;
            }
            if (error) {
                result.error = error;
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
        setNoCacheDataFlag: function () {
            result.noCacheData = true;
            return this;
        },
        currentResult: function () {
            return result;
        }
    }
}

export function addServiceActivityToSet(set: ServiceActivity[], activity: ServiceActivity) {
    if (Array.isArray(activity.funcs)) {
        set.push(...(activity.funcs.map((f) => ({
            namespace: activity.namespace,
            activityName: activity.activityName,
            version: activity.version,
            variantName: activity.variantName,
            matchingVersionRange: activity.matchingVersionRange,
            context: activity.context,
            funcs: f
        }))));
    } else {
        set.push({
            namespace: activity.namespace,
            activityName: activity.activityName,
            version: activity.version,
            variantName: activity.variantName,
            matchingVersionRange: activity.matchingVersionRange,
            context: activity.context,
            funcs: activity.funcs
        });
    }
}

export type ActivitySet = {
    isEmpty: () => boolean;
    hasNamespace: (namespace?: string) => boolean;
    activities: ServiceActivity[];
    use: (serviceActivity: ServiceActivity) => void;
    useBefore: (serviceActivity: ServiceActivity) => void;
    useAfter: (serviceActivity: ServiceActivity) => void;
    handle: (namespace: string, activityName: string, version: string, variantName: string, payload: any, resultBuilder?: ServiceActivityResultBuilder) => Promise<ServiceActivityResultBuilder>;
}

//the builder doesn't need handle or isEmpty, those are implemented in the final ActivitySet
// for runtime use
type ActivitySetBuilder = {
    [P in keyof Omit<ActivitySet, 'handle' | 'isEmpty' | 'hasNamespace' | 'activities'>]-?:
    (ActivitySet[P] extends (...args: any) => any ? (serviceActivity: ServiceActivityWithOptionals) => ActivitySetBuilder : ActivitySetBuilder)
} & {
    withNamespace: (namespace: string) => ActivitySetBuilder;
    withVersion: (version: string) => ActivitySetBuilder;
    withVariantName: (variantName: string) => ActivitySetBuilder;
    withMatchingVersionRange: (matchingVersionRange: string) => ActivitySetBuilder;
    withContext: (context: Matcher) => ActivitySetBuilder;

    build: () => ActivitySet;
}

// The builder is used for defining activities with shared options in a fluent way, e.g. for a whole manifest or a whole service
// so common props are optional
type ServiceActivityWithOptionals = {
    [P in keyof Pick<ServiceActivity, 'namespace' | 'version' | 'matchingVersionRange' | 'context' | 'variantName'>]+?: ServiceActivity[P]
} & Omit<ServiceActivity, 'namespace' | 'version' | 'matchingVersionRange' | 'context' | 'variantName'>;

export function emptyActivitySet(): ActivitySet {
    return buildActivitySet().build();
}

export function buildActivitySet(): ActivitySetBuilder {

    const activities: ServiceActivity[] = []

    const middlewareBefore: ServiceActivity[] = []
    const middlewareAfter: ServiceActivity[] = []

    let currentNamespace = ''
    let currentVersion = ''
    let currentVariantName = ''
    let currentMatchingVersionRange = ''
    let currentContext: Matcher = '*';

    // use the defined props if given, or the current shared ones, or defaults
    function completeServiceActivityWithCurrentOptions(activity: ServiceActivityWithOptionals): ServiceActivity {
        return {
            namespace: activity.namespace || currentNamespace || '*',
            activityName: activity.activityName,
            version: activity.version || currentVersion || '1.0.0',
            variantName: activity.variantName || currentVariantName || 'default',
            matchingVersionRange: activity.matchingVersionRange || currentMatchingVersionRange || '*',
            context: activity.context || currentContext || '*',
            funcs: activity.funcs
        }
    }

    const builder: ActivitySetBuilder = {
        withNamespace: function (namespace: string): ActivitySetBuilder {
            currentNamespace = namespace;
            return builder;
        },
        withVersion: function (version: string): ActivitySetBuilder {
            currentVersion = version;
            return builder;
        },
        withVariantName: function (variantName: string): ActivitySetBuilder {
            currentVariantName = variantName;
            return builder;
        },
        withMatchingVersionRange: function (matchingVersionRange: string): ActivitySetBuilder {
            currentMatchingVersionRange = matchingVersionRange;
            return builder;
        },
        withContext: function (context: Matcher): ActivitySetBuilder {
            currentContext = context;
            return builder;
        },

        useBefore: function (serviceActivity: ServiceActivityWithOptionals): ActivitySetBuilder {
            addServiceActivityToSet(middlewareBefore, completeServiceActivityWithCurrentOptions(serviceActivity));
            return builder;
        },
        useAfter: function (serviceActivity: ServiceActivityWithOptionals): ActivitySetBuilder {
            addServiceActivityToSet(middlewareAfter, completeServiceActivityWithCurrentOptions(serviceActivity));
            return builder;
        },

        use: function (serviceActivity: ServiceActivityWithOptionals): ActivitySetBuilder {
            addServiceActivityToSet(activities, completeServiceActivityWithCurrentOptions(serviceActivity));
            return builder;
        },



        build: function (): ActivitySet {
            return {
                isEmpty: function () {
                    return activities.length === 0;
                },
                hasNamespace: function (namespace?: string) {
                    return activities.some(a => a.namespace === namespace);
                },

                use: builder.use,
                useBefore: builder.useBefore,
                useAfter: builder.useAfter,
                activities: activities,

                handle: async function (namespace: string, activityName: string, version: string, variantName: string,
                    payload: any, resultBuilder?: ServiceActivityResultBuilder): Promise<ServiceActivityResultBuilder> {
                    const rb = (!resultBuilder) ? CreateResultBuilder() : resultBuilder;

                    async function runAllMatches(candidateActivies: ServiceActivity[], resultBuilder: ServiceActivityResultBuilder, runBeforeAndAfter = true) {
                        const matchingActivities = candidateActivies.filter((handler) => isMatch(namespace, handler.namespace)
                            && isMatch(activityName, handler.activityName) && isMatch(variantName, handler.variantName));

                        const bestVersionActivities = bestVersionMatch(matchingActivities, version,
                            (x) => `${x.namespace}:${x.activityName}:${x.variantName}`, (x) => x.version,
                            x => (x.matchingVersionRange ?? 'none'));
                        console.log(`Found ${matchingActivities.length} matching activities, running ${bestVersionActivities.length} out of ${activities.length} with best version match for version ${version}`);

                        if (bestVersionActivities.length === 0) {
                            console.warn(`No matching activity found for ${namespace}:${activityName} v${version} from ${activities.length} registered activities`);
                            console.warn(`Available activities were: ${candidateActivies.map(a => `${a.namespace}:${a.activityName} v${a.version} (match range: ${a.matchingVersionRange})`).join(', ')}`);
                            return;
                        }

                        for (const activity of bestVersionActivities) {
                            for (const func of Array.isArray(activity.funcs) ? activity.funcs : [activity.funcs]) {
                                console.log(`Running activity ${activity.namespace}:${activity.activityName} v${activity.version} for request version ${version}`);

                                if (runBeforeAndAfter && (middlewareBefore?.length ?? 0) !== 0) {
                                    await runAllMatches(middlewareBefore, rb, false);
                                }

                                await func(payload, resultBuilder);
                                if (resultBuilder.currentResult().updatedPayload) {
                                    payload = resultBuilder.currentResult().updatedPayload;
                                }

                                if (runBeforeAndAfter && (middlewareAfter?.length ?? 0) !== 0) {
                                    await runAllMatches(middlewareAfter, rb, false);
                                }

                            }
                        }
                    }

                    await runAllMatches(activities, rb);


                    return rb;
                }
            }
        }
    }

    return builder;
}