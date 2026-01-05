import { default as objectPath } from 'object-path';
export function resolvePath(obj, resolver) {
    if (typeof resolver === 'function') {
        return resolver(obj);
    }
    if (typeof resolver === 'string') {
        const value = objectPath.get(obj, resolver);
        return value;
    }
    return undefined;
}
//# sourceMappingURL=pathResolver.js.map