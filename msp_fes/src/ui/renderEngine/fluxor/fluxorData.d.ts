import { FluxorProps } from "./fluxorProps";
export type FluxorArray = {
    isArray: true;
};
export type FluxorComplex = {
    isComplex: true;
};
export type FluxorPrimitive = (string | undefined) | (number | undefined) | (boolean | undefined) | (Date | undefined);
export type FluxorData<T> = {
    [alias in keyof T as T[alias] extends never ? never : alias]: Exclude<T[alias], undefined> extends (infer U)[] ? ((U extends FluxorPrimitive ? FluxorProps<U> : FluxorProps<U> & FluxorComplex) & FluxorArray) : (T[alias] extends FluxorPrimitive ? FluxorProps<Exclude<T[alias], undefined>> : FluxorProps<Exclude<T[alias], undefined>> & FluxorComplex);
};
