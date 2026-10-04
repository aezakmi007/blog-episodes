import { z } from 'zod';

/**
 * Admin account document (`admins` collection). `passwordHash` never
 * leaves this layer — repositories that return an admin for session/UI
 * purposes always project it out explicitly (see
 * repositories/admins.repository.ts `toSafeAdmin`).
 */
export const adminRoleSchema = z.enum(['owner', 'editor']);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export interface AdminDocument {
  _id: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  /** Bumped on every successful login (rotation) and on logout
   * (invalidation). A session JWT embeds the `sessionVersion` it was
   * issued with; `requireAdminSession` rejects any token whose version no
   * longer matches this field, which is what makes "logout" and "rotate
   * on login" actually invalidate prior tokens despite sessions being
   * stateless JWTs rather than server-stored records. */
  sessionVersion: number;
  failedLoginAttempts: number;
  /** Set when failedLoginAttempts crosses the lockout threshold; null/undefined
   * once it has passed or been cleared by a successful login. */
  lockedUntil?: Date;
  lastLoginAt?: Date;
  passwordChangedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** What callers outside lib/auth and repositories/admins are allowed to
 * see — never includes passwordHash. */
export type SafeAdmin = Omit<AdminDocument, 'passwordHash'>;

export const createAdminInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  // Deliberately generous server-side minimum; the admin login UI adds its
  // own strength guidance, but validation here is the enforced floor.
  password: z.string().min(12, 'Password must be at least 12 characters long'),
  role: adminRoleSchema.default('owner'),
});
export type CreateAdminInput = z.infer<typeof createAdminInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginInputSchema>;
