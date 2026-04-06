# Fluent Behaviours

Last updated: 2026-03-25
Location: `msp_ui_common/src/uiLib/behaviours/`

## Purpose

A typed fluent DSL that compiles to `behaviourConfig` at build time and is
executed at runtime by the `Behaviour` React component.

The DSL declares **When → Then** rules:
- **When** — a UIEvent of a given type is raised (with optional guards)
- **Then** — dispatch a call-to-action to one subsystem, or run a local side-effect

---

## The Four Patterns

| Pattern | What it is | Who publishes | Who subscribes |
|---|---|---|---|
| **UIEvent** | "Something happened" alert | Any leaf component or subsystem provider | Only `Behaviour` components |
| **Dispatch** | "Do this" call-to-action | Only `Behaviour` (via DSL) | The target subsystem provider |
| **Private context** | Subsystem-internal state | Subsystem provider | Same provider's consumers |
| **localEffect** | Direct side-effect on co-located React state | `Behaviour` (via DSL) | n/a — no bus |

> **Rule:** Leaf components and subsystems only _publish_ UIEvents — they never
> subscribe. Only Behaviours subscribe, and only Behaviours dispatch.

---

## DSL Surface

```typescript
createBehaviour()
  // ── declare a rule ────────────────────────────────────────────────
  .whenEventRaised('UserChanged')          // trigger: UIEvent type
    .whenEventSatisfies(e => ...)          // optional: event payload guard
    .whenDataSatisfies(d => ...)           // optional: local data guard

    // dispatch to a subsystem — builder is fluent, `.end()` unwinds the stack
    .dispatch.toActivity
      .callAsync({ id, action, payloadFromEvent, contextFromEvent })
      .end()

    // or dispatch to menus
    .dispatch.toMenus
      .add({ id, label, eventName, action })
      .remove(...)  .enable(...)  .disable(...)
      .end()

    // or dispatch to presentation
    .dispatch.toPresentation
      .openBlade('MyBladeName', paramsOrFactory)
      .closeBlade(...)  .openTab(...)  .closeTab(...)  .navigate(...)
      .end()

    // or dispatch to data cache
    .dispatch.toData
      .invalidate(dataId)          // evict from cache
      .save(dataId, changeFn)      // apply transform + notify
      .end()

    // or — for co-located React state — a local side-effect (no bus)
    .localEffect((event, data) => setBladeOpen(true))
      .end()

  .build()   // → behaviourConfig
```

Multiple `.whenEventRaised(...)` chains can be chained on the same builder before
calling `.build()`. Each becomes an independent element in `behaviourConfig.elements`.

---

## ActivityCallDefinition

```typescript
type ActivityCallDefinition<E> = {
  id: string;
  label?: string;
  /** Fully-qualified path: namespace/activityName/version */
  action: string;
  payload?: any;
  payloadFromEvent?: (event: E) => any;
  context?: string;
  contextFromEvent?: (event: E) => string | undefined;
};
```

The `BehaviourDispatchProvider` splits `action` on `/` to produce
`namespace / activityName / version` for the `ActivityDispatchProvider`.

---

## Runtime execution — `Behaviour.ts`

The `<Behaviour config={config} initialData={data} />` React component:

1. Registers any `localCustomComponents` with the render engine context.
2. For each `behaviourElement`, subscribes to the UIEvent bus filtered by `eventType`.
3. On each matching event, evaluates `eventCondition` and `dataCondition` guards.
4. For each action in `element.actions`:
   - `kind === 'localEffect'` → calls `action.effect(event, data)` directly.
   - Otherwise → looks up `action.eventType` in the `BehaviourHandlerRegistry` and
     calls the handler, which dispatches to the appropriate subsystem provider.

---

## Provider tree requirements

Behaviours need the subsystem providers to be mounted above them:

```
UiEventProvider
  DataCacheProvider
    ActivityDispatchProvider
      MenuDispatchProvider
        PresentationDispatchProvider
          BehaviourDispatchProvider   ← wires subsystem hooks into the handler registry
            <feature components / Behaviour instances>
```

`BehaviourDispatchProvider` is the **only** place the subsystem dispatch hooks
(`useActivityDispatch`, `useMenuDispatch`, `usePresentationDispatch`, `useDataDispatch`)
are called. It builds the handler registry that `Behaviour.ts` reads.

For sub-tree overrides use `BehaviourHandlerRegistryProvider` — it merges
additional handlers on top of the parent registry.

---

## Key files

| File | Role |
|---|---|
| `fluentBehaviour.ts` | Interface contracts for the DSL (`FluentBehaviour`, `EventHandlerBuilder`, `DispatchSurface`, subsystem builders) |
| `behaviourBuilder.ts` | Concrete factory — `createBehaviour()` entry point |
| `behaviourConfig.ts` | Runtime config types (`behaviourConfig`, `behaviourElement`, `behaviourAction`) |
| `Behaviour.ts` | React component — subscribes to UIEventbus and fan-outs to handlers |
| `BehaviourHandlerRegistryContext.tsx` | `BehaviourDispatchProvider` builds the handler Map; `BehaviourHandlerRegistryProvider` for sub-tree overrides |

---

## Complete example (from UserBladeBehaviour.ts)

```typescript
export const useUserProfileBehaviour = () => {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [bladeOpen, setBladeOpen] = useState(false);

  const config = useMemo(() => createBehaviour()
    // 1. Fetch user data when the user changes
    .whenEventRaised('UserChanged')
      .dispatch.toActivity
        .callAsync({
          id: 'getUserProfile',
          action: 'actorwork/GetUserProfileData/1.0.0',
          payloadFromEvent: (e: any) => ({ userId: e.payload?.userId }),
        })
        .end()
    // 2. Store result in local state once loaded
    .whenEventRaised('DataLoaded')
      .whenEventSatisfies((e: any) => e.payload?.dataType === 'GetUserProfileData')
      .localEffect((e: any) => setUserData(e.payload?.data))
        .end()
    // 3. Add a menu entry
    .whenEventRaised('DataLoaded')
      .whenEventSatisfies((e: any) => e.payload?.dataType === 'GetUserProfileData')
      .dispatch.toMenus
        .add({ id: 'user-profile-menu', label: 'See User Profile', eventName: 'MENU', action: 'openUserProfile' } as any)
        .end()
    // 4. Open the blade on menu click
    .whenEventRaised('MenuItemClick')
      .whenEventSatisfies((e: any) => e.payload?.menuId === 'user-profile-menu')
      .dispatch.toPresentation
        .openBlade('UserProfileBlade', (e: any) => ({ context: e.payload?.context }))
        .end()
    // 5. Sync blade open/close state locally
    .whenEventRaised('PresentationRequest')
      .whenEventSatisfies((e: any) => e.payload?.requestType === 'openBlade' && e.payload?.target === 'UserProfileBlade')
      .localEffect(() => setBladeOpen(true))
        .end()
    .whenEventRaised('PresentationRequest')
      .whenEventSatisfies((e: any) => e.payload?.requestType === 'closeBlade' && e.payload?.target === 'UserProfileBlade')
      .localEffect(() => setBladeOpen(false))
        .end()
    .build()
  , [setUserData, setBladeOpen]);

  return { config, userData, bladeOpen, setBladeOpen };
};
```

The hook is consumed by the feature component:

```typescript
export const UserProfileFeature = () => {
  const { config, userData, bladeOpen, setBladeOpen } = useUserProfileBehaviour();
  return <Behaviour config={config} />;
};
```
