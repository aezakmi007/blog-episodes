import { env } from '@/lib/env';
import { SESSION_MAX_AGE_MS } from './session-token';

export const SESSION_COOKIE_NAME = 'ssml_admin_session';

/** Deliberately hand-rolled rather than imported from a Next.js internal
 * path — this shape matches what both `cookies().set()` (Server Actions /
 * Route Handlers) and `NextResponse.cookies.set()` (middleware) accept. */
export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

/**
 * Centralized cookie options so every place that sets or clears the
 * session cookie agrees on flags. `secure` is forced on in production
 * (HTTPS-only) and relaxed only for local HTTP development.
 */
export function getSessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}
