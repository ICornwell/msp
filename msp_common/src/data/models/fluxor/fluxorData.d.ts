export type DataOf<T extends FluxorData<any>> = T extends FluxorData<infer D> ? D : never;
export type FluxorProps<TChildren> = {
    dictionaryName?: string;
    attributeName?: string;
    preferredDisplayType?: string;
    preferredDisplayComponent?: string;
    defaultValue?: any;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    hidden?: boolean;
    error?: boolean;
    withChildData?: TChildren;
    _parentObjectKeyName?: string;
    _schemaName?: string;
};
export type FluxorArray = {
    isArray: true;
};
export type FluxorComplex = {
    isComplex: true;
};
export type FluxorPrimitive = (string | undefined) | (number | undefined) | (boolean | undefined) | (Date | undefined);
type FluxorArrayMember<T> = Exclude<T, undefined> extends (infer U)[] ? U : never;
type FluxorArrayNode<T> = FluxorArrayMember<T> extends FluxorPrimitive ? FluxorProps<FluxorArrayMember<T>> & FluxorArray : ((FluxorProps<FluxorArrayMember<T>> & FluxorComplex & FluxorArray) | (FluxorProps<FluxorArrayMember<T>> & FluxorComplex & FluxorArray & FluxorData<FluxorArrayMember<T>>));
type FluxorObjectNode<T> = Exclude<T, undefined> extends FluxorPrimitive ? FluxorProps<Exclude<T, undefined>> : ((FluxorProps<Exclude<T, undefined>> & FluxorComplex) | (FluxorProps<Exclude<T, undefined>> & FluxorComplex & FluxorData<Exclude<T, undefined>>));
export type FluxorData<T> = {
    [alias in keyof T as T[alias] extends never ? never : alias]: Exclude<T[alias], undefined> extends (infer _U)[] ? FluxorArrayNode<T[alias]> : FluxorObjectNode<T[alias]>;
};
export declare function ExpandDataForFluxor<T>(data: any, fluxorData?: FluxorData<T>): any;
export {};
