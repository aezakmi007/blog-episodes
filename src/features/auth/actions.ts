'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginInputSchema } from '@/models/admin.model';
import { authenticateAdmin, logoutAdmin } from './auth.service';
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from '@/lib/auth/cookies';
import { getAdminSessionOrNull } from '@/lib/auth/guards';
import { getSafeRedirectPath } from '@/lib/security/safe-redirect';

export interface LoginFormState {
  error?: string;
  fieldErrors?: Partial<Record<'email' | 'password', string>>;
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  // Trust x-forwarded-for only to the extent of "best effort for rate
  // limiting" — it is not used for any authorization decision, only
  // throttling, so a spoofed header merely means an attacker rate-limits
  // themselves under a fake bucket rather than bypassing any real check.
  const forwardedFor = headerList.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Server Action backing the admin login form. Validates input with Zod,
 * delegates to authenticateAdmin (which performs rate limiting, lockout,
 * password verification and audit logging), and on success sets the
 * session cookie and redirects — all server-side, so there is no
 * client-side gate to bypass.
 */
export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    const fieldErrors: LoginFormState['fieldErrors'] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === 'email' || key === 'password') fieldErrors[key] = issue.message;
    }
    return { error: 'Please check the form and try again.', fieldErrors };
  }

  const ipAddress = await getClientIp();
  const result = await authenticateAdmin(parsed.data, ipAddress);

  if (!result.ok || !result.token) {
    return { error: result.error ?? 'Invalid email or password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.token, getSessionCookieOptions());

  const nextParam = formData.get('next');
  const target = getSafeRedirectPath(typeof nextParam === 'string' ? nextParam : null, '/admin');
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  const session = await getAdminSessionOrNull();
  const cookieStore = await cookies();

  if (session) {
    await logoutAdmin(session.admin._id);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}
