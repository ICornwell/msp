# msp_semaphores

Small semaphore issuer service for MSP.

## Design

- Stable interface: `SemaphoreProvider`.
- Current backend: `InMemorySemaphoreProvider`.
- Future backends can swap in (Redis/DB) without changing middleware/sdk contracts.

## Run

- `yarn workspace msp_semaphores build`
- `yarn workspace msp_semaphores start`

Service endpoint:

- `POST /api/v1/semaphores/acquire`
- `POST /api/v1/semaphores/renew`
- `POST /api/v1/semaphores/release`
- `POST /api/v1/semaphores/validate`
- `GET /api/v1/semaphores/health`

## Servicehub manifest registration guard

Example route wiring (sequential manifest registration):

```ts
import { createSemaphoreMiddleware } from 'msp_semaphores/distApi/sdk/createSemaphoreMiddleware.js';

app.put(
  '/api/v1/manifest/register',
  createSemaphoreMiddleware({
    semaphoreBaseUrl: 'http://localhost:4010',
    semaphoreName: 'servicehub:manifest-register',
    ttlMs: 10000,
  }),
  registerManifestHandler
);
```

## Outbound helper

`withSemaphore` runs a function inside acquire/release lifecycle.

`buildSemaphoreHeaders(lease)` returns standard headers for forwarding lease context.
