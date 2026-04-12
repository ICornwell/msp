import { getConfig } from '../configuredCommon.js';

export type ServiceActivityResult = {
    activityName: string;
    namespace: string;
    version: string;
    updatedPayload?: any;
    success: boolean;
    message?: string;
    error?: any;
    logs?: string[];
    result?: any;
}

export type ServiceRequestEnvelope<TPayload = any> = {
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
};

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

	try {
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'content-type': 'application/json',
				...(options?.headers ?? {}),
			},
			body: JSON.stringify(request),
			signal: controller.signal,
		});

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

