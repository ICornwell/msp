# JWT Token Validation and AsyncLocalStorage Utilities

This module provides comprehensive JWT token validation, AsyncLocalStorage-based context management, and authenticated service-to-service communication utilities.

## Features

- ✅ JWT validation with OIDC discovery
- ✅ Trusted issuer verification
- ✅ Automatic JWKS key fetching and caching
- ✅ AsyncLocalStorage for request-scoped data
- ✅ Helper functions for claim retrieval
- ✅ Automatic access token acquisition (client credentials)
- ✅ Claim propagation via X-Context-Claim headers

## Installation

```bash
yarn add jose @types/node
```

## Usage

### 1. Validate ID Token (from UI)

```typescript
import {
  validateAndStoreIdToken,
  runWithContext,
  JWTValidationConfig
} from 'msp_common';

const config: JWTValidationConfig = {
  trustedIssuers: [
    'https://login.microsoftonline.com/{tenant-id}/v2.0',
    'https://accounts.google.com'
  ],
  audience: 'your-client-id',
  clockTolerance: 60, // seconds
};

// In Express middleware
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Create new context for this request
    await runWithContext(
      { requestId: req.id, timestamp: Date.now() },
      async () => {
        // Validate and store in ALS
        await validateAndStoreIdToken(token, config);
        
        // Continue processing within this context
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
```

### 2. Retrieve Claims from ALS

```typescript
import {
  getUserId,
  getUserName,
  getUserEmail,
  getUserRoles,
  hasRole,
  getIdTokenClaim
} from 'msp_common';

// In your route handler
app.get('/api/profile', (req, res) => {
  const userId = getUserId();
  const userName = getUserName();
  const email = getUserEmail();
  const roles = getUserRoles();
  
  res.json({ userId, userName, email, roles });
});

// Role-based authorization
app.post('/api/admin/action', (req, res) => {
  if (!hasRole('Admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Process admin action
});
```

### 3. Service-to-Service Communication

```typescript
import {
  makeAuthenticatedRequest,
  authenticatedGet,
  authenticatedPost,
  ClientCredentialsConfig
} from 'msp_common';

// Configure client credentials for target service
const serviceConfig: ClientCredentialsConfig = {
  clientId: 'your-service-client-id',
  clientSecret: process.env.CLIENT_SECRET!,
  tenantId: 'your-tenant-id',
  scope: 'api://target-service/.default',
};

// Make authenticated request with claim propagation
app.get('/api/data', async (req, res) => {
  try {
    // This automatically:
    // 1. Acquires access token using client credentials
    // 2. Adds Authorization: Bearer {token}
    // 3. Propagates all claims from ALS as X-Context-Claim-{name} headers
    const response = await authenticatedGet(
      serviceConfig,
      'https://other-service.com/api/data'
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Service call failed' });
  }
});

// POST with selective claim exclusion
app.post('/api/process', async (req, res) => {
  const response = await authenticatedPost(
    serviceConfig,
    'https://other-service.com/api/process',
    req.body,
    {
      // Exclude sensitive claims from propagation
      excludeClaims: ['email', 'phone_number'],
      // Or disable claim propagation entirely
      includeAllClaims: false,
    }
  );
  
  const result = await response.json();
  res.json(result);
});
```

### 4. Validate Access Tokens (Receiving Service)

```typescript
import {
  validateAndStoreAccessToken,
  runWithContext,
  getClientId,
  getTenantId
} from 'msp_common';

// Middleware for service-to-service authentication
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    await runWithContext(
      { requestId: req.id, timestamp: Date.now() },
      async () => {
        // Validate access token
        await validateAndStoreAccessToken(token, {
          trustedIssuers: [
            'https://login.microsoftonline.com/{tenant-id}/v2.0'
          ],
          audience: 'api://your-service',
        });
        
        // Extract propagated claims from headers
        const customClaims: Record<string, any> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (key.toLowerCase().startsWith('x-context-claim-')) {
            const claimName = key.substring(16); // Remove prefix
            customClaims[claimName] = value;
          }
        }
        
        // Store custom claims
        setRequestContext({ customClaims });
        
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Access propagated claims
app.get('/api/service-endpoint', (req, res) => {
  const clientId = getClientId();
  const tenantId = getTenantId();
  const originalUserId = getCustomClaim('sub'); // From propagated claim
  
  res.json({ clientId, tenantId, originalUserId });
});
```

## API Reference

### Context Management

- `runWithContext(context, fn)` - Execute function within a new ALS context
- `getRequestContext()` - Get current request context
- `setRequestContext(context)` - Update current context
- `clearContext()` - Clear current context

### JWT Validation

- `validateIdToken(token, config)` - Validate ID token
- `validateAccessToken(token, config)` - Validate access token
- `validateAndStoreIdToken(token, config)` - Validate and store in ALS
- `validateAndStoreAccessToken(token, config)` - Validate and store in ALS

### Claim Helpers

- `getUserId()` - Get user ID from ID token
- `getUserName()` - Get user name
- `getUserEmail()` - Get user email
- `getUserRoles()` - Get user roles array
- `hasRole(role)` - Check if user has role
- `hasAnyRole(roles)` - Check if user has any of the roles
- `hasAllRoles(roles)` - Check if user has all roles
- `getIdTokenClaim(name)` - Get specific ID token claim
- `getAccessTokenClaim(name)` - Get specific access token claim
- `getCustomClaim(name)` - Get custom claim
- `getAllClaims()` - Get all claims combined

### Outbound Requests

- `makeAuthenticatedRequest(config, options)` - Make authenticated HTTP request
- `authenticatedGet(config, url, options?)` - GET request
- `authenticatedPost(config, url, body?, options?)` - POST request
- `authenticatedPut(config, url, body?, options?)` - PUT request
- `authenticatedDelete(config, url, options?)` - DELETE request
- `authenticatedPatch(config, url, body?, options?)` - PATCH request

## Configuration

### Trusted Issuers

Configure your trusted token issuers:

```typescript
const config = {
  trustedIssuers: [
    'https://login.microsoftonline.com/{tenant-id}/v2.0',
    'https://sts.windows.net/{tenant-id}/', // Azure AD v1
    'https://accounts.google.com', // Google
  ],
};
```

### Environment Variables

```bash
# For outbound service calls
CLIENT_ID=your-service-client-id
CLIENT_SECRET=your-service-client-secret
TENANT_ID=your-azure-tenant-id
```

## Security Considerations

1. **Never log tokens** - Tokens contain sensitive information
2. **Use HTTPS** - Always use HTTPS in production
3. **Rotate secrets** - Regularly rotate client secrets
4. **Validate audiences** - Always specify expected audiences
5. **Exclude sensitive claims** - Use `excludeClaims` for sensitive data
6. **Clock tolerance** - Set reasonable clock tolerance (60s recommended)
7. **Token caching** - Tokens are cached with 1-minute buffer before expiry

## Testing

```typescript
import { clearJWKSCache, clearTokenCache } from 'msp_common';

// Clear caches between tests
afterEach(() => {
  clearJWKSCache();
  clearTokenCache();
});
```
