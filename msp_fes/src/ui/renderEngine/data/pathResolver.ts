import { default as objectPath } from 'object-path'

export function resolvePath<T>(obj: T, resolver: string | Function): any {
  if (typeof resolver === 'function') {
    return resolver(obj);
  }
  if (typeof resolver === 'string') {
  const value = objectPath.get(obj as any, resolver);
  return value;
  }
  return undefined;
}