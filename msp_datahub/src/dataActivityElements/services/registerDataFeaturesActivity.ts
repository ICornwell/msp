import { ServiceActivityResultBuilder } from "msp_svr_common";
import { registerDataFeatures } from "./dataFeatureRegistry.js";

type DataFeatureRegistrationPayload = {
    manifestNamespace?: string;
    serviceName?: string;
    dataFeatures?: any[];
};

export async  function registerDataFeaturesActivity(payload: any, serviceResult: ServiceActivityResultBuilder) {
        console.log('Received request to register data features');
        const registrations = Array.isArray(payload?.registrations)
            ? payload.registrations
            : [payload];

        const normalized = registrations.flatMap((registration: DataFeatureRegistrationPayload) => {
            const features = Array.isArray(registration?.dataFeatures)
                ? registration.dataFeatures
                : [];
            return features.map((feature: any) => ({
                ...feature,
                manifestNamespace: registration.manifestNamespace,
                serviceName: registration.serviceName,
            }));
        });

        const result = registerDataFeatures(normalized);
        console.log(`Registered ${result.added} new data features, total is now ${result.total}`);
        return serviceResult.success({
            message: 'Data features registered successfully',
            ...result,
        });
    }