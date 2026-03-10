# Quick Start Guide

## Current Status ✓

✅ **End-to-end flow implemented**
✅ **Message contracts defined** (msp_common/src/messages/)
✅ **Service activities created** (GetUserProfileData in actorwork)
✅ **ServiceHub routing with ActivitySet** (version matching + name matching)
✅ **Service dispatcher implemented** (handles ServiceCallRequest events)
✅ **Behaviour system with fluent DSL**
✅ **Data cache with in-flight request tracking**

## Minor Type Issues (Non-blocking)

The `msp_common` tsconfig needs `"types": ["node"]` in compilerOptions, but this doesn't affect runtime - the code will work fine because:
- Node.js provides these modules at runtime
- These are only TypeScript type checking issues
- The actual services will run without problems

## Starting the System

### 1. Start ServiceHub
```bash
cd /home/ian/js/msp/msp_servicehub
yarn start:server
# Should run on port 4001
```

### 2. Start Actorwork (with API server)
```bash
cd /home/ian/js/msp/msp_actorwork
# First, build the API server:
yarn build:server
# Then start both API and UI:
yarn start
# API on port 3001, UI on port 5173 (or similar)
# NOTE: Actorwork now automatically registers with ServiceHub on startup!
# Will retry every 5 seconds if ServiceHub is unavailable.
```

### 3. Start FES
```bash
cd /home/ian/js/msp/msp_fes
# Start the UI dev server:
yarn dev
# Should run on port 3000
```

## Testing the Flow

### Step 1: Verify Actorwork Registration

Check logs - actorwork should show successful registration:
```
✓ Successfully registered activity: actorwork/GetUserProfileData@1.0.0
✓ Actorwork successfully registered with servicehub
```

If ServiceHub wasn't running when actorwork started, you'll see retry attempts:
```
✗ Error registering manifest: ECONNREFUSED
Retrying manifest registration in 5 seconds...
```

### Step 2: Test the Activity

Test the full flow through servicehub:

```bash
curl -X PUT http://localhost:4001/api/v1/service/run \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "actorwork",
    "activityName": "GetUserProfileData",
    "version": "1.0.0",
    "payload": {
      "userId": "user-123"
    }
  }'
```

Expected response:
```json
{
  "namespace": "actorwork",
  "activityName": "GetUserProfileData",
  "version": "1.0.0",
  "success": true,
  "result": {
    "userId": "user-123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "userName": "johndoe"
  },
  "logs": [
    "Successfully retrieved user profile for: user-123",
    "Proxying to actorwork at http://localhost:3001"
  ]
}
```

### Step 3: Trigger from UI

In your FES app, add the ServiceDispatcher and publish a UserChanged event:

```typescript
import { UiEventProvider, ServiceDispatcher, createUserChangedEvent, useUiEventContext } from 'msp_fes/uiLib';

function App() {
  return (
    <UiEventProvider>
      <ServiceDispatcher config={{ serviceHubUrl: '/api/v1' }} />
      <MyApp />
    </UiEventProvider>
  );
}

function MyApp() {
  const { publish } = useUiEventContext();
  
  const handleLogin = () => {
    const event = createUserChangedEvent('user-123', 'John Doe', 'session-xyz');
    publish(event);
  };
  
  return <button onClick={handleLogin}>Trigger User Profile Load</button>;
}
```

## What Happens

1. **UserChanged event** published
2. **ServiceDispatcher** catches it, sends HTTP request to `/api/v1/service/run`
3. **FES backend** proxies to ServiceHub
4. **ServiceHub** uses ActivitySet to route to registered actorwork service
5. **Actorwork** executes GetUserProfileData and returns data
6. **Response flows back** through the chain
7. **ServiceDispatcher** publishes **DataLoaded event**
8. **Behaviours** can now react to the loaded data

## Next Steps

1. **Wire the Behaviour** - Add useUserProfileBehaviour() to your app
2. **Connect Presentation** - Implement blade opening from PresentationRequest
3. **Add Real Data** - Replace mock data in getUserProfileData with DB queries
4. **Test End-to-End** - Complete the full flow from click → activity → UI update

## Environment Variables Needed

### FES (.env)
```
VITE_SERVICE_HUB_API_URL=http://localhost:4001
```

### ServiceHub (.env)
```
PORT=4001
CORS_ORIGIN=*
```

### Actorwork (.env)
```
PORT=3001
MY_URL=http://localhost:3001
SERVICEHUB_URL=http://localhost:4001
CORS_ORIGIN=*
```

**Note:** If ServiceHub is not available when Actorwork starts, registration will automatically retry every 5 seconds until successful.
