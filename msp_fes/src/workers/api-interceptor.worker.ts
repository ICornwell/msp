/**
 * Web Worker for intercepting API calls and adding authentication tokens
 * 
 * This worker acts as a proxy for all API requests, adding authentication
 * tokens and handling common authentication scenarios like token refresh.
 */

// Define message types for communication with the main thread
interface WorkerRequest {
  id: string;
  type: 'fetch' | 'abort' | 'getToken' | 'refreshToken';
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
  tokenType?: 'bearer' | 'basic';
  token?: string;
}

interface WorkerResponse {
  id: string;
  type: 'response' | 'error' | 'tokenUpdated';
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
  token?: string;
}

// Token storage
let authToken: string | null = null;
let tokenExpiry: number | null = null;
const pendingRequests: Map<string, AbortController> = new Map();

// Listen for messages from the main thread
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  
  try {
    switch (request.type) {
      case 'fetch':
        await handleFetchRequest(request);
        break;
      case 'abort':
        handleAbortRequest(request);
        break;
      case 'getToken':
        handleGetToken(request);
        break;
      case 'refreshToken':
        await handleRefreshToken(request);
        break;
    }
  } catch (error) {
    const errorResponse: WorkerResponse = {
      id: request.id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorResponse);
  }
});

/**
 * Handle a fetch request by adding authentication and making the API call
 */
async function handleFetchRequest(request: WorkerRequest): Promise<void> {
  if (!request.url) {
    throw new Error('URL is required for fetch requests');
  }

  // Create an AbortController for this request
  const controller = new AbortController();
  pendingRequests.set(request.id, controller);

  try {
    // Check if token is expired and needs refresh
    if (authToken && tokenExpiry && Date.now() >= tokenExpiry) {
      // Request token refresh from main thread
      self.postMessage({
        id: crypto.randomUUID(),
        type: 'refreshToken',
        originalRequestId: request.id
      });
      
      // Wait for token to be refreshed
      // In a real implementation, you might want to queue the request instead
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Add authentication headers if token exists
    const headers = request.headers ? { ...request.headers } : {};
    if (authToken) {
      if (request.tokenType === 'basic') {
        headers['Authorization'] = `Basic ${authToken}`;
      } else {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
    }

    // Make the fetch request
    const response = await fetch(request.url, {
      method: request.method || 'GET',
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
      signal: controller.signal
    });

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Read response body based on content type
    let responseBody;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseBody = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      responseBody = await response.text();
    } else {
      // For binary data, use arrayBuffer
      const buffer = await response.arrayBuffer();
      responseBody = buffer;
    }

    // Handle 401 Unauthorized responses (token expired or invalid)
    if (response.status === 401) {
      // Request token refresh from main thread
      self.postMessage({
        id: crypto.randomUUID(),
        type: 'refreshToken',
        originalRequestId: request.id
      });
      return;
    }

    // Send response back to main thread
    const workerResponse: WorkerResponse = {
      id: request.id,
      type: 'response',
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody
    };
    self.postMessage(workerResponse);
  } catch (error) {
    const errorResponse: WorkerResponse = {
      id: request.id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    self.postMessage(errorResponse);
  } finally {
    pendingRequests.delete(request.id);
  }
}

/**
 * Handle request to abort an in-progress fetch
 */
function handleAbortRequest(request: WorkerRequest): void {
  const controller = pendingRequests.get(request.id);
  if (controller) {
    controller.abort();
    pendingRequests.delete(request.id);
  }
}

/**
 * Handle request to get the current token
 */
function handleGetToken(request: WorkerRequest): void {
  const response: WorkerResponse = {
    id: request.id,
    type: 'response',
    token: authToken || undefined
  };
  self.postMessage(response);
}

/**
 * Handle token update from the main thread
 */
function handleRefreshToken(request: WorkerRequest): void {
  if (request.token) {
    authToken = request.token;
    tokenExpiry = Date.now() + 3600000; // 1 hour expiry by default
    
    // Notify main thread that token was updated
    const response: WorkerResponse = {
      id: request.id,
      type: 'tokenUpdated',
      token: authToken
    };
    self.postMessage(response);
  }
}

// Export empty object to make TypeScript happy
export {};