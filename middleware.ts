import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/cookies';

/**
 * Early, coarse redirect for unauthenticated `/admin/*` requests. This is
 * a UX convenience ONLY — it checks for the mere presence of a
 * session cookie, not its signature, expiry or sessionVersion (middleware
 * runs on the Edge runtime, where we intentionally keep logic minimal and
 * avoid a database round trip on every request).
 *
 * The actual security boundary is `requireAdminSession()` /
 * `getAdminSessionOrNull()` (src/lib/auth/guards.ts), called independently
 * by every admin page, Server Action and route handler. Do not add
 * authorization logic here and assume it is sufficient — see
 * docs/architecture.md "Security boundaries".
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward the current pathname as a request header so Server Components
  // downstream (app/admin/layout.tsx) can build an accurate `?next=`
  // redirect target without relying on a client-only hook.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  const withPathname = () => NextResponse.next({ request: { headers: requestHeaders } });

  if (pathname === '/admin/login') {
    return withPathname();
  }

  if (pathname.startsWith('/admin')) {
    const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
    if (!hasSessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return withPathname();
}

export const config = {
  matcher: ['/admin/:path*'],
};
