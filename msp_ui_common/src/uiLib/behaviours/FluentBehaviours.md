# Fluent Behaviours Context

Last updated: 2026-03-07
Location: `msp_fes/src/uiLib/behaviours`

## Purpose
Create a functional fluent DSL for UI behaviours that compiles to `behaviourConfig` and is executed by the `Behaviour` React component.

The DSL builds typed `When -> Then` links between:
- Events: notifications that something happened.
- Requests: commands that ask subsystems to do something.

## Key Design Intent
- Mirror the fluent stack/unwind style used in `src/uiLib/renderEngine/UiPlan/ReUiPlanBuilder.ts`.
- Keep this system simpler than UiPlan builder.
- No extension system needed for behaviour DSL.
- Keep strong `RT` return types so chained builders can unwind safely.

## Messaging Model
Two high-level message classes:
- Events
  - UI interactions (click, input change).
  - Data change notifications.
  - Activity/API response notifications.
- Requests
  - Presentation subsystem requests.
  - Data subsystem requests.
  - Activity subsystem requests.

Pub-sub transport exists at:
- `src/uiLib/contexts/UiPubSub.ts`

Planned usage:
- Potentially two pub-sub instances: one for Events, one for Requests.

## Current Behaviour Files
- `src/uiLib/behaviours/fluentBehaviour.ts`
  - Contains initial fluent interfaces for behaviour authoring.
  - Includes `FluentBehaviour`, `EventHandlerBuilder`, and subsystem request builders.
- `src/uiLib/behaviours/behaviourConfig.ts`
  - Runtime config types consumed by behaviour engine/component.
- `src/uiLib/behaviours/Behaviour.ts`
  - React component that registers local custom components with render-engine context.

## Confirmed Corrections
- `behaviourAction.contra` is optional (undo/reverse action may exist, but does not require nested contra chains).
- `Behaviour.ts` `useEffect` has dependency array `[]` so registration runs once on mount and cleanup runs once on unmount.

## Existing Fluent Surface (as-is)
- `registerLocalComponent(component)`
- `withData(data)`
- `whenEventRaised(eventName)`
- Event guard methods:
  - `whenDataSatisfies(condition)`
  - `whenEventSatisfies(condition)`
- Request builders under `requestIsRaised`:
  - Presentation menus
  - Data subsystem
  - Activity subsystem

## Gaps To Resolve During Implementation
- Align fluent type `event` generic with real event payload types (currently event name uses `string` generic while predicate receives `E`).
- Define canonical request/event payload contracts shared between DSL and pub-sub transport.
- Decide whether nested behaviour elements (`innerElements`) represent:
  - grouped clauses, or
  - chained follow-up rules.
- Add builder factory implementation (currently interfaces only).
- Add unit tests for:
  - unwind stack typing (`RT`),
  - config generation,
  - request publication behavior,
  - contra/undo wiring.

## Proposed Incremental Build Plan
1. Stabilize runtime config shapes in `behaviourConfig.ts`.
2. Implement minimal concrete fluent builder factory in `fluentBehaviour.ts`.
3. Build compile step to `behaviourConfig` object.
4. Connect `Behaviour.ts` to event bus/request bus processing.
5. Add tests for typed chains and runtime behavior.
6. Expand subsystem request builders (presentation/data/activity).

## Integration Context
Behaviours are expected to be loaded via Module Federation from micro-services that may also provide:
- UI Plans,
- data views,
- activity integrations.

Cross-service calls are expected to flow through existing proxy infrastructure for CORS control and version selection.
