# MSP Platform — msp_fes

_April 2026_

The frontend shell. Acts as the Module Federation **host** and provides
the application chrome (shell layout, routing, auth, theme).

---

## Responsibilities

- Serve the shell layout (NavTree, Tab Strip, Blade, menus)
- Host shared MF deps (React, MUI, etc.) — single source of truth for singletons
- Authenticate the user via MSAL (Azure AD / Entra ID)
- BFF: attach tokens and proxy UI API calls to ServiceHub
- Load and initialise remote MF modules

---

## Key files

| File | Purpose |
|---|---|
| `vite.config.mjs` | MF host config, shared deps, BFF plugin |
| `uiApiProxyHandler.ts` | BFF handler — token attachment, ServiceHub proxy |
| `src/ui/theme.ts` | MUI theme creation with `mspCustom` design tokens |
| `src/App.tsx` | Root component — auth guard, shell providers, MF remote loading |
| `src/ui/` | Shell UI components (layout, nav, menus) |

---

## Module Federation host config

```js
// vite.config.mjs (simplified)
federation({
  name: 'host',
  shared: { ...sharedDeps }  // from msp_common
})
```

- All shared deps are in `optimizeDeps.include` — pre-bundled by Vite
- `noDiscovery: true`, `holdUntilCrawlEnd: false`
- Remotes are loaded at runtime, not declared statically in vite config

---

## BFF

The BFF (`uiApiProxyHandler.ts` + `vite-plugin-mix`) runs as a Node
server alongside the Vite dev server. In production it becomes the sole
Node process.

Responsibilities:
- Validate the user's MSAL session cookie
- Attach bearer token to outbound calls to ServiceHub
- Route `/api/**` requests appropriately

Build: `yarn workspace msp_fes run build:bff`
Start with BFF: `yarn workspace msp_fes run start`
Dev without BFF: `yarn workspace msp_fes run dev`

---

## Theme

The theme is defined in `src/ui/theme.ts` using `createTheme` from MUI.
Platform design tokens are on `theme.mspCustom.sizing` (typed via
`MspCustomThemeOptions` from `msp_ui_common`).

The `ThemeExtensions` type augmentation travels from `msp_ui_common` via
the `.d.ts` chain — no local `declare module` needed in `msp_fes`.

---

## Shell context providers

The shell wraps the application in all platform context providers:

```tsx
<UiEventProvider>
  <UserSessionProvider>
    <MenuDispatchProvider>
      <NavTreeDispatchProvider>
        <PresentationDispatchProvider>
          {/* shell layout + remote feature loading */}
        </PresentationDispatchProvider>
      </NavTreeDispatchProvider>
    </MenuDispatchProvider>
  </UserSessionProvider>
</UiEventProvider>
```

Remote modules receive these contexts via the shared MF singleton scope —
they do not need their own providers.

---

## Adding a new remote module

1. Add the remote's URL to the MF runtime config (loaded at runtime, not in vite config)
2. Create a lazy-loaded wrapper component that imports the remote's exposed feature
3. Wrap with `<BehaviourDispatchProvider>` and `<BehaviourHandlerRegistryProvider>`
4. Mount the feature — its Behaviour registers its shell items on mount

No shell code needs to know the details of the remote's UI.
