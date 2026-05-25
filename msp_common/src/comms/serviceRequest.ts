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



