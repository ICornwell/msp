# End-to-End User Profile Flow Implementation

## Summary

We've implemented a complete end-to-end flow demonstrating event-driven architecture with service orchestration across the MSP micro-frontend system.

## Architecture Overview

```
User Action (UserChanged event)
    ↓
Behaviour (listens for event)
    ↓
ServiceCallRequest (published to event bus)
    ↓
ServiceDispatcher (catches request)
    ↓
HTTP to FES Backend (/api/v1/service/run)
    ↓
FES Backend proxies to ServiceHub (/api/v1/service/run)
    ↓
ServiceHub routes to Actorwork (/api/v1/service/run)
    ↓
Actorwork executes GetUserProfileData activity
    ↓
Response flows back through chain
    ↓
ServiceDispatcher publishes DataLoaded event
    ↓
Behaviour listens for DataLoaded
    ↓
MenuRequest published (add "See User Profile")
    ↓
User clicks menu
    ↓
MenuItemClick event published
    ↓
Behaviour listens and publishes PresentationRequest
    ↓
UI opens User Profile blade
```

## Components Implemented

### 1. Message Contracts (`msp_common/src/messages/`)
- **uiEvents.ts**: Event types (UserChanged, DataLoaded, MenuItemClick, Interaction)
- **uiRequests.ts**: Request types (DataRequest, ServiceCallRequest, PresentationRequest, MenuRequest)

### 2. Service Activity (`msp_actorwork/src/services/`)
- **getUserProfileData.ts**: 
  - Activity: `actorwork/GetUserProfileData/1.0.0`
  - Input: `{ userId: string }`
  - Output: `{ userId, name, email, userName }`
  - Currently returns mock data (can be wired to real DB later)

### 3. API Endpoints (`msp_actorwork/src/apis/`)
- **api.ts**: Express app with CORS, body parsing
- **routes.ts**: 
  - `GET /health` - Health check
  - `PUT /api/v1/service/run` - Service activity execution

### 4. ServiceHub Routing (`msp_servicehub/src/api/services/`)
- **serviceActivityRegistry.ts**: Tracks which services provide which activities
- **activityRouter.ts**: Routes requests to local or remote services
  - Tries local activities first
  - Falls back to registry lookup for remote services
  - Proxies HTTP request to registered service URL

### 5. Behaviour System (`msp_fes/src/uiLib/behaviours/`)
- **behaviourBuilder.ts**: Fluent DSL factory implementation
- **Behaviour.ts**: React component for behaviour lifecycle
- **fluentBehaviour.ts**: TypeScript interfaces for DSL

### 6. Service Dispatcher (`msp_fes/src/uiLib/components/`)
- **ServiceDispatcher.tsx**: 
  - Listens for `ServiceCallRequest` events
  - Makes HTTP requests to `/api/v1/service/run`
  - Publishes `DataLoaded` events with results
  - Handles errors and timeouts

### 7. User Profile Behaviour (`msp_actorwork/src/uiElements/features/blades/userProfile/`)
- **UserBladeBehaviour.ts**: Hook-based behaviour implementation
  - Listens for UserChanged → requests GetUserProfileData
  - Listens for DataLoaded → adds menu item
  - Listens for MenuItemClick → opens blade

## How to Wire It Up

### Step 1: Register Actorwork Activity with ServiceHub

On actorwork startup, register its activities with servicehub:

```typescript
import { serviceRequest } from 'msp_common';

const registration = {
  namespace: 'actorwork',
  activityName: 'GetUserProfileData',
  version: '1.0.0',
  serviceUrl: 'http://localhost:3001', // actorwork URL
  serviceName: 'actorwork'
};

await serviceRequest({
  namespace: 'servicehub',
  activityName: 'registerServiceActivity',
  version: '1.0.0',
  payload: registration
}, {
  baseUrl: 'http://localhost:4001' // servicehub URL
});
```

### Step 2: Add ServiceDispatcher to FES App

In your main FES app component:

```tsx
import { UiEventProvider, ServiceDispatcher } from 'msp_fes/uiLib';

function App() {
  return (
    <UiEventProvider>
      <ServiceDispatcher config={{ serviceHubUrl: '/api/v1' }} />
      {/* Rest of your app */}
    </UiEventProvider>
  );
}
```

### Step 3: Use the Behaviour in Actorwork

In your actorwork UI component:

```tsx
import { useUserProfileBehaviour } from './uiElements/features/blades/userProfile/UserBladeBehaviour';

function ActorworkApp() {
  useUserProfileBehaviour(); // Wire up the behaviour
  
  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

### Step 4: Trigger the Flow

Publish a UserChanged event to start the flow:

```typescript
import { useUiEventContext, createUserChangedEvent } from 'msp_fes/uiLib';

function LoginButton() {
  const { publish } = useUiEventContext();
  
  const handleLogin = (userId: string) => {
    const event = createUserChangedEvent(userId, 'John Doe', 'session-123');
    publish(event);
  };
  
  return <button onClick={() => handleLogin('user-123')}>Login</button>;
}
```

## Testing Checklist

- [ ] Start all services (actorwork, servicehub, fes)
- [ ] Verify actorwork registers with servicehub on startup
- [ ] Trigger UserChanged event from UI
- [ ] Verify ServiceCallRequest is published to event bus
- [ ] Verify HTTP request reaches actorwork's `/api/v1/service/run`
- [ ] Verify GetUserProfileData activity executes and returns data
- [ ] Verify DataLoaded event is published with user profile data
- [ ] Verify "See User Profile" menu item appears
- [ ] Click menu item and verify MenuItemClick event
- [ ] Verify PresentationRequest is published
- [ ] Verify User Profile blade opens with data

## Next Steps

1. **Wire Presentation System**: Implement blade opening logic from PresentationRequest
2. **Connect to Real Data**: Replace mock data in getUserProfileData with actual DB queries
3. **Add Error Handling**: Implement retry logic, error notifications
4. **Expand Behaviour DSL**: Add more request builders (navigation, tabs, etc.)
5. **Module Federation**: Expose actorwork UI as federated remote
6. **Testing**: Add integration tests for the full flow

## Files Changed/Created

### msp_common
- `src/messages/uiEvents.ts` (created)
- `src/messages/uiRequests.ts` (created)
- `src/messages/index.ts` (created)
- `src/index.ts` (updated - added messages export)

### msp_actorwork
- `src/services/getUserProfileData.ts` (created)
- `src/services/index.ts` (created)
- `src/apis/api.ts` (created)
- `src/apis/routes.ts` (created)
- `src/manifest/manifest.ts` (created)
- `src/uiElements/features/blades/userProfile/UserBladeBehaviour.ts` (updated)

### msp_servicehub
- `src/api/services/serviceActivityRegistry.ts` (created)
- `src/api/services/activityRouter.ts` (created)
- `src/api/routes.ts` (updated - uses activityRouter)

### msp_fes
- `src/uiLib/behaviours/behaviourBuilder.ts` (created)
- `src/uiLib/behaviours/fluentBehaviour.ts` (updated - added build method)
- `src/uiLib/components/ServiceDispatcher.tsx` (created)
- `src/uiLib/index.ts` (updated - added exports)

## Configuration Notes

### Port Assignments
- **FES**: 3000 (default)
- **Actorwork**: 3001 (recommended)
- **ServiceHub**: 4001 (recommended)
- **DataHub**: 4002 (if needed)

### Environment Variables

**FES** (`msp_fes/.env`):
```
VITE_SERVICE_HUB_API_URL=http://localhost:4001
```

**ServiceHub** (`msp_servicehub/.env`):
```
PORT=4001
CORS_ORIGIN=*
```

**Actorwork** (needs .env file):
```
PORT=3001
CORS_ORIGIN=*
```
