# MSP Platform — UX Structure Guide

_April 2026_

---

## 1. Shell Layout

The application shell provides a fixed chrome that all feature modules inhabit.
It is not owned by any module — it is platform infrastructure.

```
┌─────────────────────────────────────────────────────────────────┐
│  [ Top Menu ]                              [ User Profile Menu ] │
├──────────┬──────────────────────────────────────────────────────┤
│          │  [ Tab Strip ]                                        │
│  NavTree ├───────────────────────────────────────────────────────┤
│          │ [Page Bar] │  Main Content Area         │  [Blade]    │
│          │            │                            │             │
│          │            │  [ Info Panel (LHS/Bottom)]│             │
└──────────┴────────────┴────────────────────────────┴─────────────┘
```

### Shell regions

| Region | Description |
|---|---|
| **Top Menu** | Global actions, platform-level navigation. Module behaviours add items via `MenuDispatchContext` (target: `main`) |
| **User Profile Menu** | Session, preferences, logout. Platform-owned; modules may add items (target: `profile`) |
| **NavTree** | Hierarchical navigation driven by `NavTreeDispatchContext` (see §3) |
| **Tab Strip** | Open work/views driven by `PresentationDispatchContext` (see §4) |
| **Page Bar** | LHS strip within the active tab for page navigation (see §4) |
| **Main Content Area** | Renders the active page of the active tab |
| **Blade** | RHS panel for parameterised actions (see §5) |
| **Info Panel** | LHS or bottom slide-in for contextual detail/editing (see §6) |

All shell regions are driven exclusively via dispatch contexts.
No module component owns or renders shell chrome directly.

---

## 2. Work Model

See [domain/WORK_MODEL.md](../domain/WORK_MODEL.md) for the full domain model.

### Summary for UX purposes

```
File  (long-lived record — Policy, Customer, Claim, Broker…)
 └─ Case  (piece of work toward an outcome; primary File)
     └─ Task  (unit of work; primary Case + primary File)
```

Each entity type has its own default tab view plus optional specialised pages
(see §4).

---

## 3. Navigation Tree

### Anchor structure

The NavTree has a fixed set of root-level anchors. Module behaviours register
items *into* anchors — they do not create new roots. This keeps the top-level
shape consistent and learnable regardless of which modules are loaded.

| Anchor ID (`NAV_ANCHORS.*`) | Label | Purpose |
|---|---|---|
| `nav:work` | Work | Open Files, Cases, Tasks — the user's current work queue |
| `nav:modules` | Modules | Feature entry points registered by remote module behaviours |
| `nav:pinned` | Pinned | User bookmarks / shortcuts (user-persisted, future) |
| `nav:admin` | Admin | Settings, configuration — shown conditionally by participation |
| `nav:help` | Help | Always present, platform-level |

`NAV_ANCHORS` constants are exported from `NavTreeDispatchContext`.
Behaviours reference these rather than hardcoding strings.

### Work entry point

The `nav:work` section adapts to the user's primary work role:

| Role | Default entry |
|---|---|
| **Task worker** | Task queue (assigned to me, sorted by SLA) |
| **Case worker** | Case list (cases I own / participate in) |
| **File owner** | File browse/search |

The platform provides an assigned default. Contextual deduction based on
usage patterns is a future enhancement. Users can override their default.

### Opening work from the NavTree

Clicking a File, Case, or Task in the NavTree opens a Tab:

- If that File is already open → navigate to that tab (to relevant page if applicable)
- If not open → open a new tab at the primary page for that entity type

Some Task types may open directly to a specific page within the File tab
to enable focused task entry without requiring a full file review first.

### How the NavTree is driven

`NavTreeDispatchContext` is the sole API for populating the tree.
Module behaviours register items on load and remove them via
`clearContextOwner` on unload. `NavigationTree` is a pure renderer
with no hardcoded structure.

---

## 4. Tabs and Pages

### Tab lifecycle

Tabs are opened by behaviours via `PresentationDispatchContext.dispatch`.
Each tab has a `contextOwnerId` so it can be cleaned up when a behaviour
unloads. Closing a dirty tab (see §7) prompts a warning.

### Page structure

Each tab contains one or more **Pages**, navigated via a LHS Page Bar.
Pages are declared by the behaviour that opens the tab.

Pages are built from:
- **Blocks** — reusable business UI widgets arranged in a grid layout
- Or a single Block occupying the whole page for complex specialised views

Block and grid definitions are registered by behaviours — the page renderer
is data-driven.

### Display modes

A user-preference toggle (optionally persisted) controls how Pages render:

| Mode | Behaviour |
|---|---|
| **Discrete** | One page visible at a time; Page Bar switches between them |
| **Long scroll** | All pages in a single vertical scroll; Page Bar jumps to section |

Pages can declare `scrollEligible: false` to opt out of long-scroll mode
(e.g. pages with their own internal scrolling). Ineligible pages always
render as discrete regardless of the user's toggle.

---

## 5. Blade — Parameterised Actions

The Blade is the platform mechanism for users to provide parameters to actions.
It slides in from the right of the main content area.

### Triggering

Any navigation or interaction element (menu item, NavTree item, button) can
invoke an action. If the action accepts parameters, the trigger label carries
a `...` suffix (e.g. "Create Case…", "Assign Task…"). Non-parameterised
actions execute directly without opening the Blade.

### Width

The Blade renders at one of six widths (1–6), representing 1/6th increments
of the main content area:

| Width | Use case |
|---|---|
| 1–2 | Simple confirmations, single-field inputs |
| 3–4 | Standard parameterisation forms |
| 5–6 | Complex actions, multi-section forms, data entry |

The behaviour sets the preferred width when dispatching `openBlade`.
The user may adjust width at runtime.

### Action types

| Type | Behaviour | Visual treatment |
|---|---|---|
| **Persistent** | Calls a server Activity that saves to persistence | Standard confirmation |
| **Ephemeral** | Calls a server Activity; result returned as unsaved UI state | Distinct "unsaved results" indicator |

Ephemeral results become unsaved state on the current tab (see §7).

---

## 6. Info Panels

Info Panels are slide-in sections providing supplementary detail or allowing
inline editing of values in the main content area. Distinct from Blade Actions:

- **No server round-trip** — changes are UI-side only, governed by behaviours/rules
- **Not parameterised actions** — they are detail/edit affordances on existing displayed content

### Behaviour

- One Info Panel open at a time
- Slides in from LHS or Bottom — determined by content type; may be user-optional
- A page declares its supported Info Panels; `ℹ` buttons next to relevant content trigger them
- When open, if the page supports multiple panels, a dropdown in the panel chrome
  allows flipping between them without going back to the page content

Opening an Info Panel and editing puts the current tab into unsaved state (see §7).

---

## 7. Unsaved State

A tab carries a single dirty flag raised by either:
- An **ephemeral Action** returning unsaved results via the Blade
- **Info Panel** edits not yet committed

**Rules:**
- Platform warns when closing a dirty tab — no other navigation warns or discards state
- Pages within a dirty tab remain accessible; state is maintained across page switches
- Point-by-point unwind (undo stack) is a future aspiration — the architecture
  must not preclude it

The visual treatment of dirty tabs and their content is TBD but must be unambiguous.

---

## 8. Extensibility Principles

These principles govern how future modules extend the platform UX without
breaking consistency:

1. **No new NavTree roots without platform agreement** — modules populate existing anchors
2. **Behaviour declares, platform renders** — no module owns shell chrome directly
3. **`clearContextOwner` on unload** — behaviours clean up all menus, nav items, and tabs they registered
4. **`...` suffix on parameterised triggers** — universal convention, no exceptions
5. **`scrollEligible: false` for incompatible pages** — declare rather than assume
6. **Participation-based permissions** — no module implements its own role checks;
   all access control flows through the platform participation model (see [domain/PERMISSIONS.md](../domain/PERMISSIONS.md))

---

## 9. Open / Deferred Decisions

| Decision | Status |
|---|---|
| User preference persistence (nav default view, page mode toggle) | Deferred — implement when user profile persistence is in place |
| Info Panel LHS vs Bottom heuristics | To be determined by usage; may become user-configurable |
| `nav:work` contextual role deduction | Deferred — start with assigned default |
| Unsaved state visual treatment (dirty indicator design) | TBD |
| Point-by-point unwind / undo stack | Future aspiration |
| Agent Actor interaction patterns in UI | Not yet designed |
