import {
  findAdminByEmailWithPasswordHash,
  recordFailedLogin,
  recordSuccessfulLogin,
  incrementAdminSessionVersion,
} from '@/repositories/admins.repository';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session-token';
import { computeLockoutDuration, isIpRateLimited, recordIpAttempt } from '@/lib/auth/rate-limit';
import { recordAuditLog } from '@/repositories/audit-logs.repository';
import type { LoginInput } from '@/models/admin.model';

export interface AuthenticateResult {
  ok: boolean;
  /** Always a generic message — never reveals whether the email exists,
   * whether the account is locked vs. the password was wrong, etc. The
   * UI-facing reason is intentionally the same for every failure mode. */
  error?: string;
  token?: string;
}

const GENERIC_ERROR = 'Invalid email or password.';
const LOCKED_ERROR = 'Too many attempts. Try again in a few minutes.';

/**
 * Orchestrates the full login flow described in the brief's 10-step
 * sequence: IP rate-limit check, account lookup, lockout check, password
 * verification, failure bookkeeping (count + exponential lockout), and on
 * success, session-version rotation + signed token issuance + audit log.
 *
 * Every branch — including "account not found" — takes the same amount
 * of conceptual work and returns the same generic error, so response
 * content and (as much as reasonably possible) timing don't leak account
 * existence.
 */
export async function authenticateAdmin(
  input: LoginInput,
  ipAddress: string,
): Promise<AuthenticateResult> {
  if (isIpRateLimited(ipAddress)) {
    await recordAuditLog({
      action: 'login.failure',
      actorId: null,
      actorEmail: input.email,
      metadata: { reason: 'ip-rate-limited' },
      ipAddress,
      createdAt: new Date(),
    });
    return { ok: false, error: LOCKED_ERROR };
  }
  recordIpAttempt(ipAddress);

  const admin = await findAdminByEmailWithPasswordHash(input.email);

  if (!admin || !admin.isActive) {
    await recordAuditLog({
      action: 'login.failure',
      actorId: null,
      actorEmail: input.email,
      metadata: { reason: admin ? 'inactive' : 'not-found' },
      ipAddress,
      createdAt: new Date(),
    });
    return { ok: false, error: GENERIC_ERROR };
  }

  if (admin.lockedUntil && admin.lockedUntil.getTime() > Date.now()) {
    await recordAuditLog({
      action: 'login.failure',
      actorId: admin._id,
      actorEmail: admin.email,
      metadata: { reason: 'locked' },
      ipAddress,
      createdAt: new Date(),
    });
    return { ok: false, error: LOCKED_ERROR };
  }

  const passwordValid = await verifyPassword(input.password, admin.passwordHash);

  if (!passwordValid) {
    const newFailedCount = admin.failedLoginAttempts + 1;
    const lockoutMs = computeLockoutDuration(newFailedCount);
    await recordFailedLogin(admin.email, {
      lockUntil: lockoutMs ? new Date(Date.now() + lockoutMs) : undefined,
    });
    await recordAuditLog({
      action: 'login.failure',
      actorId: admin._id,
      actorEmail: admin.email,
      metadata: { reason: 'bad-password', failedAttempts: newFailedCount },
      ipAddress,
      createdAt: new Date(),
    });
    return { ok: false, error: lockoutMs ? LOCKED_ERROR : GENERIC_ERROR };
  }

  // Success: rotate the session version (invalidates any previously
  // issued token for this account) and clear lockout state.
  const nextSessionVersion = await rotateSessionVersion(admin._id);
  await recordSuccessfulLogin(admin._id);
  await recordAuditLog({
    action: 'login.success',
    actorId: admin._id,
    actorEmail: admin.email,
    ipAddress,
    createdAt: new Date(),
  });

  const token = await createSessionToken({
    adminId: admin._id,
    role: admin.role,
    sessionVersion: nextSessionVersion,
  });

  return { ok: true, token };
}

export async function logoutAdmin(adminId: string, ipAddress?: string): Promise<void> {
  await rotateSessionVersion(adminId);
  await recordAuditLog({
    action: 'logout',
    actorId: adminId,
    ipAddress,
    createdAt: new Date(),
  });
}

async function rotateSessionVersion(adminId: string): Promise<number> {
  return incrementAdminSessionVersion(adminId);
}
