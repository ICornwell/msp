const uiFeatureList = [];
function registerFeature(feature) {
    uiFeatureList.push(feature);
}
function getFeatures() {
    return uiFeatureList;
}
export const uiFeatureRegistry = {
    registerFeature,
    getFeatures
};
//# sourceMappingURL=uiFeatureRegistry.js.map