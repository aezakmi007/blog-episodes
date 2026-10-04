import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from './session-token';
import { SESSION_COOKIE_NAME } from './cookies';
import { findSafeAdminById } from '@/repositories/admins.repository';
import type { SafeAdmin } from '@/models/admin.model';

export interface AdminSession {
  admin: SafeAdmin;
}

/**
 * The single source of truth for "is this request an authenticated
 * admin". Every admin page, Server Action and route handler calls one of
 * the two functions below itself — this is deliberate defense in depth:
 * `middleware.ts` performs an early, coarse redirect for UX, but it is NOT
 * trusted as the security boundary (see docs/architecture.md). A request
 * that somehow reaches a Server Action or route handler without having
 * passed through middleware (direct invocation, a future matcher change,
 * an edge case in how Next.js dispatches actions) is still rejected here.
 *
 * Verifies, in order: a session cookie is present and well-formed; the
 * JWT signature and expiry are valid; the admin still exists, is active,
 * and the token's `sessionVersion` matches the current value in the
 * database (i.e. it hasn't been invalidated by a logout or a later
 * login).
 */
async function resolveSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const admin = await findSafeAdminById(payload.adminId);
  if (!admin || !admin.isActive) return null;
  if (admin.sessionVersion !== payload.sessionVersion) return null;

  return { admin };
}

/**
 * For Server Components / Pages under /admin. Redirects to
 * /admin/login?next=<path> when there is no valid session — this is the
 * ONLY place a redirect-based flow is appropriate, because Pages can't
 * otherwise return a 401 to the browser.
 */
export async function requireAdminSession(currentPath?: string): Promise<AdminSession> {
  const session = await resolveSession();
  if (!session) {
    const next = currentPath ? `?next=${encodeURIComponent(currentPath)}` : '';
    redirect(`/admin/login${next}`);
  }
  return session;
}

/**
 * For Server Actions and Route Handlers under /admin or /api/admin. Never
 * redirects (a POST/mutation should fail with a clear, catchable error,
 * not a 3xx) — callers decide how to surface `null` (e.g. a route handler
 * returns 401 JSON, a Server Action returns a form-state error).
 */
export async function getAdminSessionOrNull(): Promise<AdminSession | null> {
  return resolveSession();
}

/** Role check layered on top of session verification — e.g. an
 * irreversible action restricted to `owner`. */
export function assertRole(session: AdminSession, allowed: Array<SafeAdmin['role']>): boolean {
  return allowed.includes(session.admin.role);
}
