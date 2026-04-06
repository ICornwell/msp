# ESM Export Enumerator — Usage

Utilities for statically discovering named exports from ESM/CJS packages, and
keeping `registry.manifest.json` in sync with what packages actually export.

## Why this exists

MF's `loadShare` delivers module objects at runtime. The virtual `__loadShare__`
files must declare `export const X = ...` *statically* so bundlers can see them.
`export * from 'pkg'` is unreliable for CJS packages because esbuild can't
enumerate `module.exports = fn()` results ahead of time. The manifest is a
hand-curated (but auto-auditable) snapshot of runtime named exports.

---

## npm scripts (run from monorepo root or with `yarn workspace @module-federation/vite run …`)

```sh
# Diff current package exports against manifest — safe, read-only
yarn workspace @module-federation/vite run audit:shared-esm-exports

# Diff specific packages only
yarn workspace @module-federation/vite run audit:shared-esm-exports react @azure/msal-browser

# Write updated namedExports into registry.manifest.json
yarn workspace @module-federation/vite run audit:shared-esm-exports:write

# CI gate — exits 1 if any package has additions or removals
yarn workspace @module-federation/vite run audit:shared-esm-exports:check

# Dry-run: print the updated manifest without saving
node src/esmExportEnumerator/index.mjs --dry-run

# Show unchanged packages too
node src/esmExportEnumerator/index.mjs --verbose
```

After `--write`, regenerate `index.ts`:

```sh
yarn workspace @module-federation/vite run generate:shared-esm-registry
```

---

## Package list source

When no specifiers are given, the CLI reads specifier keys from:

```
msp_svr_common/src/sharedDeps.ts  →  sharedVersions  object
```

Regex-extracted — no TypeScript compilation required.

---

## Strategy per package type

| Entry file | Strategy | Notes |
|---|---|---|
| `.ts` / `.tsx` (workspace) | `dynamic-import` of built dist | Source may not re-export everything the build does; `distUiLib/` is ground truth |
| `.mjs` / `.js` with real ESM | `acorn` | Follows `export * from './rel'` recursively |
| `.mjs` wrapping CJS | `dynamic-import` | CJS wall detected (no `export` statements), falls back to `import()` + `Object.keys()` |
| Unresolvable | `unresolved` | Logged as warning, skipped |

CJS detection: file is flagged CJS if it contains `module.exports =`, `exports.x =`,
or `Object.defineProperty(exports,` **and** has no top-level `export` statement.

---

## Output format

```
[OK]        react                     ← matches manifest, shown only with --verbose
[UPDATED]   react                     ← diff follows
  + Activity
  + cache
  - useActionState                    ← removed from package since manifest was written
[NEW]       some-new-package          ← not yet in manifest
  + 12 exports: foo, bar, baz …
[UNRESOLVED] @scope/missing           ← package or entry not found
```

Colours: green = addition/new, red = removal/unresolved, yellow = updated, grey = ok.

---

## Module structure

```
src/esmExportEnumerator/
  index.mjs                  CLI entry point
  resolvePackageEntry.mjs    Resolve specifier → absolute entry path
  collectEsmExports.mjs      Static AST walk (acorn + ts-morph)
  enumeratePackageExports.mjs  Orchestrator (static → dynamic fallback)
  diffManifest.mjs           Diff + format + apply to manifest entries
  usage.md                   This file
  copilotContext.md          Working context for Copilot
```

---

## Adding a new shared package

1. Add the specifier to `msp_svr_common/src/sharedDeps.ts` → `sharedVersions`
2. Run `audit:shared-esm-exports:write` — a new entry is added to the manifest
   with auto-generated `module` / `factory` names
3. Create the factory file at the generated path (e.g. `sharedEsmExports/myPkg.ts`)
   — for packages needing the `pick()` pattern, copy from an existing factory file
4. Run `generate:shared-esm-registry` to rebuild `index.ts`
