# ADR 0002: Official MongoDB driver + structured content blocks

**Status:** Accepted (Phase 1 decision, implemented in Phase 2)

## Context

The brief explicitly forbids storing an episode as one uncontrolled HTML string and asks for a
discriminated-union content-block model validated independently per block type. It allows either
Mongoose or the official driver.

## Decision

Use the **official `mongodb` Node.js driver** directly, with Zod as the single source of truth for
shape validation, and plain TypeScript types (often inferred with `z.infer`) for compile-time
shape. Repositories (`src/repositories`) encapsulate all collection access.

Episodes store `contentBlocks: ContentBlock[]`, where `ContentBlock` is a Zod discriminated union
keyed on `type` (`scene | dialogue | narration | flashback | concept | formula | example | quiz |
summary | homework | teaser | ...`). Each variant has its own schema; `parseContentBlock` validates
one block at a time so a single malformed block produces a precise error instead of rejecting an
entire episode.

## Alternatives considered

- **Mongoose** — gives schema-level validation and a familiar active-record-ish API, but its
  validation would duplicate what Zod already does at the API boundary (every write already goes
  through a Zod-validated Server Action/route handler), and its TypeScript typing for discriminated
  unions inside a nested array is considerably more awkward than a plain Zod schema + driver
  approach. Mongoose also adds schema-cast "magic" that makes it easy to accidentally believe data
  is validated when only the top-level document was.
- **A single rich-text field (Markdown or HTML) per episode** — explicitly ruled out by the brief,
  and would force `dangerouslySetInnerHTML` for rendering, which is exactly the injection surface
  the security requirements ask us to avoid.

## Consequences

- Every block type requires one Zod schema + one TypeScript type + one React renderer — more files
  per feature, but each one is small, testable in isolation, and safe by construction (the renderer
  only ever receives data that already matched its schema).
- Admin content mutations validate the entire `contentBlocks` array server-side before any write,
  rejecting the whole request with field-level errors if any single block is invalid — never a
  partially-written episode.
- Indexes (`slug` unique per scope, `status`, `publishedAt`, `seriesId`, `moduleId`) are declared in
  one place (`scripts/ensure-indexes.ts`, Phase 2) and are part of the repository layer's
  responsibility, not something each query site has to reason about.
