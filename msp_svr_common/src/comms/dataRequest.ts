import {
	DataRequestEnvelope, DataRequestResult,
	DataViewUpsertEnvelope, DataViewQueryEnvelope, View,
	ViewElement, DataObjectMetaData
} from 'msp_common';
import { authenticatedPut } from 'msp_svr_common';
import { getConfig } from 'msp_svr_common';
import deepClone from 'safe-clone-deep';


export type DataRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	useBusinessKey?: boolean;
	headers?: Record<string, string>;
};

const defaultEndpointPath = '/api/v1/data/';
const viewEndpointPath = '/api/v1/view/'

function trimTrailingSlash(value: string): string {
	return value.endsWith('/') ? value.slice(0, -1) : value;
}

function trimLeadingSlash(value: string): string {
	return value.startsWith('/') ? value.slice(1) : value;
}

function resolveBaseUrl(explicitBaseUrl?: string): string {
	if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
		return trimTrailingSlash(explicitBaseUrl);
	}

	const configured = getConfig().dataHubApiUrl;
	if (configured && configured.trim().length > 0) {
		return trimTrailingSlash(configured);
	}

	throw new Error('No service request base URL configured. Set Config.dataHubApiUrl or pass options.baseUrl.');
}

function resolveUrl(baseUrl: string, endpointPath: string): string {
	return `${trimTrailingSlash(baseUrl)}/${trimLeadingSlash(endpointPath)}`;
}

export async function WriteData(view: View, data: any, options?: DataRequestOptions) {
	populateBusinessKeysInViewData(view, data);

	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const routeUrl = resolveUrl(baseUrl, options?.endpointPath ?? viewEndpointPath);

	const url = resolveUrl(routeUrl, `/write`);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	const body: DataViewUpsertEnvelope = {
		payload: {
			view,
			data,
		},
	};


	try {
		const creds = getConfig().clientCredentials;
		if (!creds) throw new Error('Client credentials are required for authenticated requests');
		let insertResponse = {} as Response;
		try {
			insertResponse = await authenticatedPut(
				url,
				body,
				{ headers: { ...options?.headers } }
			);
		} catch (error) {
			console.error(`Error making authenticated request for WriteData to ${url}:`, error);
			throw new Error(`Outbound request failed: ${error}`);
		}

		if (insertResponse.status !== 200) {
			throw new Error(`Data request failed (${insertResponse.status}): ${insertResponse.statusText}`);
		}

		let result: any = undefined;
		try {
			result = await insertResponse.json();
		} catch {
			result = undefined;
		}
		const ids = result?.entity_ids;
		// will only have these where new entities were created
		if (ids) {
			const eid = ids.find((id: { key: string, id: string }) => id.key === getBusinessKeyFromData(data, view.rootKey))?.id;

			if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
		}
		return result;
	} catch (error: any) {
		if (error.name === 'AbortError') {
			throw new Error(`Data request timed out after ${timeoutMs} ms`);
		}
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
}

export async function ReadData(view: View, id: string, options?: DataRequestOptions) {

	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const routeUrl = resolveUrl(baseUrl, options?.endpointPath ?? viewEndpointPath);

	const url = resolveUrl(routeUrl, `/read`);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	const safeView = deepClone(view, {circular: true});
	if (options?.useBusinessKey) {
		safeView.rootKey = "__businessKey";
	} else {
		safeView.rootKey = "__entityId";
	}

	const body: DataViewQueryEnvelope = {
		payload: {
			view: safeView,
			id,
		},
	};

	try {
		const creds = getConfig().clientCredentials;
		if (!creds) throw new Error('Client credentials are required for authenticated requests');
		let queryResponse = {} as Response;
		try {
			queryResponse = await authenticatedPut(
				url,
				body,
				{ headers: { ...options?.headers } }
			);
		} catch (error) {
			console.error(`Error making authenticated request for ReadData to ${url}:`, error);
			throw new Error(`Outbound request failed: ${error}`);
		}

		if (queryResponse.status !== 200) {
			throw new Error(`Data request failed (${queryResponse.status}): ${queryResponse.statusText}`);
		}

		let result: any = undefined;
		try {
			result = await queryResponse.json();
		} catch {
			result = undefined;
		}

		return result;
	} catch (error: any) {
		if (error.name === 'AbortError') {
			throw new Error(`Data request timed out after ${timeoutMs} ms`);
		}

	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}

}

export type DataRequestResultBuilder = {
	updatePayload: (payload: any) => DataRequestResultBuilder;
	updateResult: (result: any) => DataRequestResultBuilder;
	success: (result?: any) => DataRequestResultBuilder;
	failed: (message?: string, error?: any) => DataRequestResultBuilder;
	log: (message: string) => DataRequestResultBuilder;
	currentResult: () => any;
}

export async function DataRequest<TPayload = any, TResult = any>(
	request: DataRequestEnvelope<TPayload>,
	options?: DataRequestOptions,
): Promise<DataRequestResult<TResult>> {
	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const url = resolveUrl(baseUrl, options?.endpointPath ?? defaultEndpointPath);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	const config = getConfig();

	if (!config.clientCredentials) {
		throw new Error('Client credentials are required for service requests. Please configure ClientCredentialsConfig in your Config.');
	}

	try {
		let response = {} as Response;
		try {
			response = await authenticatedPut(url, request, { headers: { ...options?.headers } });
		} catch (error) {
			console.error(`Error making authenticated request ${request.namespace}.${request.activityName}.${request.version}.${request.variantName} for ${url}:`, error);
			throw new Error(`Outbound request failed: ${error}`);
		}
		
		let body: any = undefined;
		try {
			body = await response.json();
		} catch {
			body = undefined;
		}

		if (!response.ok) {
			throw new Error(`Data request failed (${response.status}): ${response.statusText}`);
		}

		return body as DataRequestResult<TResult>;
	} catch (error: any) {
		if (error.name === 'AbortError') {
			throw new Error(`Data request timed out after ${timeoutMs} ms`);
		}

	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
	return { result: undefined, success: false, message: 'unknown error' } as DataRequestResult<TResult>;
}

export async function runDataActivity<TPayload = any, TResult = any>(
	namespace: string,
	activityName: string,
	version: string,
	variantName: string,
	payload: TPayload,
	options?: DataRequestOptions,
): Promise<DataRequestResult<TResult>> {
	return DataRequest<TPayload, TResult>({
		namespace,
		activityName,
		version,
		variantName,
		payload,
	}, options);
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




