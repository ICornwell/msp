
import { FluxorProps } from "./fluxorProps";

// marker type to indicate array data structure
// can only be true, non array types do not have this flag
export type FluxorArray = {
  isArray: true;
}

// marker type to indicate complex data structure
// can only be true, non complex types do not have this flag
export type FluxorComplex = {
  isComplex: true;
}

// the primitive types we support in FluxorProps - anything else is assumed to have data structure and is complex
export type FluxorPrimitive = (string | undefined) | (number | undefined) | (boolean | undefined) | (Date | undefined);

export type FluxorData<T> = {
  // FluxorProps for each property in T that is not never
  [alias in keyof T as T[alias] extends never ? never : alias]: 
    // Exclude undefined from T[alias] to determine if it's an array
    Exclude<T[alias], undefined> extends (infer U)[]
    // for arrays we use the array type with out[], check if U is primitive or complex
    // for non-primitive we add FluxorComplex so metadata includes the isComplex flag
      ? ( (U extends FluxorPrimitive 
        ? FluxorProps<U> : FluxorProps<U> & FluxorComplex) & FluxorArray )
    // this part is the non-array case, same primative vs complex check and handling
      : (T[alias] extends FluxorPrimitive 
        ? FluxorProps<Exclude<T[alias], undefined>> : FluxorProps<Exclude<T[alias], undefined>> & FluxorComplex);
}

