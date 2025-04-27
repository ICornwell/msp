// File: src/services/api.service.ts

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
class ApiService {
  private worker: Worker;
  private msalInstance: PublicClientApplication | null = null;
  private pendingRequests: Map<string, { 
    resolve: (value: ApiResponse) => void, 
    reject: (reason: any) => void 
  }> = new Map();
  
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
  public init(msalInstance: PublicClientApplication): void {
    this.msalInstance = msalInstance;
    
    // Get initial token and send to worker
    this.refreshAuthToken();
  }
  
  /**
   * Handle messages received from the worker
   */
  private handleWorkerMessage(event: MessageEvent): void {
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
  private async refreshAuthToken(originalRequestId?: string): Promise<void> {
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
    } catch (error) {
      console.error('Failed to refresh token:', error);
      
      // If silent token acquisition fails, might need to show login UI
      // This depends on your authentication flow
    }
  }
  
  /**
   * Make an API request through the worker
   */
  public async request<T = any>(url: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
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
  public abortRequest(requestId: string): void {
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
  public async get<T = any>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }
  
  /**
   * Helper method for POST requests
   */
  public async post<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body: data });
  }
  
  /**
   * Helper method for PUT requests
   */
  public async put<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body: data });
  }
  
  /**
   * Helper method for DELETE requests
   */
  public async delete<T = any>(url: string, options: Omit<ApiRequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
  
  /**
   * Helper method for PATCH requests
   */
  public async patch<T = any>(url: string, data?: any, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body: data });
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;