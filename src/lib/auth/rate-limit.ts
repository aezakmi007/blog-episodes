/**
 * Two layers of login throttling:
 *
 * 1. Per-account lockout (durable, in MongoDB — `admins.failedLoginAttempts`
 *    / `lockedUntil`). This is the authoritative mechanism and survives
 *    restarts and multiple server instances.
 * 2. Per-IP in-memory rate limiting (this file) — a fast first line of
 *    defense against credential-stuffing across many different email
 *    addresses from one source, which account-level lockout alone
 *    wouldn't catch.
 *
 * LIMITATION (documented, not hidden): the in-memory limiter is
 * per-process. A multi-instance production deployment should replace it
 * with a shared store (Redis, Upstash, etc.) — tracked in SECURITY.md.
 * It is not the only defense, so this limitation does not leave the
 * account-lockout layer bypassable.
 */

const IP_WINDOW_MS = 60_000;
const IP_MAX_ATTEMPTS_PER_WINDOW = 10;

const ipAttempts = new Map<string, number[]>();

export function isIpRateLimited(ipAddress: string): boolean {
  const now = Date.now();
  const timestamps = (ipAttempts.get(ipAddress) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  ipAttempts.set(ipAddress, timestamps);
  return timestamps.length >= IP_MAX_ATTEMPTS_PER_WINDOW;
}

export function recordIpAttempt(ipAddress: string): void {
  const timestamps = ipAttempts.get(ipAddress) ?? [];
  timestamps.push(Date.now());
  ipAttempts.set(ipAddress, timestamps);
}

const LOCKOUT_THRESHOLD = 5;
const BASE_LOCKOUT_MS = 30_000; // 30 seconds
const MAX_LOCKOUT_MS = 30 * 60_000; // 30 minutes

/**
 * Exponential backoff once an account crosses `LOCKOUT_THRESHOLD` failed
 * attempts: attempt 5 locks for 30s, 6 for 1m, 7 for 2m, ... capped at 30
 * minutes. Returns `null` if this attempt count shouldn't trigger a lock.
 */
export function computeLockoutDuration(failedAttempts: number): number | null {
  if (failedAttempts < LOCKOUT_THRESHOLD) return null;
  const exponent = failedAttempts - LOCKOUT_THRESHOLD;
  return Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * 2 ** exponent);
}
