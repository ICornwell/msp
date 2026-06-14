export type ServiceActivityResult = {
    activityName: string;
    namespace: string;
    version: string;
		variantName: string;
    updatedPayload?: any;
    success: boolean;
    message?: string;
    error?: any;
    logs?: string[];
    result?: any;
}

export type RequestEnvelope<TPayload = any> = {
		payload: TPayload;
	context?: string;
	correlationId?: string;
	includeIdClaim?: boolean;
}

export type ServiceRequestEnvelope<TPayload = any> = RequestEnvelope<TPayload> & {
	namespace: string;
	activityName: string;
	version: string;
	variantName?: string;
};

export type ServiceRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
	includeIdClaim?: boolean;
};

export type ServiceRequestResult<TResult = any> = ServiceActivityResult & {
	result?: TResult;
};



