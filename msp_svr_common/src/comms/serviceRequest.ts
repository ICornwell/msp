import { getConfig } from '../configuredCommon.js';
import { authenticatedPut } from '../als/outboundRequests.js';
import type {ServiceRequestEnvelope, ServiceRequestOptions, ServiceRequestResult} from 'msp_common';

/* export type ServiceRequestEnvelope<TPayload = any> = {
	namespace: string;
	activityName: string;
	version: string;
	payload: TPayload;
	context?: string;
	correlationId?: string;
};

export type ServiceRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
};

export type ServiceRequestResult<TResult = any> = ServiceActivityResult & {
	result?: TResult;
}; */

const defaultEndpointPath = '/api/v1/service/run';

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

export async function serviceRequest<TPayload = any, TResult = any>(
	request: ServiceRequestEnvelope<TPayload>,
	options?: ServiceRequestOptions,
): Promise<ServiceRequestResult<TResult>> {
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
			throw new Error(`Service request failed (${response.status}): ${response.statusText}`);
		}

		return body as ServiceRequestResult<TResult>;
	} catch (error: any) {
		if (error.name === 'AbortError') {
			throw new Error(`Service request timed out after ${timeoutMs} ms`);
		}
		throw error;
	} finally {
		if (timeoutHandle) {
			clearTimeout(timeoutHandle);
		}
	}
}

export async function runServiceActivity<TPayload = any, TResult = any>(
	namespace: string,
	activityName: string,
	version: string,
	payload: TPayload,
	options?: ServiceRequestOptions,
): Promise<ServiceRequestResult<TResult>> {
	return serviceRequest<TPayload, TResult>({
		namespace,
		activityName,
		version,
		payload,
	}, options);
}

