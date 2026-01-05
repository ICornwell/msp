// File: src/services/api.service.ts
/**
 * API Service that uses a Web Worker to add authentication tokens
 * to all outbound API calls.
 */
class ApiService {
    worker;
    msalInstance = null;
    pendingRequests = new Map();
    constructor() {
        // Create the web worker
        this.worker = new Worker(new URL('../workers/api-interceptor.worker.ts', import.meta.url), {
            type: 'module'
        });
        // Set up message handler
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
    }
    /**
     * Initialize the API service with an MSAL instance
     */
    init(msalInstance) {
        this.msalInstance = msalInstance;
        // Get initial token and send to worker
        this.refreshAuthToken();
    }
    /**
     * Handle messages received from the worker
     */
    handleWorkerMessage(event) {
        const response = event.data;
        switch (response.type) {
            case 'response':
                // Resolve the pending promise for this request
                const pendingRequest = this.pendingRequests.get(response.id);
                if (pendingRequest) {
                    pendingRequest.resolve({
                        data: response.body,
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                    this.pendingRequests.delete(response.id);
                }
                break;
            case 'error':
                // Reject the pending promise for this request
                const pendingErrorRequest = this.pendingRequests.get(response.id);
                if (pendingErrorRequest) {
                    pendingErrorRequest.reject(new Error(response.error));
                    this.pendingRequests.delete(response.id);
                }
                break;
            case 'refreshToken':
                // Worker is asking for a new token
                this.refreshAuthToken(response.originalRequestId);
                break;
        }
    }
    /**
     * Refresh the authentication token and send it to the worker
     */
    async refreshAuthToken(originalRequestId) {
        if (!this.msalInstance) {
            console.warn('MSAL instance not initialized');
            return;
        }
        try {
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length === 0) {
                console.warn('No accounts found in MSAL');
                return;
            }
            // Get token silently
            const tokenRequest = {
                scopes: ['user.read'], // Adjust scopes as needed for your API
                account: accounts[0]
            };
            const tokenResponse = await this.msalInstance.acquireTokenSilent(tokenRequest);
            // Send new token to worker
            const requestId = crypto.randomUUID();
            this.worker.postMessage({
                id: requestId,
                type: 'refreshToken',
                token: tokenResponse.accessToken,
                originalRequestId
            });
        }
        catch (error) {
            console.error('Failed to refresh token:', error);
            // If silent token acquisition fails, might need to show login UI
            // This depends on your authentication flow
        }
    }
    /**
     * Make an API request through the worker
     */
    async request(url, options = {}) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            // Store the promise callbacks
            this.pendingRequests.set(requestId, { resolve, reject });
            // Prepare request headers
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            // Send request to worker
            this.worker.postMessage({
                id: requestId,
                type: 'fetch',
                url,
                method: options.method || 'GET',
                headers,
                body: options.body,
                tokenType: options.tokenType || 'bearer'
            });
        });
    }
    /**
     * Abort an in-progress request
     */
    abortRequest(requestId) {
        this.worker.postMessage({
            id: requestId,
            type: 'abort'
        });
        // Clean up the pending request
        this.pendingRequests.delete(requestId);
    }
    /**
     * Helper method for GET requests
     */
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }
    /**
     * Helper method for POST requests
     */
    async post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', body: data });
    }
    /**
     * Helper method for PUT requests
     */
    async put(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PUT', body: data });
    }
    /**
     * Helper method for DELETE requests
     */
    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }
    /**
     * Helper method for PATCH requests
     */
    async patch(url, data, options = {}) {
        return this.request(url, { ...options, method: 'PATCH', body: data });
    }
}
// Create a singleton instance
const apiService = new ApiService();
export default apiService;
//# sourceMappingURL=api.service.js.map