# ADR 0001: Custom session service instead of Auth.js

**Status:** Accepted (Phase 1 decision, implemented in Phase 3)

## Context

The brief asks for "Auth.js or a similarly mature authentication library," with a single-role
(admin-only) credential flow that has unusually specific requirements: server-verified password
check with Argon2id, exponential-backoff/lockout after repeated failures stored per-account in
MongoDB, session rotation on login, secure HttpOnly cookies, and independent authorization checks
inside every mutation rather than relying on middleware.

## Decision

Build a small, fully-owned session module (`src/lib/auth`) on top of two narrowly-scoped, mature
libraries:

- **`jose`** — signs and verifies the session token as a JWE/JWT. `jose` is maintained by the
  Auth.js/`panva` ecosystem and is in fact the same library Auth.js uses internally for its JWT
  strategy, audited and widely deployed.
- **`@node-rs/argon2`** — Argon2id hashing via a Rust native binding, with prebuilt binaries for
  the common server/serverless targets, avoiding the native-build friction of the plain `argon2`
  npm package on Vercel-style deployments.

Session tokens are opaque-looking signed JWEs stored in a `Secure`, `HttpOnly`, `SameSite=Lax`
cookie, with a short absolute expiry plus rotation (a new token is issued, old one invalidated) on
every successful login, as called for in the brief's 10-step flow.

## Alternatives considered

- **Auth.js (NextAuth) v5** — excellent fit for OAuth/multi-provider consumer auth. For a
  single-role, credentials-only, MongoDB-backed admin login with bespoke lockout and rotation
  rules, Auth.js's Credentials provider forces a JWT-only session strategy and pushes the
  lockout/backoff logic into callbacks in ways that end up re-implementing the same primitives
  this ADR uses directly, while adding an adapter layer, a second data model
  (`sessions`/`accounts`/`verification_tokens` if the database strategy were used), and a
  dependency surface (providers, adapters) that is unused by a single-role internal CMS. It
  remains the right default for anything that later needs OAuth or multi-provider login.
- **`iron-session`** — a reasonable alternative, encrypts the whole session into the cookie. Not
  chosen only because `jose` gives us standard JWT/JWE primitives we can reuse for a future
  short-lived API token (e.g. a signed preview link for an unpublished episode) without adding yet
  another crypto dependency.

## Consequences

- We own session lifecycle code and its tests (Phase 3, Phase 7) rather than trusting a framework
  default — more code, but every behavior in the brief's 10-step flow maps to a specific,
  reviewable function.
- If the product later needs OAuth (e.g. "log in with Google" for a second admin), migrating to
  Auth.js is still straightforward since the admin data model (`admins` collection, password hash,
  lockout fields) is independent of the session mechanism.
