import { View } from "../data/fluent";
import { ViewIdentifier } from "../types";
import { RequestEnvelope } from "./serviceRequest";

export type DataActivityResult = {
    activityName: string;
    namespace: string;
    version: string;
    updatedPayload?: any;
    success: boolean;
    message?: string;
    error?: any;
    logs?: string[];
    noCacheData?: boolean;
    result?: any;
}

export type DataRequestEnvelope<TPayload = any> = RequestEnvelope<TPayload> & {
	namespace: string;
	activityName: string;
	version: string;
	variantName?: string;
};

export type DataViewQueryEnvelope = RequestEnvelope<{view : View,  id: string}>;
	

export type DataViewUpsertEnvelope  = RequestEnvelope<{view: View, data: any}>

export type DataRequestOptions = {
	baseUrl?: string;
	endpointPath?: string;
	timeoutMs?: number;
	headers?: Record<string, string>;
    useBusinessKey?: boolean;
};

export type DataRequestResult<TResult = any> = DataActivityResult & {
	result?: TResult;
};

export type DataViewIdQueryEnvelope = RequestEnvelope<{viewId: ViewIdentifier, id: string}>
export type DataViewIdUpsertEnvelope = RequestEnvelope<{viewId: ViewIdentifier, data: any}>



