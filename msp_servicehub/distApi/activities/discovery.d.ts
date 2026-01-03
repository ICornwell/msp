import { ServiceActivityResultBuilder } from 'msp_common';
declare const discoveryActivitySet: {
    use: (serviceActivity: import("msp_common").ServiceActivity) => void;
    useBefore: (serviceActivity: import("msp_common").ServiceActivity) => void;
    useAfter: (serviceActivity: import("msp_common").ServiceActivity) => void;
    handle: (namespace: string, activityName: string, version: string, payload: any, resultBuilder?: ServiceActivityResultBuilder) => Promise<ServiceActivityResultBuilder>;
};
export { discoveryActivitySet };
