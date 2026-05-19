# MSP Platform — Architecture Overview

_April 2026_

---

## System topology

```
Internet
  │
  ▼
[ DMZ ]
  ├─ UI BFF   (msp_fes — serves shell + MF host, proxies UI API calls)
  ├─ API BFF  (external API surface, future)
  └─ Agent BFF (AI agent gateway, future)
          │
          ▼
    [ ServiceHub ]  ─────────────────────────────────────────┐
          │                                                   │
          ▼                                                   ▼
  [ Custom Service Modules ]                         [ DataHub ]
  (msp_actorwork, future modules…)                         │
          │  (via ServiceHub only)                          ▼
          └───────────────────────────────►  [ Custom Data Modules ]
```

### Key boundaries

- **ServiceHub** is the sole internal egress chokepoint. All inter-module
  calls route through it. No direct module-to-module paths.
- **Custom Modules** receive inbound calls from ServiceHub only.
  No direct external inbound; no direct outbound except back through ServiceHub
  via manifest-declared routes.
- **DataHub** receives requests from ServiceHub, applies minimisation and
  redaction policies, calls Custom Data Modules, and returns minimised results.
- **Default network stance: deny all.** Every allowed path is explicit
  (K8s NetworkPolicy in production).

---

## Module Federation (UI)

The UI uses **Vite Module Federation** with a custom MF plugin
(`module-federation-vite` workspace package, a fork/extension of
`@module-federation/vite`).

```
msp_fes  (Host)
  │
  ├─ shared deps in optimizeDeps.include (React, MUI, etc.)
  │   → host is the source of truth for all shared singletons
  │
  ├─── loads ──► msp_actorwork  (Remote)
  └─── loads ──► [future remotes]
```

### Host (`msp_fes`)

- Shared deps in `optimizeDeps.include` — pre-bundled, host is source of truth
- `noDiscovery: true`, `holdUntilCrawlEnd: false`
- BFF (`uiApiProxyHandler.ts`) proxies UI API calls to ServiceHub

### Remotes (`msp_actorwork`, etc.)

- Shared deps in `optimizeDeps.exclude` — never in `.vite/deps`
- `mf-remote-strip-shared-from-deps` inline plugin removes any shared keys
  that `@vitejs/plugin-react-swc` re-adds to `include`
- `noDiscovery: true`, `holdUntilCrawlEnd: false`
- Exposes named features (e.g. `./UserWorkListFeature`, `./UserProfileFeature`)

### Why this matters

If a shared dep lands in a remote's `.vite/deps`, Vite's `importAnalysis`
rewrites the import directly to `.vite/deps/react.js?v=REMOTE_HASH`, bypassing
the MF alias. The remote gets its own React instance → hooks fail
(`Invalid hook call`). The remote's `.vite/deps` is unreachable cross-origin
anyway in the service-worker proxy chain.

---

## BFF pattern

`msp_fes` includes a Backend-For-Frontend (BFF) built with `vite-plugin-mix`.

The BFF:
- Attaches the user's MSAL access token to outbound API calls
- Routes `/api/**` calls to ServiceHub (or directly to service endpoints in dev)
- Serves the MF host shell in production

In development, `yarn start` runs both Vite dev server (`vite dev`) and the
BFF node server (`node ./distApi/server.js`) concurrently.

---

## Authentication

- **Users** authenticate via MSAL (Azure AD / Entra ID)
- Tokens flow: Browser → BFF (MSAL token attached) → ServiceHub (validates JWT)
- ServiceHub performs OIDC discovery + JWKS key fetch for validation
- Validated claims are propagated downstream via `X-Context-Claim` headers
  using AsyncLocalStorage for request scoping (`msp_svr_common`)

---

## Shared dependencies

The canonical list of shared MF deps is declared in `msp_common/src/sharedDeps.ts`
and imported by both host and remote `vite.config.mjs` files.

This ensures the shared dep set is always in sync across all modules.
Changes to shared deps require rebuilding all affected modules.

---

## Build and run

See [../dev/BUILD_AND_RUN.md](../dev/BUILD_AND_RUN.md).
