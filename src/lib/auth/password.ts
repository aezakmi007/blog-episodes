import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id password hashing. Parameters follow OWASP's current minimum
 * recommendation for Argon2id (m=19456 KiB (~19 MiB), t=2, p=1) — tuned
 * for an interactive login path (sub-100ms on typical server hardware)
 * while remaining well above brute-force-feasible cost. Revisit these
 * constants if server hardware changes significantly; they are not
 * exposed as environment variables because tuning them is a deliberate,
 * reviewed decision, not a per-deployment setting.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return hash(plainTextPassword, { ...ARGON2_OPTIONS, algorithm: 2 /* Argon2id */ });
}

/**
 * Verifies a password against a stored hash. Never throws on a wrong
 * password — returns false. Throwing is reserved for genuinely
 * exceptional conditions (a malformed hash string), which callers should
 * treat the same as "verification failed" rather than surfacing to the
 * visitor.
 */
export async function verifyPassword(plainTextPassword: string, storedHash: string): Promise<boolean> {
  try {
    return await verify(storedHash, plainTextPassword);
  } catch {
    return false;
  }
}
