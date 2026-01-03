import type { UiFeatureManifest } from "msp_common";
declare function registerFeature(feature: UiFeatureManifest): void;
declare function getFeatures(): UiFeatureManifest[];
export declare const uiFeatureRegistry: {
    registerFeature: typeof registerFeature;
    getFeatures: typeof getFeatures;
};
export {};
