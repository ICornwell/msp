import { parse, stringify } from 'flatted';

/**
 * Serialises an object graph for internal MSP transport while preserving repeated references.
 */
export function serialiseCircularJson(value: unknown): string {
  return stringify(value);
}

/**
 * Restores repeated object references from internal MSP transport JSON.
 */
export function deserialiseCircularJson<T>(value: T): T {
  return parse(JSON.stringify(value)) as T;
}
