# Copilot Working Context — ESM Export Enumerator

Restore this context when returning to work on this toolset.

---

## Problem being solved

Module Federation (MF) `loadShare` delivers packages as runtime module objects
inside virtual `__loadShare__` files. Those files must declare named exports
**statically** (e.g. `export const useState = pick('useState')`) because
bundlers see them at parse time, before the module object arrives.

`export * from 'pkg'` is unusable for CJS packages — esbuild can't enumerate
`module.exports = fn()` results. So we maintain an explicit `namedExports` list
per package in `registry.manifest.json`, and this enumerator keeps it current.

The insight that makes static analysis sound: **ESM `export` statements cannot
be conditional**. Top-level `export` is always statically knowable. The only
failure mode is when an `export * from './x'` chain reaches a CJS file.

---

## Architecture

### The three-layer manifest pipeline

```
registry.manifest.json
  ↓  generate-shared-esm-exports-registry.mjs
src/virtualModules/sharedEsmExports/index.ts   (generated, do not hand-edit)
  └─ getSharedEsmExportCode(pkg)      → spliced into __loadShare__ virtual files
```

### Per-package factory files

`sharedEsmExports/*.ts` — hand-authored, emit string code injected into
the virtual `__loadShare__` module body. They run in the browser, so they
use a `pick()` pattern to survive `.default.default.default` CJS interop:

```ts
// Inside the emitted virtual module string:
const pick = (key) => {
  for (const candidate of [moduleFactory, moduleFactory?.default, ...fallbacks]) {
    if (candidate?.[key] !== undefined) return candidate[key];
  }
};
export const useState = pick('useState');
```

### `forceEsmInServe` packages

This option was removed. All packages use the `loadShare`/`initPromise` path
(MF runtime shared scope) for proper cross-origin singleton behaviour.

---

## Key files

| Path | Purpose |
|---|---|
| `src/virtualModules/sharedEsmExports/registry.manifest.json` | Source of truth for named exports per package |
| `scripts/generate-shared-esm-exports-registry.mjs` | Reads manifest, generates `index.ts` |
| `scripts/generate-factory-files.ts` | **New** — generates/regenerates factory `.ts` files from sharedDeps gen metadata |
| `src/virtualModules/sharedEsmExports/index.ts` | **Generated** — do not edit directly |
| `src/virtualModules/sharedEsmExports/*.ts` | Factory files — now generatable; hand-edit still fine for one-offs |
| `src/virtualModules/virtualShared_preBuild.ts` | Consumes `getSharedEsmExportCode` |
| `src/esmExportEnumerator/` | This toolset |
| `msp_common/src/sharedDeps.ts` | Canonical list of shared packages + `gen` metadata for factory generator |

---

## Enumerator internals

### `resolvePackageEntry.mjs`
- Splits specifier into `packageName` + `subPath`
- Checks `workspacePackages` map first (name → absolute folder)
- Reads `package.json`, walks `exports[subPathKey]` condition tree
  (prefers `import` > `module` > `browser` > `default`)
- Falls back to `module` / `main` fields for root entry
- Handles `*` pattern matching in exports keys

### `collectEsmExports.mjs`
- **acorn** path: `ExportNamedDeclaration`, `ExportDefaultDeclaration`,
  `ExportAllDeclaration` — recursively follows `export * from './rel'`
- **ts-morph** path: `sourceFile.getExportedDeclarations()` — compiler follows
  all re-export chains; filtered to value-space only (excludes `TypeAlias`,
  `InterfaceDeclaration`) since types don't exist at runtime
- CJS detection: file is CJS if it has no `export ` at start of a line but
  contains `module.exports =` / `exports.x =` / `Object.defineProperty(exports`

### `enumeratePackageExports.mjs`
- **Workspace packages** → `dynamic-import` of built dist file
  (source `.ts` entry can omit things the compiled dist includes;
  `distUiLib/` is the runtime ground truth)
  - `findBuiltEquivalent()` maps `src/uiLib/foo.ts` → `distUiLib/foo.js`
    via the exports `types` field or `src/uiLib → distUiLib` substitution
- **npm packages** → static AST first; if CJS detected → `import()` fallback
- Returns consistent `EnumerationResult` with `strategy` tag

### `diffManifest.mjs`
- `diffManifest(specifier, liveNamed, existingEntry)` → `ManifestDiff`
- `formatDiff(diff, {verbose})` → ANSI coloured string
- `applyDiffToManifest(entries, diff, defaults)` → updated entries array
- New entries get auto-generated `factory` name (camelCase, `ExportCode` suffix)
  and `module` path from specifier (e.g. `@azure/msal-browser` → `./msalBrowser`)

---

## Known edge cases / watch-outs

- **`@mui/icons-material`** — thousands of exports, no `namedExports` in manifest
  currently (too large to enumerate explicitly; uses `defaultExportCode` fallback).
  The enumerator will correctly report all as `[NEW]` additions if run with `--write`.
  Decide whether to populate or keep as default.

- **`msp_ui_common/uiLib/comms`** — `serverRequests.tsx` uses `window`, so dynamic
  import fails in Node. The manifest entry only has `getAvailableFeatures`. If this
  sub-path gains new exports, they need manual addition.

- **`@emotion/react/jsx-runtime`** and **`@emotion/cache`** — not yet in the manifest.
  These are in `sharedDeps.ts` and will show as `[NEW]` on audit.

- **`@azure/msal-common`** — has a `/browser` and `/node` sub-path in its exports
  field. The root `.` entry resolves to the browser ESM. Check if consumers use
  the sub-paths.

- **React 19 additions** — `Activity`, `act`, `cache`, `cacheSignal`,
  `captureOwnerStack`, `unstable_useCacheRefresh`, `useEffectEvent` are present in
  the installed version but not in the manifest's `namedExports`. Run `--write` to
  add them if React 19 features are needed across MF remotes.

- **ts-morph project is reused** across files in a single run (lazy singleton).
  If adding large numbers of workspace packages, memory may grow. Reset between
  runs is automatic (process exits).

- **acorn, acorn-walk, ts-morph** are listed as `devDependencies` in
  `module-federation-vite/package.json` and imported with bare specifiers.
  Run `yarn` / `pnpm install` at the monorepo root after cloning.

---

## Factory file generator

`scripts/generate-factory-files.ts` generates/regenerates the per-package
`sharedEsmExports/*.ts` factory files from `gen` metadata in `sharedDeps.ts`.
Run with `tsx` (available at monorepo root `node_modules/.bin/tsx`).

### Mode lifecycle
`scan` → `imports` → `list` (inline exports) as a dependency matures.
- **`scan`** on adoption: enumerate everything, explore freely, no cost.
- **`imports`** once stable: list self-documents real usage; contracts as symbols
  fall out of use; new imports surface in review diffs.
- **`list` inline** when tightly encapsulated: explicit reviewed contract, never
  drifts without a deliberate edit.
Move back to `scan` after a major version bump to re-explore the new surface.

### gen.mode values

| mode | export source |
|------|--------------|
| `list` | `gen.exports` if set, else `registry.manifest.json` `namedExports` |
| `scan` | esmExportEnumerator AST walk (acorn / ts-morph) |
| `imports` | regex walk of `src/` across all monorepo workspaces (value imports only, `import type` excluded) |
| `default-only` | emits `return defaultExportCode()` — no pick block, no named exports |

### Key behaviours
- Preserves existing manifest `module` / `factory` names — only derives new names
  for truly new packages (avoids renaming e.g. `msalBrowser` → `azureMsalBrowser`).
- Shared factory files (two specifiers → same `module` path) are written once,
  subsequent specifiers in the same run are skipped.
- `--no-manifest` skips manifest updates (factory `.ts` files only).
- `gen` field on `sharedVersions` is tooling-only; the `sharedDeps` reduce strips
  it — MF runtime behaviour is unchanged.

### sentinel
Used as the module-detection key: `pick('sentinel')` is the guard condition for
choosing the right candidate from the unwrap chain. Falls back to `moduleFactory?.default ?? moduleFactory` when sentinel is falsy. Default: first named export.

### defaultDepth (1 | 3)
Controls `.default` unwrap depth for CJS interop. `1` for normal packages,
`3` for double-wrapped CJS (react, react-dom). Affects both fallbackCandidates
and candidates arrays.

See `scripts/generate-factory-files.usage.md` for full option reference.

---

## Typical workflows

### Auditing manifest drift
```sh
# 1. Check what's drifted
yarn workspace @module-federation/vite run audit:shared-esm-exports

# 2. Update manifest namedExports
yarn workspace @module-federation/vite run audit:shared-esm-exports:write

# 3. Regenerate factory files from updated manifest
yarn workspace @module-federation/vite run generate:factory-files

# 4. Rebuild index.ts
yarn workspace @module-federation/vite run generate:shared-esm-registry
```

### Adding a new shared package
```sh
# 1. Add to msp_common/src/sharedDeps.ts with a gen block
# 2. Run factory generator (creates factory .ts + manifest entry)
yarn workspace @module-federation/vite run generate:factory-files -- my-lib

# 3. Rebuild index.ts
yarn workspace @module-federation/vite run generate:shared-esm-registry

# 4. Optionally audit
yarn workspace @module-federation/vite run audit:shared-esm-exports my-lib
```
