# JWT Token Validation and AsyncLocalStorage Utilities

This module provides comprehensive JWT token validation, AsyncLocalStorage-based context management, and authenticated service-to-service communication utilities.

## Features

- ✅ JWT validation with OIDC discovery
- ✅ Trusted issuer verification
- ✅ Automatic JWKS key fetching and caching
- ✅ AsyncLocalStorage for request-scoped data
- ✅ Helper functions for assertion claim retrieval
- ✅ Automatic access token acquisition (client credentials)
- ✅ Assertion propagation via msp-*-assertion headers

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
} from 'msp_svr_common';

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

### 2. Retrieve Assertion Claims from ALS

```typescript
import {
  getUltimateRequesterId,
  getUltimateRequesterName,
  getUltimateRequesterEmail,
  getUltimateRequesterRoles,
  hasRole,
  resolveStandardizedClaim
} from 'msp_svr_common';

// In your route handler
app.get('/api/profile', (req, res) => {
  const userId = getUltimateRequesterId();
  const userName = getUltimateRequesterName();
  const email = getUltimateRequesterEmail();
  const roles = getUltimateRequesterRoles();
  const resolved = resolveStandardizedClaim('ultimateRequesterId');
  
  res.json({ userId, userName, email, roles, resolvedBy: resolved?.strategyName });
});

// Role-based authorization
app.post('/api/admin/action', (req, res) => {
  if (!hasRole('Admin', { assertionType: 'id', issPattern: 'login.microsoftonline.com' })) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Process admin action
});
```

### 3. Service-to-Service Communication

```typescript
import {
  authenticatedGet,
  authenticatedPost
} from 'msp_svr_common';

// Make authenticated request with assertion propagation
app.get('/api/data', async (req, res) => {
  try {
    // This automatically:
    // 1. Acquires access token using client credentials
    // 2. Adds Authorization: Bearer {token}
    // 3. Propagates stored assertion headers (msp-*-assertion)
    const response = await authenticatedGet(
      'https://other-service.com/api/data'
    );
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Service call failed' });
  }
});

// POST with selective assertion exclusion
app.post('/api/process', async (req, res) => {
  const response = await authenticatedPost(
    'https://other-service.com/api/process',
    req.body,
    {
      // Exclude selected assertions from propagation
      excludeAssertions: ['msp-user-id-assertion'],
      // Or disable assertion propagation entirely
      includeAllAssertions: false,
    }
  );
  
  const result = await response.json();
  res.json(result);
});
```

### 4. Validate Access Tokens (Receiving Service)

```typescript
import {
  mspAuthMiddleware,
  getClientId,
  getTenantId,
  getCustomClaim
} from 'msp_svr_common';

const config = {
  jwtValidation: {
    trustedIssuers: [
      'https://login.microsoftonline.com/{tenant-id}/v2.0'
    ],
    audience: 'api://your-service',
  },
};

// Middleware for service-to-service authentication
app.use(mspAuthMiddleware(config));

// Access validated assertion claims
app.get('/api/service-endpoint', (req, res) => {
  const clientId = getClientId();
  const tenantId = getTenantId();
  const originalUserId = getCustomClaim('sub'); // From stored assertions
  
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

### Assertion Helpers

- `getUltimateRequesterId()` - Resolve requester ID via strategy priority
- `getUltimateRequesterName()` - Resolve requester display name via strategy priority
- `getUltimateRequesterEmail()` - Resolve requester email via strategy priority
- `getUltimateRequesterRoles()` - Resolve requester roles via strategy priority
- `resolveStandardizedClaim(field)` - Resolve any standardized field with provenance
- `setClaimResolverStrategies(strategies)` - Replace resolver strategies
- `registerClaimResolverStrategy(strategy)` - Add a resolver strategy plugin
- `resetClaimResolverStrategies()` - Reset to default resolver strategy set
- `getScopes(selector)` - Get scopes for matching assertion type and optional issuer/subject patterns
- `hasScopes(scopes, selector)` - Check required scopes against matching assertions
- `hasRole(role, selector)` - Check role against matching assertions
- `hasAnyRole(roles, selector)` - Check if any role is present for matching assertions
- `hasAllRoles(roles, selector)` - Check if all roles are present for matching assertions
- `getCustomClaim(name)` - Get claim by name across stored assertions

### Outbound Requests

- `makeAuthenticatedRequest(options)` - Make authenticated HTTP request
- `authenticatedGet(url, options?)` - GET request
- `authenticatedPost(url, body?, options?)` - POST request
- `authenticatedPut(url, body?, options?)` - PUT request
- `authenticatedDelete(url, options?)` - DELETE request
- `authenticatedPatch(url, body?, options?)` - PATCH request

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
5. **Exclude sensitive assertions** - Use `excludeAssertions` for selective propagation
6. **Clock tolerance** - Set reasonable clock tolerance (60s recommended)
7. **Token caching** - Tokens are cached with 1-minute buffer before expiry

## Testing

```typescript
import { clearJWKSCache, clearTokenCache } from 'msp_svr_common';

// Clear caches between tests
afterEach(() => {
  clearJWKSCache();
  clearTokenCache();
});
```
