import type { View, ViewElement } from 'msp_common';

export const ISR_REFERENCE_KEY = '__mspReference';

type IsrIdentity = {
  object: string;
  id?: string;
  tmpId?: string;
  entityId?: string;
  businessKey?: string;
};

type IsrReferenceStub = {
  [ISR_REFERENCE_KEY]: IsrIdentity;
};

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identityFor(element: ViewElement, data: Record<string, any>): IsrIdentity | undefined {
  const object = element.domainObject?.name ?? element.object;
  const entityId = data.__entityId as string | undefined;
  const id = data.id as string | undefined;
  const tmpId = data.__tmpId as string | undefined;
  const businessKey = data.__businessKey as string | undefined;

  if (element.isEntity && entityId) return { object, ...(id ? { id } : {}), entityId };
  if (!element.isEntity && id) return { object, id, ...(entityId ? { entityId } : {}) };
  if (tmpId) return { object, tmpId, ...(entityId ? { entityId } : {}) };
  if (businessKey) return { object, businessKey, ...(entityId ? { entityId } : {}) };
  return undefined;
}

function cloneUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cloneUnknown);
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cloneUnknown(child)]));
  }
  return value;
}

function prepareElement(
  element: ViewElement,
  value: unknown,
  identities: WeakMap<object, IsrIdentity>,
  active: WeakSet<object>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => prepareElement(element, item, identities, active));
  }
  if (!isObject(value)) return value;

  const existingIdentity = identities.get(value);
  if (existingIdentity) {
    return { [ISR_REFERENCE_KEY]: { ...existingIdentity } } satisfies IsrReferenceStub;
  }

  const identity = identityFor(element, value);
  if (active.has(value) && !identity) {
    throw new Error(`Cannot encode cyclic ISR data for '${element.object}' without an identity.`);
  }
  if (identity) identities.set(value, identity);
  active.add(value);

  const childPaths = new Set((element.subElements ?? []).map((child) => child.docPathName ?? child.domainObjectId.name));
  const prepared: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (!childPaths.has(key)) prepared[key] = cloneUnknown(child);
  }

  for (const childElement of element.subElements ?? []) {
    const childPath = childElement.docPathName ?? childElement.domainObjectId.name;
    if (value[childPath] !== undefined) {
      prepared[childPath] = prepareElement(childElement, value[childPath], identities, active);
    }
  }

  active.delete(value);
  return prepared;
}

export function prepareIsrData<T>(view: View, data: T): T {
  return prepareElement(view.rootElement, data, new WeakMap<object, IsrIdentity>(), new WeakSet<object>()) as T;
}
