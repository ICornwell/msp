import { View } from "../data/fluent";

export type DataActivityResult = {
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

export type DataRequestEnvelope<TPayload = any> = {
	namespace: string;
	activityName: string;
	version: string;
	payload: TPayload;
	context?: string;
	correlationId?: string;
};

export type DataViewQueryEnvelope = {
	payload: {view : View,  id: string};
	context?: string;
	correlationId?: string;
};

export type DataViewUpsertEnvelope = {
	payload: {view : View, data: any};
	context?: string;
	correlationId?: string;
};

export type DataRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
};

export type DataRequestResult<TResult = any> = DataActivityResult & {
	result?: TResult;
};



