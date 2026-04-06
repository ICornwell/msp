# uiLib Architecture — Context for Developers & Agents

Location: `msp_ui_common/src/uiLib/`
Last updated: 2026-03-25

This file is the primary reference for understanding how the uiLib communication
model works. Read this before touching any behaviour, context, or event-related code.

---

## The Four Patterns

Everything in uiLib flows through exactly four patterns. Understanding them prevents
the most common architectural mistakes.

### 1. UIEvent — "Something happened"

- **Published by**: leaf UI components, subsystem providers (after completing work)
- **Subscribed by**: `Behaviour` components **only** — nothing else subscribes
- **Transport**: `UiEventContext` / `UiPubSub`
- **Hook for publishing** (in leaf components / subsystems): `useUiEventPublisher().raiseUiEvent(...)`
- **Internal subscription hook** (Behaviour.ts only): `useUiEventContext().subscribe(...)`

UIEvents are fire-and-forget notifications. They carry no expectation of handler.
Examples: `UserChanged`, `DataLoaded`, `ActivityFailed`, `MenuItemClick`, `PresentationRequest`.

### 2. Dispatch — "Do this"

- **Issued by**: `Behaviour` components **only** (via the fluent DSL)
- **Received by**: the named subsystem provider (via React context, not the event bus)
- **Pattern**: Behaviour dispatches → subsystem acts → subsystem raises UIEvents on completion

Dispatch is a direct async call to a subsystem. It does not traverse the UIEvent bus.
The subsystem provider is responsible for outcomes; it raises UIEvents to notify everyone.

### 3. Private context — Subsystem-internal state

Not a bus. Subsystem-internal state shared between a provider and its direct consumers
(e.g. DataCacheContext, render engine contexts).
Behaviours do not reach into private contexts directly.

### 4. localEffect — Co-located React state

A behaviour-declared side-effect that runs directly in the Behaviour component, with
no bus traversal. Use this to update React state that lives in the same feature hook.

```typescript
.whenEventRaised('DataLoaded')
  .localEffect((event) => setUserData(event.payload?.data))
  .end()
```

State-setter refs from `useState` are stable, so it is safe to close over them inside
`useMemo` without listing them as deps (they satisfy the referential stability guarantee).

---

## What NOT to do

| Mistake | Why it's wrong | What to do instead |
|---|---|---|
| Subscribe to UIEvents in a subsystem provider | Only Behaviours subscribe | Have Behaviour dispatch to the subsystem |
| Call `raiseUiEvent` from inside a `Behaviour` config | Behaviour is a subscriber; it dispatches to subsystems which then raise events | Use `.dispatch.toActivity/toMenus/toPresentation/toData` |
| Call `useUiEventContext().subscribe(...)` outside `Behaviour.ts` | Violates the single-subscriber rule | Use `Behaviour` with config |
| Hold subsystem dispatch hooks outside `BehaviourDispatchProvider` | Would duplicate wiring and break the provider contract | Add any new subsystem dispatch wiring to `BehaviourDispatchProvider` |
| Omit `useMemo` around `createBehaviour()...build()` | Config reference changes every render → subscriptions teardown/re-register on every render | Always `useMemo` with stable setter refs as deps |

---

## Provider Tree

Required nesting order (outermost first):

```
UiEventProvider
  DataCacheProvider
    ActivityDispatchProvider        ← HTTP gateway to service layer
      MenuDispatchProvider          ← menu management
        PresentationDispatchProvider  ← navigation / blade control
          BehaviourDispatchProvider   ← wires subsystem hooks into registry
            <feature content>
              <Behaviour config={config} />
```

`BehaviourDispatchProvider` must be **inside** all subsystem providers — it calls
their hooks at mount time to build the handler registry.

---

## Subsystem Providers

### ActivityDispatchProvider
File: `contexts/ActivityDispatchContext.tsx`
- Receives: `callActivity(request)` from `BehaviourDispatchProvider`
- Does: HTTP `PUT /api/v1/service/run` with `ServiceRequestEnvelope`
- Raises: `DataLoaded` UIEvent on success, `ActivityFailed` UIEvent on error

### MenuDispatchProvider
File: `contexts/MenuDispatchContext.tsx`
- Receives: `dispatch(MenuDispatchRequest)` from `BehaviourDispatchProvider`
- Does: raises `MenuRequest` UIEvent so `AppMenu` and similar components can react

### PresentationDispatchProvider
File: `contexts/PresentationDispatchContext.tsx`
- Receives: `dispatch(PresentationDispatchRequest)` from `BehaviourDispatchProvider`
- Does: raises `PresentationRequest` UIEvent so shell and blade components can react

### DataCacheProvider
File: `contexts/DataCacheContext.tsx`
- Receives: `invalidate(type, key)` / `save(type, key, data)` from `BehaviourDispatchProvider`
- Private state: internal cache map shared with data-consuming components

---

## BehaviourDispatchProvider

File: `behaviours/BehaviourHandlerRegistryContext.tsx`

The **only** place all four subsystem dispatch hooks are called. Builds a
`Map<eventType, ActionHandler>` that `Behaviour.ts` consults at runtime.

Built-in handlers:

| eventType | Target |
|---|---|
| `ServiceCallRequest` | `ActivityDispatchProvider.callActivity(...)` |
| `MenuRequest` | `MenuDispatchProvider.dispatch(...)` |
| `PresentationRequest` | `PresentationDispatchProvider.dispatch(...)` |
| `DataRequest` | `DataCacheContext.invalidate / save` |

To extend the registry for a sub-tree (e.g. a remote micro-frontend):

```tsx
<BehaviourHandlerRegistryProvider handlers={new Map([['MyCustomEvent', handler]])}>
  {children}
</BehaviourHandlerRegistryProvider>
```

---

## Fluent DSL — Quick reference

Entry point: `createBehaviour()` from `msp_ui_common/uiLib`

```typescript
const config = useMemo(() =>
  createBehaviour()
    .whenEventRaised('SomeEvent')               // UIEvent type to listen for
      .whenEventSatisfies(e => e.payload?.x)    // optional guard
      .whenDataSatisfies(d => !!d)              // optional data guard
      .dispatch.toActivity
        .callAsync({ id, action: 'ns/name/ver', payloadFromEvent })
        .end()
    .whenEventRaised('AnotherEvent')
      .dispatch.toMenus.add(menuItem).end()
    .whenEventRaised('YetAnother')
      .dispatch.toPresentation.openBlade('BladeName').end()
    .whenEventRaised('DataLoaded')
      .localEffect(e => setMyState(e.payload?.data))
        .end()
    .build()
, [setMyState]);

// Use in a React component:
return <Behaviour config={config} />;
```

Full DSL reference: `behaviours/FluentBehaviours.md`
Interface contracts: `behaviours/fluentBehaviour.ts`

---

## Publishing UIEvents from leaf components

```tsx
import { useUiEventPublisher } from 'msp_ui_common/uiLib';

const { raiseUiEvent } = useUiEventPublisher();

raiseUiEvent({
  messageType: 'UserChanged',
  payload: { userId: '123' },
  timestamp: Date.now(),
});
```

`raiseUiEvent` is the public surface. The internal `publish` function on
`useUiEventContext()` is `@internal` — do not call it directly.

---

## Module Federation notes

Behaviours are often authored in remote micro-frontends (`msp_actorwork`,
`msp_datahub`, etc.) and loaded into the host (`msp_fes`) via MF.
The provider tree is set up in the host's `app.tsx`; remotes author behaviour
hooks and configs only — they do not mount providers.

Shared deps (React, contexts, etc.) must be aligned in `vite.config.mjs`
`federation({ shared: ... })` across host and remotes. The MF plugin's
`BehaviourDispatchProvider` in the host is the single source of truth for
handler wiring.
