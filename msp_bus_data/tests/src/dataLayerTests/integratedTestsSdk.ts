import { DataObjectMetaData, View, ViewElement } from 'msp_common';
import got from 'got'
import deepClone from 'safe-clone-deep';
import { v7 as uuid } from 'uuid';

const BASE = 'http://localhost:5000/v1/doc';

export async function WriteData(view: View, data: any, transactionToken?: string) {
  annotateSharedReferencesWithTmpIds(data);
  populateBusinessKeysInViewData(view, data);
  const bkey = data?.__businessKey
  const id = data?.__entityId ?? '__noid__'
  const safeData = deepClone(data, { circular: true }); // Clone the data to avoid mutating the original object
  const safeView = deepClone(view, { circular: true }); // Clone the view to avoid mutating the original object
  safeView.rootKey = '__entityId'; // Ensure the rootKey is set to __entityId for the write operation
  const insertResponse = await got.put(`${BASE}/upsert/${id}`, {
    json: {
      view: safeView,
      data: safeData
    },
    headers: transactionToken ? { 'X-Transaction-Token': transactionToken } : {},
    retry: { limit: 0 }, // Disable retries to get immediate feedback on failures
    responseType: 'json'
  });

  expect(insertResponse.statusCode).toBe(200);

  const result = insertResponse.body
  const ids = result.entity_ids;
  // will only have these where new entities were created
  if (ids) {
    const eid = ids.find((id: { key: string, id: string }) => id.key === bkey)?.id;

    if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
  }
  return result;
}

function annotateSharedReferencesWithTmpIds(root: any): void {
  const seen = new WeakMap<object, string>();
  const visiting = new WeakSet<object>();

  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    const objectNode = node as Record<string, any>;

    if (visiting.has(objectNode)) {
      return;
    }

    const priorTmpId = seen.get(objectNode);
    if (priorTmpId) {
      if (!objectNode.id) {
        objectNode.__tmpId = priorTmpId;
      }
      return;
    }

    let stableTmpId = typeof objectNode.__tmpId === 'string' && objectNode.__tmpId.length > 0
      ? objectNode.__tmpId
      : '';

    if (!objectNode.id && !stableTmpId) {
      // Keep tmp ids UUID-shaped (36 chars) to match DB constraints on id-like fields.
      stableTmpId = `${uuid()}`;
      objectNode.__tmpId = stableTmpId;
    }

    seen.set(objectNode, stableTmpId);
    visiting.add(objectNode);

    for (const value of Object.values(objectNode)) {
      walk(value);
    }

    visiting.delete(objectNode);
  };

  walk(root);
}

export async function ReadData(view: View, id: string, useBusKey: boolean = false, transactionToken?: string) {
  const url = transactionToken
    ? `${BASE}/query/${id}?read-uncommitted=true`
    : `${BASE}/query/${id}`;
  const safeView = deepClone(view, { circular: true }); // Clone the view to avoid mutating the original object

  if (useBusKey) {
    safeView.rootKey = '__businessKey';
  } else {
    safeView.rootKey = '__entityId';
  }

  const readResponse = await got.put(url,
    {
      json: safeView,
      headers: transactionToken ? { 'X-Transaction-Token': transactionToken } : {},
      responseType: 'json',
      retry: { limit: 0 }
    }
  )

  expect(readResponse.statusCode).toBe(200);
  return readResponse.body;
}

export async function BeginTransaction(): Promise<{ token: string; transactionId: string }> {
  const response = await got.post(`${BASE}/transaction/begin`, {
    responseType: 'json',
    retry: { limit: 0 }
  });
  expect(response.statusCode).toBe(200);
  return response.body as { token: string; transactionId: string };
}

export async function CommitTransaction(token: string): Promise<void> {
  const response = await got.post(`${BASE}/transaction/commit`, {
    json: { token },
    responseType: 'json',
    retry: { limit: 0 }
  });
  expect(response.statusCode).toBe(200);
}

export async function RollbackTransaction(token: string): Promise<void> {
  const response = await got.post(`${BASE}/transaction/rollback`, {
    json: { token },
    responseType: 'json',
    retry: { limit: 0 }
  });
  expect(response.statusCode).toBe(200);
}

function getBusinessKeyFromData(data: any, rootKey: string | string[] | ((data: any) => string)): string | null {
  if (typeof rootKey === 'string') {
    return data?.[rootKey];
  } else if (Array.isArray(rootKey)) {
    const key = rootKey.map(k => data?.[k]?.toString()).filter(s => s).join('|');
    return key;
  } else if (typeof rootKey === 'function') {
    return rootKey(data);
  }

  return null
}

type AnyDataObject = { [key: string]: any } & DataObjectMetaData;

function populateBusinessKeysInViewData(view: View, data: any): void {
  const rootElement = view.rootElement;
  if (!rootElement) {
    throw new Error('View has no root element defined.');
  }
  return recursePopulateBusinessKeysInViewElementData(rootElement, data as AnyDataObject);
}

function recursePopulateBusinessKeysInViewElementData(viewElement: ViewElement, data: AnyDataObject): void {
  if (!viewElement) {
    return
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


