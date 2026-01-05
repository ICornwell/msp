import type { UiFeatureManifestSection } from "msp_common";
declare function registerFeature(feature: UiFeatureManifestSection): Promise<any>;
declare function getFeatures(): UiFeatureManifestSection[];
export declare const uiFeatureRegistry: {
    registerFeature: typeof registerFeature;
    getFeatures: typeof getFeatures;
};
export {};
