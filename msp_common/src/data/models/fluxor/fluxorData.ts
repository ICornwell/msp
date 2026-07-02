
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

type FluxorArrayMember<T> = Exclude<T, undefined> extends (infer U)[] ? U : never;

type FluxorArrayNode<T> =
  FluxorArrayMember<T> extends FluxorPrimitive
    ? FluxorProps<FluxorArrayMember<T>> & FluxorArray
    : (
      // Backward compatible: existing array-complex metadata-only declarations remain valid.
      (FluxorProps<FluxorArrayMember<T>> & FluxorComplex & FluxorArray)
      // New: allow nested child descriptor declarations directly under the node.
      | (FluxorProps<FluxorArrayMember<T>> & FluxorComplex & FluxorArray & FluxorData<FluxorArrayMember<T>>)
    );

type FluxorObjectNode<T> =
  Exclude<T, undefined> extends FluxorPrimitive
    ? FluxorProps<Exclude<T, undefined>>
    : (
      // Backward compatible: existing complex metadata-only declarations remain valid.
      (FluxorProps<Exclude<T, undefined>> & FluxorComplex)
      // New: allow nested child descriptor declarations directly under the node.
      | (FluxorProps<Exclude<T, undefined>> & FluxorComplex & FluxorData<Exclude<T, undefined>>)
    );

export type FluxorData<T> = {
  // FluxorProps for each property in T that is not never.
  [alias in keyof T as T[alias] extends never ? never : alias]:
    Exclude<T[alias], undefined> extends (infer _U)[]
      ? FluxorArrayNode<T[alias]>
      : FluxorObjectNode<T[alias]>;
}

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

function getChildFluxorDescriptor(node: any): Record<string, any> {
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

function isComplexFluxorNode(node: any): boolean {
  if (!node || typeof node !== 'object') {
    return false;
  }
  if (node.isComplex === true) {
    return true;
  }
  return Object.keys(getChildFluxorDescriptor(node)).length > 0;
}

export function ExpandDataForFluxor<T>(data: any, fluxorData?: FluxorData<T>): any {
  if (!fluxorData || typeof fluxorData !== 'object') {
    return data;
  }

  const target = (data && typeof data === 'object') ? data : {};

  for (const [key, descriptor] of Object.entries(fluxorData as any)) {
    if (!descriptor || typeof descriptor !== 'object') {
      if (!(key in target)) {
        target[key] = undefined;
      }
      continue;
    }

    const childDescriptor = getChildFluxorDescriptor(descriptor);
    const hasChildDescriptor = Object.keys(childDescriptor).length > 0;
    const isArrayNode = (descriptor as any).isArray === true;
    const isComplexNode = isComplexFluxorNode(descriptor);

    if (!(key in target) || target[key] === undefined) {
      if (isArrayNode) {
        target[key] = [];
      } else if (isComplexNode) {
        target[key] = {};
      } else if ('defaultValue' in descriptor) {
        target[key] = descriptor.defaultValue;
      } else {
        target[key] = undefined;
      }
    }

    if (isArrayNode && hasChildDescriptor && Array.isArray(target[key])) {
      target[key] = target[key].map((item: any) => ExpandDataForFluxor(item, childDescriptor as any));
      continue;
    }

    if (isComplexNode && hasChildDescriptor) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      target[key] = ExpandDataForFluxor(target[key], childDescriptor as any);
    }
  }

  return target;
}

