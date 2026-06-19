import { DataObjectMetaData, View, ViewElement } from 'msp_common';
import got from 'got'

const BASE = 'http://localhost:5000/v1/doc';

export async function WriteData(view: View, data: any, transactionToken?: string) {
    populateBusinessKeysInViewData(view, data);
    const id = data?.__entityId ?? '__noid__'
    const insertResponse = await got.put(`${BASE}/upsert/${id}`, {
      json: {
        view: view,
        data: data
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
      const eid = ids.find((id: { key: string, id: string }) => id.key === getBusinessKeyFromData(data, view.rootKey))?.id;

      if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
    }
    return result;
}

export async function ReadData(view: View, id: string, transactionToken?: string) {
    const url = transactionToken
      ? `${BASE}/query/${id}?read-uncommitted=true`
      : `${BASE}/query/${id}`;
    const readResponse = await got.put(url,
      {
        json: view,
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

function getBusinessKeyFromData(data: any, rootKey: string | string[] | ((data: any) => string)): string |null {
	if (typeof rootKey === 'string') {
		return data?.[rootKey];
	} else if (Array.isArray(rootKey)) {
		const key = rootKey.map(k => data?.[k]?.toString()).filter(s =>s).join('|');
		return key;
	} else if (typeof rootKey === 'function') {
		return rootKey(data);
	}

	return null
}

type AnyDataObject = { [key: string]: any } & DataObjectMetaData;

function populateBusinessKeysInViewData(view: View,data: any): void {
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
			if (!data.__metadata) {
				data.__metadata = {} as DataObjectMetaData['__metadata'];
			}
			data.__metadata.__businessKey = businessKey;
		}
	}	
	for (const subElement of viewElement.subElements ?? []) {
		const subData = data?.[subElement.docPathName ?? subElement.domainObjectId.name];
		if (subData) {
			recursePopulateBusinessKeysInViewElementData(subElement, subData as AnyDataObject);
		}
	}
}