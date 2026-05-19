# MSP Platform — Module Authoring Guide

_April 2026_

This guide covers what a conformant MSP Custom Module consists of and the
contracts it must meet to be admitted to the platform.

---

## Module anatomy

A full Custom Module has up to three layers, independently deployable:

| Layer | Package | Role |
|---|---|---|
| **UI Module** | Vite MF remote | React features exposed via MF `exposes` |
| **Service Module** | Node/Express service | Business Activities, called via ServiceHub |
| **Data Module** | Node service | Data access, always mediated by DataHub |

Smaller modules may only need one or two layers.

---

## UI Module

### Vite config requirements

```js
// vite.config.mjs (remote)
import { sharedDeps } from 'msp_common';

const mfShared = sharedDeps;

export default defineConfig({
  plugins: [
    federation({
      name: 'my_module',           // unique module name
      filename: 'my_remoteEntry.js',
      exposes: {
        './MyFeature': './src/features/MyFeature.tsx',
      },
      shared: mfShared,
    }),
    react(),
    // REQUIRED: strip shared deps from optimizeDeps.include
    {
      name: 'mf-remote-strip-shared-from-deps',
      enforce: 'post',
      configResolved(config) {
        const sharedKeys = new Set(Object.keys(mfShared));
        if (config.optimizeDeps.include) {
          config.optimizeDeps.include = config.optimizeDeps.include.filter(
            id => !sharedKeys.has(id)
          );
        }
      }
    },
  ],
  optimizeDeps: {
    exclude: Object.keys(mfShared),  // shared deps must never land in .vite/deps
  },
});
```

### Feature conventions

- Features exposed via MF are React components (`React.FC` or `forwardRef`)
- Features use `msp_ui_common` dispatch contexts (`useMenuDispatch`,
  `useNavTreeDispatch`, `usePresentationDispatch`) to register their
  presence in the shell
- Features use `createBehaviour` / `Behaviour` from `msp_ui_common` to
  encapsulate their lifecycle (register on mount, `clearContextOwner` on unmount)
- Features must not render shell chrome directly

### Shared deps

All React, MUI, and other shared dependencies are provided by the host (`msp_fes`).
Do not import or bundle your own copies. The shared dep list is in
`msp_common/src/sharedDeps.ts`.

---

## Service Module

### Manifest registration

Every Service Module must register a signed manifest with ServiceHub on startup.
The manifest declares:

- Module name and version
- Exposed routes (Activities)
- Data resources accessed (for PDP evaluation)
- Dependencies on other modules

Until the manifest is registered and admitted, the module's routes are unreachable.

### Activity pattern

Activities are the callable units of work for a Service Module:

```ts
// pattern: persistent activity
async function createCaseActivity(params: CreateCaseParams, context: RequestContext) {
  // validate params
  // check permissions via context (already validated by ServiceHub PDP)
  // write to persistence
  // return updated state
}

// pattern: ephemeral activity
async function previewRatingActivity(params: RatingParams, context: RequestContext) {
  // validate params
  // compute result
  // return — caller holds result as unsaved UI state, nothing persisted
}
```

Activities must not access data directly. All data access goes via DataHub.

### Inter-module calls

All calls to other modules route through ServiceHub:
```ts
// via ServiceHub relay, not direct HTTP
await serviceHubClient.call('other_module', 'activityName', params);
```

---

## Data Module

Data Modules are called exclusively by DataHub. They never receive requests
directly from Service Modules or the UI.

DataHub applies:
1. The module's declared minimisation policy
2. The module's declared redaction policy
3. Returns the minimised/redacted result to the requesting Service Module

Data Modules declare their minimisation and redaction DSLs as part of their
admitted manifest.

---

## Admission process (planned)

1. Automated gate: schema validation, dependency allow-list, AST scan
2. Human reviewer signs the manifest
3. ServiceHub verifies signature on load; unsigned = hard reject + alert

See [../security/RGAM.md](../security/RGAM.md) for the full rationale.
