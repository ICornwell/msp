# MSP Platform — msp_ui_common

_April 2026_

The shared UI library. Consumed by `msp_fes` (shell) and all remote UI modules.
Published via the `distUiLib/` build output — import from `msp_ui_common`.

---

## Behaviour system

Behaviours are the unit of feature logic in the UI. A Behaviour:

1. Mounts as a React component (stateless itself, but uses hooks/contexts)
2. On mount — registers menus, nav items, tab/blade content via dispatch contexts
3. On unmount — cleans up everything it registered via `clearContextOwner`

```tsx
// Creating a behaviour
const MyBehaviour = createBehaviour({
  contextOwnerId: 'my-module:my-feature',  // unique, stable ID
  setup(dispatch) {
    dispatch.menu.add({ menuId: 'my-action', label: 'My Action', menuTarget: 'main' });
    dispatch.navTree.add({ navItemId: 'my-nav', label: 'My Feature', containerNavItem: NAV_ANCHORS.MODULES });
  }
});
```

`contextOwnerId` is the key that ties all registered items together.
When the behaviour unmounts, a single `clearContextOwner` dispatch removes
everything it registered across Menu, NavTree, and Presentation contexts.

**`BehaviourDispatchProvider`** wraps the behaviour component and provides
access to all dispatch contexts. This is the only sanctioned place for
behaviour-level dispatch calls — leaf UI components must not use dispatch
contexts directly to register shell items.

---

## Dispatch contexts

All shell state is driven through these contexts. They are provided by the
shell (`msp_fes`) and consumed by behaviours and the shell's own components.

| Context | Hook | Purpose |
|---|---|---|
| `MenuDispatchContext` | `useMenuDispatch()` | Add/remove/update top menu and profile menu items |
| `NavTreeDispatchContext` | `useNavTreeDispatch()` | Add/remove nav tree items (recursive, supports `containerNavItem`) |
| `PresentationDispatchContext` | `usePresentationDispatch()` | Open/close tabs and blades |
| `ActivityDispatchContext` | `useActivityDispatch()` | Dispatch server activities (stateless) |
| `DataCacheContext` | `useDataCacheContext()` | Access cached view data |
| `UiEventContext` | `useUiEventPublisher()` / `useUiEventSubscriber()` | PubSub for UI events (navigation clicks, session changes, etc.) |
| `UserSessionContext` | `useUserSession()` | Current user session info |

### `clearContextOwner`

All mutable contexts (`Menu`, `NavTree`, `Presentation`) support a
`clearContextOwner` request type. When dispatched with a `contextOwnerId`,
all items registered under that ID are removed atomically.

---

## Render engine

The render engine (`Re`) is a data-driven UI plan system. Behaviours declare
UI structures as data (`ReUiPlan`) rather than directly rendering JSX.
The render engine interprets the plan and renders the appropriate components.

This allows behaviours to describe UI without depending on the specific
component implementations — the platform can evolve components independently.

---

## Theme extensions

`ThemeExtensions.ts` exports `MspCustomThemeOptions` and `Sizing`, and
declares a module augmentation on `@mui/material/styles` that adds
`theme.mspCustom` to MUI's `Theme` and `ThemeOptions` types.

This augmentation is active automatically in any package that imports from
`msp_ui_common` — no local `declare module` needed in the consuming package.

```ts
// In a styled component in any package that uses msp_ui_common:
const StyledBox = styled(Box)(({ theme }) => ({
  height: theme.mspCustom?.sizing?.heights?.containerTitles?.sm,
}));
```

---

## Component library

Components are in `src/uiLib/components/`:

| Component | Purpose |
|---|---|
| `TabStrip` | Renders the tab strip; driven by `usePresentationTabSet()` |
| `AppMenu` | Renders a menu; driven by `useMenuDispatch()`; takes a `menuTarget` prop |
| `NavigationTree` | Renders the nav tree; driven by `useNavTreeDispatch()` |
| `ServiceDispatcher` | Dispatches server Activities from UI context |
| Preset components | `PresetTextComponent`, `PresetNumberComponent`, etc. — render engine primitives |

---

## Build outputs

| Output | Consumed by |
|---|---|
| `distUiLib/` | msp_fes (shell components), msp_actorwork, future remotes |
| `dist/` | (server-side if applicable) |

Build: `yarn workspace msp_ui_common run build`
