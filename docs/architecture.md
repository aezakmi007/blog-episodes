# Architecture overview

## Layers

The codebase is organized around five layers, each with one job. Nothing skips a layer.

1. **Presentation** (`src/app`, `src/components`) — Server Components by default. Client
   Components exist only where the browser genuinely needs interactivity (the mobile nav drawer,
   the block editor, the quiz, the color-mode toggle). No data fetching logic lives in components;
   they receive data as props or call a `service` function directly from a Server Component.
2. **Domain / business logic** (`src/services`) — publishing rules (draft → scheduled →
   published → archived transitions), slug generation + uniqueness, reading-time calculation,
   revision bumping, audit-log emission. Services are plain async functions, framework-agnostic,
   easy to unit test without spinning up Next.js.
3. **Data access** (`src/repositories`) — the only modules that import the MongoDB driver or
   touch a `Collection<T>` directly. Each repository exposes a narrow, typed interface (e.g.
   `findPublishedEpisodeBySlug`, `listEpisodesForAdmin`) and is responsible for projections,
   pagination and indexes for its collection. Nothing above this layer builds a MongoDB query.
4. **Authentication and authorization** (`src/lib/auth`) — session issuance/verification,
   password hashing, lockout/rate-limit state, and an `requireAdminSession()` guard that every
   admin route handler, Server Action and page calls independently (see `docs/adr/0001-authentication.md`).
5. **Content rendering** (`src/components/episode`, `src/components/story`) — one presentational
   component per content-block type, driven by a discriminated union. Adding a new block type
   means adding one Zod schema, one TypeScript type, and one renderer — never touching a generic
   "render arbitrary HTML" path.

Validation (`src/lib/validation`, colocated Zod schemas in `src/models`) sits across all of these:
every Server Action and route handler parses its input with Zod before it reaches a service.

## Request flow (write path)

```
Admin UI (React Hook Form)
  -> Server Action / Route Handler
       -> requireAdminSession()           (lib/auth)
       -> zod schema.parse(input)         (models/validation)
       -> service function                (services/)
            -> repository function        (repositories/)
                 -> MongoDB driver         (lib/db/mongodb.ts)
       -> auditLog.record(...)            (services/audit)
       -> revalidatePath/revalidateTag for affected public routes
```

Every arrow above is enforced in code, not just convention — repositories do not export the raw
`Collection`, and services do not import `mongodb` directly.

## Rendering strategy

- Public content pages (`/`, `/series/*`, `/episodes/*`, `/topics/*`) are Server Components that
  fetch published content directly (no internal `fetch()` round-trip to our own API) and are
  cached with Next.js's Data Cache; publishing/unpublishing an episode calls
  `revalidatePath`/`revalidateTag` for exactly the pages it affects.
- Draft and scheduled content is never reachable through a public route or route handler —
  repositories used by public pages hard-filter `status: 'published'` and `publishedAt <= now`.
- The admin dashboard is also Server Components for data display, with Client Components only for
  the forms and the block editor's interactive reordering.
- Heavy, animation-only libraries (Framer Motion) are imported solely inside the Client Components
  that use them and are not part of the shared public bundle for pages that don't animate.

## Security boundaries

- **Network boundary**: `next.config.mjs` sets CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, and `X-Robots-Tag: noindex` on every `/admin/*` response.
- **Routing boundary**: `middleware.ts` (Phase 3) performs an early, coarse redirect for
  unauthenticated `/admin/*` requests as a UX convenience — it is explicitly *not* the security
  boundary. Every admin page, Server Action and route handler calls `requireAdminSession()` itself,
  so a request that somehow bypasses middleware (direct Server Action invocation, a
  misconfigured edge rule, a future refactor that changes the matcher) is still rejected.
- **Data boundary**: public repositories and admin repositories are separate function exports.
  There is no single `getEpisode(id)` that an engineer could accidentally call from a public page
  and leak a draft; public code can only call `findPublishedEpisodeBySlug`-style functions.
- **Secrets boundary**: `src/lib/env.ts` is the only module allowed to read `process.env` for
  anything sensitive, and it is server-only. No `NEXT_PUBLIC_*` variable ever holds a secret.

## Why MongoDB, structured content blocks, and no raw-HTML episodes

Episodes are stored as an ordered array of discriminated-union content blocks (`type`, `order`,
block-specific data), each independently validated by its own Zod schema — see
`docs/adr/0002-content-model.md`. This means the renderer can never be handed arbitrary HTML to
trust, new block types are additive, and the same content can later power a different presentation
(e.g. a print view or a future mobile app) without a migration.

## Full ADR index

- [`docs/adr/0001-authentication.md`](./adr/0001-authentication.md) — custom session service over
  `jose` + `@node-rs/argon2` instead of Auth.js
- [`docs/adr/0002-content-model.md`](./adr/0002-content-model.md) — structured content blocks,
  official MongoDB driver over Mongoose
- [`docs/adr/0003-theming.md`](./adr/0003-theming.md) — MUI `extendTheme` CSS-vars theming over a
  separate CSS-variables layer or a second theming library
- [`docs/adr/0004-block-reordering.md`](./adr/0004-block-reordering.md) — up/down controls instead
  of a drag-and-drop library in the block editor
