import { DataRequestEnvelope, DataRequestResult,
	 DataViewUpsertEnvelope, DataViewQueryEnvelope, View } from 'msp_common';
import { authenticatedPut } from 'msp_svr_common';
import { getConfig } from 'msp_svr_common';

export type DataRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
};

const defaultEndpointPath = '/api/v1/data/';

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
	const id = data?.__entityId ?? '__noid__'
	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const routeUrl = resolveUrl(baseUrl, options?.endpointPath ?? defaultEndpointPath);

	const url = resolveUrl(routeUrl, `/view/write/${id}`);

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
		const insertResponse = await authenticatedPut(
			url,
			body,
			{ headers: { ...options?.headers }}
		);

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
			const eid = ids.find((id: { key: string, id: string }) => id.key === data?.[view.rootKey])?.id;

			if (eid) result.entityId = eid; // Attach the resolved entity ID to the result for downstream use
		}
		return result;
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
}

export async function ReadData(view: View, id: string, options?: DataRequestOptions) {
	
	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const routeUrl = resolveUrl(baseUrl, options?.endpointPath ?? defaultEndpointPath);

	const url = resolveUrl(routeUrl, `/view/read/${id}`);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	const body: DataViewQueryEnvelope = {
		payload: {
			view,
			id,
		},
	};

	try {
		const creds = getConfig().clientCredentials;
		if (!creds) throw new Error('Client credentials are required for authenticated requests');
		const queryResponse = await authenticatedPut(
			url,
			body,
			{ headers: { ...options?.headers }}
		);
			
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
		const response = await authenticatedPut(url, request)


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
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
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




