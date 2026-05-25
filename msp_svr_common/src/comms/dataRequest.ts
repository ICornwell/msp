import { View } from 'msp_common';
import { authenticatedPut } from '../als/outboundRequests.js';
import { getConfig } from '../configuredCommon.js';

export type DataRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
};

const defaultEndpointPath = '/v1/doc/';

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

	const configured = getConfig().serviceHubApiUrl;
	if (configured && configured.trim().length > 0) {
		return trimTrailingSlash(configured);
	}

	throw new Error('No service request base URL configured. Set Config.serviceHubApiUrl or pass options.baseUrl.');
}

function resolveUrl(baseUrl: string, endpointPath: string): string {
	return `${trimTrailingSlash(baseUrl)}/${trimLeadingSlash(endpointPath)}`;
}




export async function WriteData(view: View, data: any, options?: DataRequestOptions) {
	const id = data?.__entityId ?? '__noid__'
	const baseUrl = resolveBaseUrl(options?.baseUrl);
	const routeUrl = resolveUrl(baseUrl, options?.endpointPath ?? defaultEndpointPath);

	const url = resolveUrl(routeUrl, `/upsert/${id}`);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	const body = {
		view,
		data,
	};
  

	try {
		const creds = getConfig().clientCredentials;
		if (!creds) throw new Error('Client credentials are required for authenticated requests');
		const insertResponse = await authenticatedPut(
			url,
			body,
			{ headers: { ...options?.headers }}
		);

		expect(insertResponse.status).toBe(200);

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

	const url = resolveUrl(routeUrl, `/query/${id}`);

	const controller = new AbortController();
	const timeoutMs = options?.timeoutMs;
	const timeoutHandle = (timeoutMs && timeoutMs > 0)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;

	try {
		const creds = getConfig().clientCredentials;
		if (!creds) throw new Error('Client credentials are required for authenticated requests');
		const queryResponse = await authenticatedPut(
			url,
			view,
			{ headers: { ...options?.headers }}
		);
			
		expect(queryResponse.status).toBe(200);

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


