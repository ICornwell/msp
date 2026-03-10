# MSP Architecture & Implementation Notes

## System Overview

**Multi-service platform** with pull-based discovery, event-driven behaviours, and module federation for micro-frontends.

```
┌─────────────────────────────────────────────────────────────┐
│ FES (Host) - Port 3000                                      │
│ ├─ Vite: http://localhost:3000                              │
│ ├─ BFF (api): http://localhost:4000                         │
│ └─ Behaviour Runtime + Discovery                            │
└─────────────────────────────────────────────────────────────┘
         │ PUT /api/v1/service/run
         │ (discovery/discoverOpenUiFeatures)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ServiceHub (Proxy) - Port 3001 (MF) / 4001 (API)            │
│ ├─ Feature registry                                         │
│ └─ Routes feature requests to appropriate services          │
└─────────────────────────────────────────────────────────────┘
         │ PUT /api/v1/service/run
         │ (discovery/discoverOpenUiFeatures)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Actorwork (MF Remote) - Port 3002                           │
│ ├─ Exposes: ./UserProfileFeature                            │
│ └─ Provides: GetUserProfileData activity                    │
└─────────────────────────────────────────────────────────────┘
```

## Discovery Flow (Pull Model)

1. **FES boots** → calls `appUiFeatures.tsx:getAvailableFeatures()`
2. **HTTP request**: `PUT /api/v1/service/run`
   - Namespace: `discovery`
   - Activity: `discoverOpenUiFeatures`
3. **FES BFF** (`src/uiApi/activities/discovery.ts`) proxies to servicehub
4. **ServiceHub** returns array of `UiFeatureManifestSection[]`:
   ```typescript
   {
     name: 'UserProfileFeature',
     version: '1.0.0',
     remoteName: 'actorwork/UserProfileFeature',  // <moduleName>
     serverUrl: 'http://localhost:3002',
     allowedContexts: ['*']
   }
   ```
5. **FES dynamically registers** MF remotes and loads components:
   - Parses `remoteName` as `<remoteName>/<moduleName>`
   - Adds to federation runtime: `registerRemotes({ actorwork: 'http://localhost:3002/actorwork_remoteEntry.js' })`
   - Loads: `import UserProfileFeature from 'actorwork/UserProfileFeature'`
6. **React renders** discovered UI components on page

## Module Federation Setup

| Package | Role | Port (MF) | Exposes | Key Config |
|---------|------|-----------|---------|-----------|
| **FES** | Host | 3000 | None | `shared: { ...sharedDeps }` |
| **Actorwork** | Remote | 3002 | `./UserProfileFeature` | `filename: 'actorwork_remoteEntry.js'` |

**Shared dependencies** (`msp_common/src/sharedDeps.ts`):
```typescript
{
  'react': { singleton: true, requiredVersion: '*', isEsm: false },
  'react-dom': { singleton: true, requiredVersion: '*', isEsm: false },
  '@mui/material': { singleton: true, ... },
  '@mui/system': { singleton: true, ... },
  '@mui/icons-material': { singleton: true, ... }
}
```

## Namespace Safety: Remote Prefixing

**Problem**: Multiple remotes can define identical event IDs, menu IDs, blade names → collisions.

**Solution**: Prefix all IDs with remote name or product domain from manifest.

### Prefixing Strategy

Use **remote name** from discovery payload (cleaner, single source of truth):

```typescript
// From manifest discovery:
{
  name: 'UserProfileFeature',
  remoteName: 'actorwork/UserProfileFeature',  // ← extract 'actorwork'
  product: { domain: 'actorwork', name: 'User Profile UI', version: '1.0.0' }
}

// Prefixed IDs in behaviour DSL:
const PREFIX = 'actorwork'

.whenEventRaised(`${PREFIX}:UserChanged`)        // 'actorwork:UserChanged'
.requestIsRaised.toPresentationSubsystem.requests
  .toOpenBlade(`${PREFIX}:UserProfileBlade`, ...)  // 'actorwork:UserProfileBlade'
  
.requestIsRaised.toPresentationSubsystem.menus
  .toAdd({ id: `${PREFIX}:user-profile-menu`, ... })
```

### Implementation Points

1. **Discovery returns remote name**: Already in payload
2. **Behaviour builder injects prefix**: Builder could accept optional `remotePrefix` param or extract from manifest
3. **Event dispatchers preserve prefix**: All published events include prefix
4. **Render engine respects prefix**: UI parts, menus, blade names keyed by prefixed ID
5. **No collision risk**: Each remote's event/menu/blade namespace is isolated

### Example: Multi-Remote Setup

```
FES Host
├─ actorwork:UserChanged → actorwork:UserProfileBlade
├─ datahub:DataChanged → datahub:DataGrid
└─ reporting:QueryUpdated → reporting:ReportPanel

No namespace conflicts even with identical feature names in different remotes.
```

---

## Fluent Behaviour DSL

**Purpose**: Declarative configuration of how UI elements respond to events.

### Fluent API Chain

```typescript
createBehaviour<DataType>()
  .whenEventRaised('EventTypeName')
    .whenEventSatisfies((event) => boolean_condition)
      .requestIsRaised.toActivitySubSystem
        .toCallActivityAsync({ id, action, payloadFromEvent, ... })
      .requestIsRaised.toPresentationSubsystem.menus
        .toAdd(menuItem)
        .toRemove(menuId)
        .toEnable(menuId)
      .requestIsRaised.toPresentationSubsystem.requests
        .toOpenBlade(bladeName, (event) => ({ params }))
        .toCloseBlade(bladeName)
        .toOpenTab(tabName)
        .toNavigate(path)
      .requestIsRaised.toDataSubsystem
        .toInvalidate(dataId)
        .toSave(dataId, (event) => ({ newData }))
    .end()
  .end()
  .build()
```

### Example: UserBladeBehaviour (`msp_actorwork/src/uiElements/.../UserBladeBehaviour.ts`)

```typescript
export const UserProfileBehaviourConfig = createBehaviour()
  .whenEventRaised('UserChanged')
    .requestIsRaised.toActivitySubSystem
      .toCallActivityAsync({
        id: 'getUserProfile',
        action: 'actorwork/GetUserProfileData/1.0.0',
        payloadFromEvent: (event: any) => ({ userId: event.payload?.userId }),
      })
      .end()
  .whenEventRaised('DataLoaded')
    .whenEventSatisfies((event: any) => event.payload?.dataType === 'userProfile')
    .requestIsRaised.toPresentationSubsystem.menus.toAdd({
      id: 'user-profile-menu',
      label: 'Profile Actions',
      // ...
    })
    .end()
  .whenEventRaised('MenuItemClick')
    .whenEventSatisfies((event: any) => event.payload?.menuId === 'user-profile-menu')
    .requestIsRaised.toPresentationSubsystem.requests
      .toOpenBlade('UserProfileBlade', (event: any) => ({ context: event.payload?.context }))
      .end()
  .build()
```

## Behaviour Runtime Engine

**Location**: `msp_fes/src/uiLib/behaviours/Behaviour.tsx`

**What it does**:
1. Accepts fluent config + optional data
2. Registers all local components with render engine
3. **Subscribes to configured event types** via `UiEventContext`
4. **For each event**:
   - Evaluates `element.eventCondition(event)`
   - Evaluates `element.dataCondition(data)`
   - If both pass, converts actions to request messages
5. **Publishes request messages** via `UiPubSub`

```typescript
// Pseudocode
useEffect(() => {
  const subscriptions = []
  
  for (const element of config.elements) {
    const subId = subscribe({
      msgTypeFilter: (msg) => msg.messageType === element.eventType,
      callback: (event) => {
        if (!element.eventCondition(event)) return
        if (!element.dataCondition(data)) return
        
        for (const action of element.actions) {
          const request = toRequestMessage(action, event, data)
          if (request) publish(request)
        }
      }
    })
    subscriptions.push(subId)
  }
  
  return () => subscriptions.forEach(unsubscribe)
}, [config, data])
```

## Event-Driven Test Flow

### Scenario: Load User Profile

#### Step 1: Trigger UserChanged Event
```javascript
// In browser console or test code
const event = new CustomEvent('UserChanged', {
  detail: {
    messageType: 'UserChanged',
    payload: { userId: 'user-123' }
  }
});
window.dispatchEvent(event);
```

#### Step 2: Behaviour Reacts
- Behaviour runtime **receives** `UserChanged` event
- **Condition check**: Always true (no specific condition)
- **Action triggered**: `toCallActivityAsync('actorwork/GetUserProfileData/1.0.0')`
- **Publishes**: `ServiceCallRequest`
  ```typescript
  {
    messageType: 'ServiceCallRequest',
    namespace: 'actorwork',
    activityName: 'GetUserProfileData',
    version: '1.0.0',
    payload: { userId: 'user-123' }
  }
  ```

#### Step 3: ServiceDispatcher Routes
- `ServiceDispatcher` (running in FES or via service worker)
- Routes to `actorwork` service
- Calls activity, waits for result
- **Publishes**: `DataLoaded` event
  ```typescript
  {
    messageType: 'DataLoaded',
    payload: {
      dataType: 'userProfile',
      userId: 'user-123',
      name: 'John Doe',
      // ... data
    }
  }
  ```

#### Step 4: Behaviour Reacts Again
- Behaviour runtime **receives** `DataLoaded` event
- **Condition check**: `event.payload?.dataType === 'userProfile'` ✓
- **Action triggered**: `toAdd(menuItem)`
- **Publishes**: `MenuRequest`
  ```typescript
  {
    messageType: 'MenuRequest',
    operation: 'add',
    menuItem: {
      id: 'user-profile-menu',
      label: 'Profile Actions',
      // ...
    }
  }
  ```

#### Step 5: User Clicks Menu Item
- UI renders new menu, user clicks
- **Publishes**: `MenuItemClick` event
  ```typescript
  {
    messageType: 'MenuItemClick',
    payload: { menuId: 'user-profile-menu' }
  }
  ```

#### Step 6: Behaviour Opens Blade
- Behaviour runtime **receives** `MenuItemClick` event
- **Condition check**: `event.payload?.menuId === 'user-profile-menu'` ✓
- **Action triggered**: `toOpenBlade('UserProfileBlade', ...)`
- **Publishes**: `PresentationRequest`
  ```typescript
  {
    messageType: 'PresentationRequest',
    requestType: 'openBlade',
    target: 'UserProfileBlade',
    params: { context: event.payload?.context }
  }
  ```

#### Step 7: UI Renders Blade
- Render engine **receives** `PresentationRequest`
- Opens blade component with params
- User interacts with profile UI

---

## Key Files & Responsibilities

### Discovery & Registration
| File | Purpose |
|------|---------|
| `msp_fes/src/ui/appUiFeatures.tsx` | Dynamic MF loader; calls discovery |
| `msp_fes/src/uiApi/activities/discovery.ts` | BFF proxy to servicehub |
| `msp_fes/src/uiLib/comms/serverRequests.tsx` | HTTP client to BFF |
| `msp_actorwork/src/apis/manifestRegistration.ts` | Auto-registers with servicehub on startup |

### Behaviour System
| File | Purpose |
|------|---------|
| `msp_fes/src/uiLib/behaviours/Behaviour.tsx` | Runtime processor (subscriber, evaluator, dispatcher) |
| `msp_fes/src/uiLib/behaviours/fluentBehaviour.ts` | DSL type definitions |
| `msp_fes/src/uiLib/behaviours/behaviourBuilder.ts` | DSL factory/builder implementation |
| `msp_fes/src/uiLib/index.ts` | Exports Behaviour component |

### Actorwork Example
| File | Purpose |
|------|---------|
| `msp_actorwork/src/uiElements/features/blades/userProfile/UserBladeBehaviour.ts` | Fluent config |
| `msp_actorwork/src/uiElements/features/blades/userProfile/UserProfileFeature.tsx` | Mounts `<Behaviour config={...} />` |
| `msp_actorwork/vite.config.ts` | MF remote setup |

### Common / Shared
| File | Purpose |
|------|---------|
| `msp_common/src/sharedDeps.ts` | Shared library list for MF |
| `msp_common/src/index.ts` | Exports types, builders, etc. |

---

## Testing Checklist

- [ ] **Startup**: `servicehub` → `actorwork` → `fes`
- [ ] **Discovery**: FES calls `/api/v1/service/run` → receives UserProfileFeature manifest
- [ ] **MF Loading**: Remote entry loads from `http://localhost:3002`, UserProfileFeature resolves
- [ ] **Event Flow**: Dispatch `UserChanged` → see `ServiceCallRequest` in logs
- [ ] **Activity Call**: Actorwork receives and executes `GetUserProfileData`
- [ ] **Menu Render**: `DataLoaded` triggers menu creation
- [ ] **Blade Open**: Menu click triggers `PresentationRequest` → blade renders
- [ ] **No TypeScript errors**: `yarn common:build && yarn fes:build:bff`

---

## Know Issues & Solutions

### Vite + Module Federation
- **Issue**: `__mf__virtual` imports fail during Rollup build
- **Solution**: Added explicit alias in `msp_fes/vite.config.mjs`:
  ```javascript
  resolve: {
    alias: { '__mf__virtual': path.resolve(__dirname, 'node_modules/__mf__virtual') }
  }
  ```

### Shared Dependency Format
- Keep `isEsm: false` (CJS) for core libs; reduces ES->CJS wrapper issues
- Narrowed shared list to only essential: react, react-dom, MUI core (avoid transitive bloat)

### Workspace Lockfile
- Remove nested `module-federation-vite/yarn.lock` (use monorepo root only)
- Always run `yarn install` from root to refresh PnP map

---

## Future Security Model (Discussed)

- Service worker injects auth tokens into all requests
- Manifests declare `requiredPolicies` per feature
- InfoSec digitally signs manifests (JWS envelope)
- Fail-closed: unsigned/modified manifests block feature activation
- CI/CD validates manifest schema + signatures before deployment
- PVT deployment: code ships, features activate only after signing ("feature flag dream")

---

## References

- **Module Federation Runtime**: `@module-federation/runtime` (loaded dynamically)
- **Fluent Builder Pattern**: Return self for chaining, `.end()` unwinds return type
- **PnP (Yarn 4)**: Plugnplay resolver; requires workspace awareness and alias setup for virtual imports
- **Behaviours**: Event → Condition → Action → Request dispatch pattern
