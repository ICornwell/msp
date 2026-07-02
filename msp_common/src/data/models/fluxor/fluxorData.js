const fluxorMetaKeys = new Set([
    'dictionaryName',
    'attributeName',
    'preferredDisplayType',
    'preferredDisplayComponent',
    'defaultValue',
    'label',
    'helperText',
    'disabled',
    'hidden',
    'error',
    'withChildData',
    '_parentObjectKeyName',
    '_schemaName',
    'isArray',
    'isComplex',
]);
function getChildFluxorDescriptor(node) {
    if (!node || typeof node !== 'object') {
        return {};
    }
    const childEntries = Object.entries(node).filter(([key]) => !fluxorMetaKeys.has(key));
    const inlineChildren = Object.fromEntries(childEntries);
    const withChildData = node.withChildData && typeof node.withChildData === 'object'
        ? node.withChildData
        : {};
    return { ...withChildData, ...inlineChildren };
}
function isComplexFluxorNode(node) {
    if (!node || typeof node !== 'object') {
        return false;
    }
    if (node.isComplex === true) {
        return true;
    }
    return Object.keys(getChildFluxorDescriptor(node)).length > 0;
}
export function ExpandDataForFluxor(data, fluxorData) {
    if (!fluxorData || typeof fluxorData !== 'object') {
        return data;
    }
    const target = (data && typeof data === 'object') ? data : {};
    for (const [key, descriptor] of Object.entries(fluxorData)) {
        if (!descriptor || typeof descriptor !== 'object') {
            if (!(key in target)) {
                target[key] = undefined;
            }
            continue;
        }
        const childDescriptor = getChildFluxorDescriptor(descriptor);
        const hasChildDescriptor = Object.keys(childDescriptor).length > 0;
        const isArrayNode = descriptor.isArray === true;
        const isComplexNode = isComplexFluxorNode(descriptor);
        if (!(key in target) || target[key] === undefined) {
            if (isArrayNode) {
                target[key] = [];
            }
            else if (isComplexNode) {
                target[key] = {};
            }
            else if ('defaultValue' in descriptor) {
                target[key] = descriptor.defaultValue;
            }
            else {
                target[key] = undefined;
            }
        }
        if (isArrayNode && hasChildDescriptor && Array.isArray(target[key])) {
            target[key] = target[key].map((item) => ExpandDataForFluxor(item, childDescriptor));
            continue;
        }
        if (isComplexNode && hasChildDescriptor) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                target[key] = {};
            }
            target[key] = ExpandDataForFluxor(target[key], childDescriptor);
        }
    }
    return target;
}
//# sourceMappingURL=fluxorData.js.map