# MSP Platform — msp_servicehub

_April 2026_

ServiceHub is the sole internal routing and enforcement chokepoint.
All calls between the UI BFF and Custom Service Modules route through it.

---

## Responsibilities

- Receive JWT-authenticated requests from the BFF
- Validate tokens via OIDC discovery + JWKS
- Route requests to Custom Service Modules via their registered manifests
- Enforce access policy (PDP: ReBAC + ABAC + CBAC)
- Propagate claims downstream via `X-Context-Claim` headers
- Manage module manifest registration (with semaphore guard)
- Record structured audit events on every allow/deny decision

---

## Key concepts

### Manifest registration

Custom Service Modules register on startup:

```
POST /api/v1/manifest/register
```

Registration is guarded by `msp_semaphores` to ensure sequential processing
(prevents race conditions on concurrent startups).

The manifest declares:
- Module identity (name, version)
- Exposed routes/Activities
- Declared resource types
- Inbound and outbound route permissions

Until a manifest is registered (and in future: signed and admitted),
the module's routes are unreachable.

### Request routing

Incoming requests are matched against active manifests.
ServiceHub acts as a reverse proxy + policy enforcement point:

```
BFF → ServiceHub → [PDP evaluation] → Custom Service Module
```

No direct paths from BFF to Custom Service Modules exist.

### Token propagation (AsyncLocalStorage)

`msp_svr_common` provides `runWithContext` / `validateAndStoreIdToken`
for request-scoped ALS context. Validated claims flow through the request
lifecycle and are available to downstream Activity code without passing
them explicitly through every function call.

---

## Development

Build: `yarn workspace msp_servicehub run build`
Start: `yarn workspace msp_servicehub run start`
Dev: `yarn workspace msp_servicehub run dev`
Test: `yarn workspace msp_servicehub run test`

Source: `src/`
- `api/` — Express server, routes, middleware
- `services/` — ServiceHub business logic
- `dataConnectors/` — outbound connections to modules and DataHub
- `uiElements/` — any ServiceHub UI (admin, monitoring)

Built output: `distApi/`
