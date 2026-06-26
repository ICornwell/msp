# Table Keyboard Navigation

## Why this exists

This note captures the intended keyboard behavior for table-like editing and proposes a clean architecture in `UniversalInput` so navigation logic is independent from display strategies (date, money, select, etc.), but still connected to them.

The main goal is to get Excel-like movement and editing behavior without duplicating logic across primitive components.

## Goals

- Add a dedicated key press strategy controller to `UniversalInput`.
- Keep keyboard navigation concerns separate from value formatting/parsing/adornments.
- Support two clear modes per cell:
  - read mode: focus is on the cell as a navigation target
  - edit mode: focus is inside content and cursoring is text-first
- Arrow navigation across cells when in read mode.
- Skip cells that are disabled or effectively read-only for navigation targets.
- Move left/right/up/down with predictable behavior.
- Work with scrolling and virtualization so off-screen targets can be reached.

## Non-goals (for first pass)

- Full Excel parity in one release.
- Formula engine behavior.
- Merged-cell semantics.
- Complex clipboard/range operations.

## Mental model

A table cell has two interaction states:

1. Navigation state (read mode)
- Cell has focus outline.
- Arrow keys move to adjacent navigable cells.
- Enter/F2 transitions to edit mode.
- Typing can optionally trigger edit mode with initial text insertion.

2. Editing state
- Input caret lives inside the control content.
- Left/right arrows move caret inside text (unless a boundary policy says "bubble to grid" at start/end).
- Escape cancels edit and returns to navigation state.
- Enter commits edit and returns to navigation state.
- Blur commits or cancels based on policy.

This split prevents the classic "am I moving cells or moving the cursor" ambiguity.

## Proposed architecture

### 1) New keyboard controller strategy in core

Add a strategy slot to `InputStrategy` (or an adjacent strategy object) focused only on keyboard behavior.

Suggested shape:

```ts
interface KeyboardNavigationContext {
  mode: 'readonly' | 'editing';
  inputHasFocus: boolean;
  textSelection?: { start: number; end: number };
  value: unknown;
  rawInput: string;
  metadata?: Record<string, unknown>;
  textInputRef?: React.RefObject<HTMLInputElement | null>;
}

type NavigationIntent =
  | { type: 'none' }
  | { type: 'enterEditMode' }
  | { type: 'exitEditMode'; commit: boolean }
  | { type: 'moveCell'; direction: 'left' | 'right' | 'up' | 'down'; reason?: string }
  | { type: 'requestOpenAdornment'; source: 'keyboard' };

interface KeyboardStrategy {
  onKeyDown?: (event: React.KeyboardEvent, ctx: KeyboardNavigationContext) => NavigationIntent;
  onFocus?: (ctx: KeyboardNavigationContext) => NavigationIntent;
  onBlur?: (ctx: KeyboardNavigationContext) => NavigationIntent;
}
```

Key idea: return intents, not side effects. `UniversalInput` (or parent table controller) executes intents.

### 2) Grid navigation service (outside individual primitives)

Create a table-level navigation coordinator responsible for:

- current focused cell coordinates
- edit vs navigation mode
- disabled/read-only map
- "next navigable cell" search
- scroll/virtualization integration

This keeps primitives small and avoids per-primitive duplicated movement logic.

### 3) Boundary policy

Define explicit policy for arrow keys while editing text:

- `contentFirst`: arrows always move caret in content while editing.
- `boundaryBubble`: if caret is at start and user presses Left, bubble as `moveCell(left)`; similarly at end + Right.

`boundaryBubble` gives the near-Excel feel.

### 4) Navigation eligibility

A cell is navigable if:

- visible in current model (or resolvable via virtualization index)
- not disabled
- not marked non-focusable

A cell may still be navigable even if value is read-only, depending on UX preference. If your intent is to skip read-only cells, that should be a table policy flag, not hardcoded behavior.

Suggested flag:

- `skipReadonlyCellsInNavigation: boolean`

## Keyboard behavior baseline

### Navigation state

- ArrowLeft/Right/Up/Down: move focus cell.
- Enter: enter edit mode.
- F2: enter edit mode.
- Tab/Shift+Tab: next/previous navigable cell (row-major).
- Home/End: first/last cell in row (optional phase 2).
- PageUp/PageDown: viewport-aware row jumps (phase 2).

### Editing state

- Enter: commit and return to navigation state.
- Escape: cancel and return to navigation state.
- Tab/Shift+Tab: commit and move next/previous cell.
- Arrow keys: caret movement; optional boundary bubble.

## Select controls tie-in

This architecture pairs cleanly with your new select strategies.

- In edit mode with dropdown open:
  - Up/Down navigates list/table rows.
  - Enter selects highlighted option.
  - Escape closes popup, remains in edit mode or returns to navigation (policy-based).
- In navigation mode:
  - Enter/F2 opens popup and enters edit mode.

## Scrolling and virtualization integration

This is the part that usually gets messy; a strict flow helps:

1. Keyboard strategy emits `moveCell(direction)`.
2. Grid coordinator computes target row/col in logical data space.
3. Virtualization adapter ensures target row is mounted (scroll if needed).
4. Once mounted, focus target cell wrapper.
5. If move originated from commit, pass commit status to target (if required).

Avoid direct DOM queries in primitive strategies; route through a table adapter API.

Suggested adapter surface:

```ts
interface GridViewportAdapter {
  ensureCellVisible: (row: number, col: number) => Promise<void> | void;
  focusCell: (row: number, col: number, mode?: 'navigation' | 'editing') => void;
  isCellMounted: (row: number, col: number) => boolean;
}
```

## Recommended phased rollout

1. Phase 1: intent plumbing
- Add keyboard strategy hooks and intent return handling in `UniversalInput`.
- No table movement yet; just enter/exit edit mode intents.

2. Phase 2: table coordinator
- Add move intents and row/col targeting.
- Skip disabled cells.

3. Phase 3: virtualization/scroller adapter
- Integrate ensure-visible and delayed focus after mount.

4. Phase 4: boundary bubble + advanced keys
- Add caret boundary behavior and Home/End/Page keys.

5. Phase 5: select/table-popup interactions
- Harmonize list/table popup keyboard semantics with grid mode.

## Testing strategy

- Unit: intent generation for key events by mode.
- Unit: next-cell finder (including skipping rules).
- Integration: keyboard traversal across mounted + unmounted rows.
- Integration: edit commit/cancel transitions.
- Accessibility checks: focus order, ARIA roles, announcement consistency.

## Thoughts and recommendations

- Keep a strict separation: display strategy decides rendering/parse/format; keyboard strategy decides intent only.
- Prefer a small finite-state-machine mindset (`navigation` vs `editing`) over ad-hoc booleans.
- Avoid coupling navigation to specific primitive internals; couple it to table coordinates and intent.
- Make policies explicit and configurable (`skipReadonly`, `boundaryBubble`, `tabCommits`).
- Start with deterministic behavior before "smart" behavior. Excel-like feel comes from consistency more than feature count.
- Virtualization race conditions are the main risk; solve those with a dedicated adapter and "ensure visible then focus" flow.

## Open decisions to settle before implementation

- Should read-only cells be focusable but non-editable, or fully skipped?
- On blur from edit mode, is default action commit or cancel?
- In select popups, does Escape close popup only, or also return to navigation mode?
- Is Tab in edit mode always commit-and-move, or configurable per column?

---

If this direction still matches your intent, the next practical step is to add minimal keyboard intent hooks to `UniversalInput` and wire a no-op table coordinator first, so future select and table controls can plug in without refactors.
