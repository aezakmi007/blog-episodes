/**
 * Validates a user-influenced redirect target (e.g. `?next=` after a
 * login redirect) so it can never become an open redirect. Only a path
 * that is relative, starts with a single `/`, and is not protocol-relative
 * (`//evil.com`) or an absolute URL is accepted; anything else falls back
 * to `fallback`.
 */
export function getSafeRedirectPath(candidate: string | null | undefined, fallback = '/admin'): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith('/')) return fallback;
  if (candidate.startsWith('//')) return fallback;
  if (candidate.includes('\\')) return fallback;
  // Reject anything that parses as an absolute URL with a scheme, even if
  // it also happens to start with a slash (e.g. "/\t/evil.com" tricks).
  try {
    const url = new URL(candidate, 'http://internal.invalid');
    if (url.origin !== 'http://internal.invalid') return fallback;
  } catch {
    return fallback;
  }
  return candidate;
}
