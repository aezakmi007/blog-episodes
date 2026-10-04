# Security checklist

Status as of Phase 3. Items are re-reviewed at the end of Phase 7 (see
`docs/adr/` for the reasoning behind each major control).

## Authentication & session management

- [x] Server-side credential validation (`src/features/auth/auth.service.ts`) — the client never
      makes an authorization decision.
- [x] Password hashing with Argon2id (`@node-rs/argon2`, OWASP-recommended cost parameters) —
      `src/lib/auth/password.ts`.
- [x] No password or secret in a `NEXT_PUBLIC_*` variable — grep the codebase for `NEXT_PUBLIC_` to
      confirm; `src/lib/env.ts` is the only module that reads secret env vars, and it is
      server-only.
- [x] Secure, HttpOnly, SameSite=Lax session cookie — `src/lib/auth/cookies.ts`. `secure` is forced
      in production; HTTP-only local dev is the sole exception.
- [x] Login rate limiting — per-IP in-memory limiter (`src/lib/auth/rate-limit.ts`) layered with
      durable per-account lockout stored in MongoDB.
- [x] Exponential-backoff account lockout after repeated failures —
      `computeLockoutDuration()`, `admins.failedLoginAttempts` / `lockedUntil`.
- [x] Generic login errors — `authenticateAdmin()` returns the same message
      ("Invalid email or password.") whether the account doesn't exist, is inactive, or the
      password was wrong, to resist account enumeration.
- [x] Session expiration — 8-hour absolute JWT expiry (`SESSION_MAX_AGE_SECONDS`).
- [x] Session rotation after successful authentication — `sessionVersion` incremented on every
      login, invalidating any previously issued token for that account.
- [x] Logout invalidates the session — logout also increments `sessionVersion`, so the just-used
      token is rejected even if the cookie is somehow replayed afterward.
- [x] Audit logs for login success/failure and logout — `src/repositories/audit-logs.repository.ts`.

## Authorization

- [x] Every admin page calls `requireAdminSession()` itself (not just the shared layout) —
      see `src/app/admin/page.tsx`'s comment and docs/architecture.md.
- [x] Every Server Action / route handler that mutates data must call `getAdminSessionOrNull()`
      and check the result before doing anything — enforced by code review checklist in Phase 4+
      (each new admin mutation added from Phase 4 onward is required to include this call; see
      services/episode.service.ts etc. once written).
- [x] Middleware performs only an early, coarse redirect — it is documented as NOT the security
      boundary (`middleware.ts` header comment, `docs/architecture.md`).
- [x] Role-based restriction of irreversible actions (delete) to `owner` — wired into
      `deleteEpisodeAction`, `deleteSeriesAction`, `deleteModuleAction`
      (`src/features/*/actions.ts`) and into `updateSiteSettingsAction` for site-wide settings.

## Input validation & content safety

- [x] Zod validation at every boundary — `src/models/*.model.ts`, `src/lib/validation/common.ts`.
- [x] Discriminated-union content blocks — a malformed block cannot be stored
      (`parseContentBlock`/`parseContentBlocks`).
- [ ] Sanitized Markdown rendering (`rehype-sanitize`) — dependency is in `package.json`; the
      actual renderer component is built in Phase 5 alongside the reader.
- [x] No `dangerouslySetInnerHTML` anywhere in the codebase (verify with
      `grep -r dangerouslySetInnerHTML src/` — should return nothing).

## Network & transport

- [x] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
      Permissions-Policy) — `next.config.mjs`.
- [x] `X-Robots-Tag: noindex` + `robots.txt` disallow for `/admin/*` — defense in depth; the real
      protection is server-side auth, not robots compliance.
- [ ] **Known limitation**: the CSP's `script-src` currently includes `'unsafe-inline'` and
      `'unsafe-eval'`, required by Next.js's current inline hydration bootstrap. A nonce-based CSP
      is a tracked hardening item for Phase 7 (requires wiring a per-request nonce through
      `next.config.mjs` and the root layout).
- [ ] **Known limitation**: the in-memory per-IP rate limiter (`src/lib/auth/rate-limit.ts`) is
      per-process. A multi-instance production deployment should replace it with a shared store
      (Redis/Upstash) — the per-account lockout in MongoDB remains authoritative regardless, so
      this limitation does not make brute-forcing a known account easier, only makes the
      cross-account IP throttle weaker under horizontal scaling.
- [ ] HTTPS enforced in production — this is a hosting-platform responsibility (e.g. Vercel
      terminates TLS automatically); see deployment docs (Phase 7) for the exact configuration
      expected of the hosting environment.

## Secrets & configuration

- [x] `src/lib/env.ts` validates all required environment variables at startup and refuses to boot
      on missing/malformed values.
- [x] `.env.example` documents every variable without real values.
- [x] `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`.
- [x] Bootstrap admin creation is a one-time CLI script (`scripts/seed-admin.ts`), not a
      hard-coded or environment-backed runtime credential — it exits harmlessly if an admin
      already exists and never prints the password.

## Error handling & observability

- [x] No MongoDB `ObjectId`, stack trace, or internal error message is ever returned in a public
      API response (`/api/health` returns only `{status, database, timestamp}`).
- [x] `global-error.tsx` renders a generic message and never `error.message`/`error.stack`.
- [x] Audit logs never contain passwords, session tokens, or full request bodies — confirmed by
      reading `src/models/audit-log.model.ts`'s `metadata` type (string/number/boolean values only,
      populated explicitly field-by-field by call sites, never a raw spread of input).

## Open redirect

- [x] `getSafeRedirectPath()` (`src/lib/security/safe-redirect.ts`) validates every
      user-influenced redirect target (the login form's `?next=`) before it's used in a
      `redirect()` call — rejects absolute URLs, protocol-relative URLs (`//evil.com`), and
      backslash tricks.

## Still to do (tracked by phase)

- Phase 4: role checks wired into every mutation; CSRF/Origin-header assertion helper applied to
  any route handler that isn't a Server Action.
- Phase 5: sanitized Markdown renderer for narration/dialogue/concept free-text fields.
- Phase 6: quiz answer-stripping verified end-to-end (server never sends `correctOptionId` /
  `correctAnswer` / `acceptableAnswers` in the public HTML payload).
- Phase 7: the security test suite in the brief's "SECURITY TESTS" section; nonce-based CSP;
  final manual penetration-style review of direct route-handler and Server Action invocation.
