# ADR 0004: Up/down controls instead of a drag-and-drop library

**Status:** Accepted (Phase 4)

## Context

The brief asks for "drag-and-drop reordering where accessible" in the block editor, and separately
requires "an accessible drag-and-drop alternative in the editor." Pointer-based drag-and-drop
reordering is difficult to make fully keyboard- and screen-reader-operable without a library
purpose-built for it (e.g. `dnd-kit`), and verifying that accessibility layer correctly (focus
management, live-region announcements of position changes, touch support) is itself a significant
scope item.

## Decision

Ship a single reordering mechanism — up/down icon buttons on every block and every dialogue line —
rather than shipping drag-and-drop plus a separate accessible fallback. Every reorder action is a
regular, focusable `<button>` with an `aria-label` describing what it does, operable by keyboard,
screen reader, and touch identically.

## Alternatives considered

- **`dnd-kit` with a keyboard sensor** — the most faithful implementation of the literal brief
  text, but adds a dependency and a meaningfully larger testing surface (pointer events, keyboard
  sensor, collision detection, live-region announcements) for a content model where episodes
  typically have on the order of 10-20 blocks — a scale where "move to position N" via two or three
  button presses is not a meaningful workflow regression versus dragging.
- **A "move to position" numeric input** — considered and rejected as less discoverable than
  up/down buttons for the common case (nudging a block one or two positions).

## Consequences

- Reordering is slightly more clicks for a large jump (e.g. moving block 1 to position 15) than a
  drag would be. If episodes grow substantially longer in practice, revisit with `dnd-kit`,
  layering it on top of the existing up/down buttons (which would then become the required
  accessible alternative the brief also asks for) rather than replacing them.
- Every reorder control is exercised the same way by mouse, keyboard and assistive technology,
  which simplifies the Phase 7 accessibility review to "do these buttons have correct labels and
  focus order" rather than a full drag-and-drop audit.
