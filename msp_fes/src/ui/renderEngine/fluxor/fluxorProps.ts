import { FluxorData } from "./fluxorData";

export type DataOf<T extends FluxorData<any>> =
  T extends FluxorData<infer D> ? D : never;

export type FluxorProps<TChildren> = {
  dictionaryName?: string,
  attributeName?: string,
  preferredDisplayType?: string,
  preferredDisplayComponent?: string,
  defaultValue?: any,
  label?: string,
  helperText?: string,
  disabled?: boolean,
  hidden?: boolean,
  error?: boolean,
  withChildData?: TChildren,
  _parentObjectKeyName?: string,
  _schemaName?: string,
 }

