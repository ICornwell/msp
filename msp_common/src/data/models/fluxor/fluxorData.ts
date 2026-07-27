
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
      // Complex array member: child descriptors live under the dedicated 'children' key
      // so they can never clash with FluxorProps metadata names, and property access
      // works without union narrowing.
      FluxorProps<FluxorArrayMember<T>> & FluxorComplex & FluxorArray & {
        children?: FluxorData<FluxorArrayMember<T>>;
      }
    );

type FluxorObjectNode<T> =
  Exclude<T, undefined> extends FluxorPrimitive
    ? FluxorProps<Exclude<T, undefined>>
    : (
      // Complex object: child descriptors live under the dedicated 'children' key.
      FluxorProps<Exclude<T, undefined>> & FluxorComplex & {
        children?: FluxorData<Exclude<T, undefined>>;
      }
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
  'children',
  '_parentObjectKeyName',
  '_schemaName',
  'isArray',
  'isComplex',
]);

function getChildFluxorDescriptor(node: any): Record<string, any> {
  if (!node || typeof node !== 'object') {
    return {};
  }

  // Legacy support: child descriptors declared inline alongside metadata keys.
  const childEntries = Object.entries(node).filter(([key]) => !fluxorMetaKeys.has(key));
  const inlineChildren = Object.fromEntries(childEntries);

  const withChildData = node.withChildData && typeof node.withChildData === 'object'
    ? node.withChildData
    : {};

  // Canonical: child descriptors under the dedicated 'children' key win.
  const children = node.children && typeof node.children === 'object'
    ? node.children
    : {};

  return { ...withChildData, ...inlineChildren, ...children };
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

