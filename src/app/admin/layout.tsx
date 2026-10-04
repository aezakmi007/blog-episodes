import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { requireAdminSession } from '@/lib/auth/guards';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Protected shell for every page under /admin (except /admin/login, which
 * lives in the sibling (auth) route group and is NOT wrapped by this
 * layout). `requireAdminSession()` is called here, server-side, before
 * any admin UI or data is sent to the client — an unauthenticated
 * request is redirected to /admin/login and never receives this layout's
 * children at all.
 *
 * This is one of two independent checks (the other being middleware's
 * early redirect) — see docs/architecture.md. Every nested page and
 * Server Action additionally re-verifies the session itself; this layout
 * check is necessary but not sufficient on its own, by design.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const currentPath = headerList.get('x-pathname') ?? '/admin';
  const session = await requireAdminSession(currentPath);

  return <AdminShell admin={session.admin}>{children}</AdminShell>;
}
