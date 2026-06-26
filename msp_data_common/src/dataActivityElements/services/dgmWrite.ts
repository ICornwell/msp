import { DataObjectMetaData, View, ViewElement } from 'msp_common';

import { getRegisteredJsonCodec } from './jsonCodecs.js';

export async function WriteData(view: View, data: any) {
  try {
    const normalizedData = normalizeJsonFieldsForWrite(view, data);
    populateBusinessKeysInViewData(view, normalizedData);
    const id = view.rootKey === '__businessKey' ? normalizedData?.__businessKey ?? '__noid__' :  normalizedData?.__entityId ?? '__noid__';
    const insertResponse = await fetch(`http://localhost:5000/v1/doc/upsert/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        view,
        data: normalizedData,
      }),
    });

    if (!insertResponse.ok) {
      throw new Error(`WriteData request failed with status ${insertResponse.status}`);
    }

    const result: any = await insertResponse.json();
    const ids = result.entity_ids;

    if (ids) {
      const eid = ids.find((entry: { key: string; id: string }) => entry.key === getBusinessKeyFromData(normalizedData, view.rootKey))?.id;

      if (eid) {
        result.entityId = eid;
      }
    }

    return result;
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
}

function getBusinessKeyFromData(data: any, rootKey: string | string[] | ((data: any) => string)): string | null {
  if (typeof rootKey === 'string') {
    return data?.[rootKey];
  }
  if (Array.isArray(rootKey)) {
    const key = rootKey.map(k => data?.[k]?.toString()).filter(s => s).join('|');
    return key;
  }
  if (typeof rootKey === 'function') {
    return rootKey(data);
  }

  return null;
}

type AnyDataObject = { [key: string]: any } & DataObjectMetaData;

function safeJsonStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, currentValue) => {
    if (currentValue && typeof currentValue === 'object') {
      if (seen.has(currentValue as object)) {
        return '[Circular]';
      }
      seen.add(currentValue as object);
    }
    return currentValue;
  });
}

function normalizeJsonFieldsForWrite(view: View, data: any): any {
  const rootElement = view.rootElement;
  if (!rootElement) {
    return data;
  }

  return normalizeViewElementDataForWrite(rootElement, data, new WeakMap<object, any>());
}

function normalizeViewElementDataForWrite(viewElement: ViewElement, data: any, seen: WeakMap<object, any>): any {
  if (Array.isArray(data)) {
    return data.map(item => normalizeViewElementDataForWrite(viewElement, item, seen));
  }

  if (!data || typeof data !== 'object') {
    return data;
  }

  if (seen.has(data as object)) {
    return seen.get(data as object);
  }

  const normalized: AnyDataObject = { ...(data as AnyDataObject) };
  seen.set(data as object, normalized);

  const schemaProperties = viewElement.domainObject?.schema?.properties ?? {};
  for (const [propertyName, propertyDefinition] of Object.entries(schemaProperties) as Array<[string, any]>) {
    if (propertyDefinition?.infoType !== 'Json') {
      continue;
    }

    if (!(propertyName in normalized)) {
      continue;
    }

    const value = normalized[propertyName];
    if (typeof value === 'string' || value === undefined || value === null) {
      continue;
    }

    const codecKey = typeof propertyDefinition?.jsonCodecKey === 'string'
      ? propertyDefinition.jsonCodecKey.trim()
      : '';

    if (codecKey) {
      const codec = getRegisteredJsonCodec(codecKey);
      if (!codec) {
        throw new Error(`No JSON codec is registered for key '${codecKey}' (property '${propertyName}').`);
      }
      normalized[propertyName] = codec.serialize(value);
      continue;
    }

    normalized[propertyName] = safeJsonStringify(value);
  }

  for (const subElement of viewElement.subElements ?? []) {
    const subDataKey = subElement.docPathName ?? subElement.domainObjectId.name;
    const subData = normalized[subDataKey];
    if (subData !== undefined) {
      normalized[subDataKey] = normalizeViewElementDataForWrite(subElement, subData, seen);
    }
  }

  return normalized;
}

function populateBusinessKeysInViewData(view: View, data: any): void {
  const rootElement = view.rootElement;
  if (!rootElement) {
    throw new Error('View has no root element defined.');
  }

  return recursePopulateBusinessKeysInViewElementData(rootElement, data as AnyDataObject);
}

function recursePopulateBusinessKeysInViewElementData(viewElement: ViewElement, data: AnyDataObject): void {
  if (!viewElement) {
    return;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      recursePopulateBusinessKeysInViewElementData(viewElement, item as AnyDataObject);
    }
    return;
  }

  if (viewElement.domainObject?.isEntity && viewElement.domainObject.businessKey) {
    const businessKey = getBusinessKeyFromData(data, viewElement.domainObject.businessKey);
    if (businessKey) {
      data.__businessKey = businessKey;
    }
  }

  for (const subElement of viewElement.subElements ?? []) {
    const subData = data?.[subElement.docPathName ?? subElement.domainObjectId.name];
    if (subData) {
      recursePopulateBusinessKeysInViewElementData(subElement, subData as AnyDataObject);
    }
  }
}