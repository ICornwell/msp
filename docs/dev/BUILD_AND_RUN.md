# MSP Platform — Build and Run

_April 2026_

---

## Prerequisites

- Node.js (see `.nvmrc` or `package.json` engines if present)
- Yarn 4 (`corepack enable && corepack prepare yarn@4.13.0 --activate`)

---

## Workspace structure

The monorepo root is `msp_ws/linkto_ws_package.json` (symlinked workspace root).
All packages are yarn workspaces.

| Package | Role |
|---|---|
| `msp_common` | Shared types, ports, shared dep list (used by all) |
| `msp_svr_common` | Server-side shared utilities (JWT, ALS, service-manager) |
| `msp_ui_common` | UI component library, behaviour system, dispatch contexts |
| `module-federation-vite` | Custom MF Vite plugin (workspace fork) |
| `msp_semaphores` | Semaphore service (sequential manifest registration guard) |
| `msp_servicehub` | ServiceHub — routing, manifest, admission |
| `msp_datahub` | DataHub — data minimisation boundary |
| `msp_fes` | Frontend shell — MF host, BFF |
| `msp_actorwork` | Actor/Work remote module (MF remote) |

---

## Build order

**Full build (from workspace root):**

```bash
yarn build:all
```

This runs in dependency order:
1. `msp_common` + `msp_svr_common` + `msp_ui_common` (commons)
2. `module-federation-vite` (MF plugin)
3. `msp_semaphores`
4. `msp_servicehub` + `msp_datahub` + `msp_fes` (hubs)
5. `msp_actorwork` + `msp_fes` (modules — fes rebuilt after remotes)

**Build a single package:**

```bash
yarn workspace msp_ui_common run build
yarn workspace msp_fes run build
# etc.
```

---

## Running in development

**Full stack (from workspace root):**

```bash
yarn start
# Starts: servicehub, datahub, actorwork, fes concurrently
```

**Frontend only (dev mode with HMR):**

```bash
yarn workspace msp_fes run start
# Runs: vite dev (port 3000) + BFF node server concurrently
```

**Frontend without BFF (Vite only):**

```bash
yarn workspace msp_fes run dev
```

---

## Common tasks

### Clear MF / Vite dep cache

```bash
# From msp_fes:
yarn workspace msp_fes run clear_mf_cache
# Or manually:
rm -rf /home/ian/js/msp/msp_fes/node_modules/.vite/deps
rm -rf /home/ian/js/msp/msp_fes/node_modules/__mf__virtual
```

Required after:
- Rebuilding `module-federation-vite`
- Changing `sharedDeps` in `msp_common`
- Unexplained MF or React singleton errors at runtime

### Rebuild the MF plugin

```bash
cd /home/ian/js/msp/module-federation-vite
pnpm build
# or:
node generate-shared-esm-exports-registry.mjs && rm -rf lib && npx microbundle --no-sourcemap --compress=false
# Then clear msp_fes dep cache (see above)
```

### Run tests

```bash
yarn workspace msp_fes run test
yarn workspace msp_ui_common run test
# etc.
```

---

## Per-service ports (from `msp_svr_common` Ports)

| Service | Default port |
|---|---|
| `msp_fes` (Vite dev) | 3000 |
| `msp_servicehub` | (see Ports config) |
| `msp_datahub` | (see Ports config) |
| `msp_actorwork` | 3003 (VITE_PORT env) |
| `msp_semaphores` | 4010 |
