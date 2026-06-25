import { DataObjectMetaData, View, ViewElement } from 'msp_common';

export async function WriteData(view: View, data: any) {
  try {
    populateBusinessKeysInViewData(view, data);
    const id = data?.__entityId ?? '__noid__';
    const insertResponse = await fetch(`http://localhost:5000/v1/doc/upsert/${id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        view,
        data,
      }),
    });

    if (!insertResponse.ok) {
      throw new Error(`WriteData request failed with status ${insertResponse.status}`);
    }

    const result: any = await insertResponse.json();
    const ids = result.entity_ids;

    if (ids) {
      const eid = ids.find((entry: { key: string; id: string }) => entry.key === getBusinessKeyFromData(data, view.rootKey))?.id;

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