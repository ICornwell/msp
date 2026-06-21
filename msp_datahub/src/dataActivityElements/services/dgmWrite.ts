import got from 'got';
import { DataObjectMetaData, View, ViewElement } from "msp_common";

export async function WriteData(view: View, data: any) {
  try {
    populateBusinessKeysInViewData(view, data);
    const id = data?.__entityId ?? '__noid__'
    const insertResponse = await got.put(`http://localhost:5000/v1/doc/upsert/${id}`, {
      json: {
        view: view,
        data: data
      },
      retry: { limit: 0 }, // Disable retries to get immediate feedback on failures
      responseType: 'json'
    });

  
    const result: any = insertResponse.body
    const ids = result.entity_ids;
    // will only have these where new entities were created
    if (ids) {
      const eid = ids.find((id: { key: string, id: string }) => id.key === getBusinessKeyFromData(data, view.rootKey))?.id;

      if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
    }
    return result;
  } catch (error) {
    console.error('Error writing data:', error);
    throw error; // Re-throw the error after logging it
  }
}

// TODO: if we can fully infer the DomainObject type, we can use it's getBusinessKEy method
// and can avoid the duplication here. Leaving for now as not most critical item.
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