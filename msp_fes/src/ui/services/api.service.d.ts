import { PublicClientApplication } from '@azure/msal-browser';
interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    tokenType?: 'bearer' | 'basic';
    requiresAuth?: boolean;
}
interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}
/**
 * API Service that uses a Web Worker to add authentication tokens
 * to all outbound API calls.
 */
declare class ApiService {
    private worker;
    private msalInstance;
    private pendingRequests;
    constructor();
    /**
     * Initialize the API service with an MSAL instance
     */
    init(msalInstance: PublicClientApplication): void;
    /**
     * Handle messages received from the worker
     */
    private handleWorkerMessage;
    /**
     * Refresh the authentication token and send it to the worker
     */
    private refreshAuthToken;
    /**
     * Make an API request through the worker
     */
    request<T = any>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
    /**
     * Abort an in-progress request
     */
    abortRequest(requestId: string): void;
    /**
     * Helper method for GET requests
     */
    get<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>>;
    /**
     * Helper method for POST requests
     */
    post<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
    /**
     * Helper method for PUT requests
     */
    put<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
    /**
     * Helper method for DELETE requests
     */
    delete<T = any>(url: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>>;
    /**
     * Helper method for PATCH requests
     */
    patch<T = any>(url: string, data?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
}
declare const apiService: ApiService;
export default apiService;
