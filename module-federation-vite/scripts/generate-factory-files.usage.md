# Factory File Generator — Usage

Generates and regenerates the per-package factory `.ts` files under
`src/virtualModules/sharedEsmExports/` from metadata stored in
`msp_svr_common/src/sharedDeps.ts`.

Each package entry in `sharedVersions` can carry a `gen` field that tells
the generator how to build that package's factory file.

---

## npm scripts

```sh
# Generate all packages (writes .ts files + updates manifest)
yarn workspace @module-federation/vite run generate:factory-files

# Preview changes without writing
yarn workspace @module-federation/vite run generate:factory-files:dry

# Single package or subset
yarn workspace @module-federation/vite run generate:factory-files -- react '@azure/msal-browser'

# After running, rebuild index.ts:
yarn workspace @module-federation/vite run generate:shared-esm-registry
```

---

## The gen metadata field

Add `gen` to any entry in `sharedVersions` in `msp_svr_common/src/sharedDeps.ts`:

```ts
'react': {
  version: '*', isEsm: false,
  gen: { mode: 'list', defaultDepth: 3, sentinel: 'createContext' },
},
```

`gen` is a discriminated union on `mode`:

---

### `mode: 'list'` — use the manifest's named export list

The default for most packages. Reads `namedExports` from `registry.manifest.json`
for this specifier. If you supply an inline `exports` array in the `gen` block,
that takes precedence over the manifest.

```ts
gen: {
  mode: 'list',
  sentinel: 'UiEventProvider',    // key used to detect a valid module candidate
  defaultDepth: 1,                 // CJS fallback chain depth: 1 or 3 (default 1)
  exports: ['Foo', 'Bar'],         // optional curated override; absent → read manifest
}
```

Use this when: the export list is already correct in the manifest, or you want to
pin a curated subset independent of what the package actually exports.

---

### `mode: 'scan'` — enumerate via AST

Runs the `esmExportEnumerator` (acorn/ts-morph) on the package entry point and
uses the live export list.

```ts
gen: {
  mode: 'scan',
  sentinel: 'PublicClientApplication',
}
```

Use this when: adding a new package and you want the full export list immediately
without hand-listing them. Also useful after a major version bump.

---

### `mode: 'imports'` — scan monorepo source

Walks every `src/` directory in the monorepo (excluding `module-federation-vite`
itself) and collects all value-space named imports from `import { ... } from 'pkg'`
statements. `import type` and inline `type` qualifiers are excluded.

```ts
gen: {
  mode: 'imports',
  sentinel: 'createContext',
}
```

Use this when: you only want to share symbols that are actively used in the repo —
not the full 200-export surface of a library.

---

### `mode: 'default-only'` — no named exports

Delegates entirely to `defaultExportCode()`. No `pick()` block, no named exports.
The emitted virtual module just exposes `export default`.

```ts
gen: { mode: 'default-only' }
```

Use this when: a package is consumed via `import Foo from 'pkg'` only (e.g. MUI,
emotion, icon libraries where you import the icons like `Foo.Bar`).

---

## sentinel

The `sentinel` key drives two things:

1. **Module detection** — `pick('sentinel')` is the condition used to confirm
   the loaded module is a real instance (not `undefined`). Prefer a distinctive
   value-space export that is always present.
2. **Default fallback** — if `pick(sentinel)` is falsy, the sharedModule falls
   back to `moduleFactory?.default ?? moduleFactory` (or deeper for `defaultDepth: 3`).

If you don't set `sentinel`, the first entry in `namedExports` is used automatically.

---

## defaultDepth

Controls how deep the CJS `.default.default` unwrap chain goes.

- `1` (default) — covers standard ESM-wrapped-CJS: `moduleFactory?.default`
- `3` — for double/triple-wrapped CJS like older react builds:
  `moduleFactory?.default?.default?.default`

Only needed for `react` and a few legacy CJS packages.

---

## Shared factory files

Two specifiers can share the same factory file. The generator detects this when
the manifest already points both specifiers to the same `module` path.
The file is written once; subsequent specifiers that share it are skipped.

Example: `msp_ui_common` and `msp_ui_common/uiLib` both use `./mspUiCommon`.

---

## Manifest + factory file sync

The generator writes two outputs per package:

1. **Factory `.ts` file** — the string-emitting function used at build time
2. **`registry.manifest.json` entry** — `namedExports` list used by the audit tool

Pass `--no-manifest` to skip manifest updates and only write the `.ts` files.

After any run, always regenerate `index.ts`:
```sh
yarn workspace @module-federation/vite run generate:shared-esm-registry
```

---

## Mode lifecycle — recommended progression

Modes aren't just alternatives — there's a natural progression as a dependency matures:

```
scan  →  imports  →  list (inline exports)
```

**`scan` on first adoption** — When you're not yet sure how much of a library
you'll use, enumerate everything. It costs nothing at runtime and gives you full
IDE autocomplete across remotes without having to think about what to allow.

**`imports` once use stabilises** — After the integration settles, switch to
`imports`. The list now self-documents what the codebase genuinely depends on.
It contracts automatically as symbols fall out of use (next time you run the
generator), and it makes accidental surface-area creep visible in code review
(a new import from the package shows up in the regenerated diff).

**`list` (inline `exports`) when encapsulation is tight** — If consumption is
deliberately encapsulated behind an adapter layer and you want an explicit,
reviewed contract, pin the list inline in `sharedDeps.ts`. It will never drift
without someone consciously editing it.

The direction always flows left to right as confidence increases. You'd only
move right to left (e.g. back to `scan`) when a major version bump lands and
you want to re-explore the new surface before committing to a subset.

---

## Adding a new shared package end-to-end

1. Add to `msp_svr_common/src/sharedDeps.ts`:
   ```ts
   'my-lib': {
     version: '*', isEsm: false,
     gen: { mode: 'scan', sentinel: 'MyMainExport' },
   }
   ```
2. Run the generator (will enumerate exports via AST and create the factory file):
   ```sh
   yarn workspace @module-federation/vite run generate:factory-files -- my-lib
   ```
3. Rebuild `index.ts`:
   ```sh
   yarn workspace @module-federation/vite run generate:shared-esm-registry
   ```
4. Optionally audit to confirm accuracy:
   ```sh
   yarn workspace @module-federation/vite run audit:shared-esm-exports my-lib
   ```
