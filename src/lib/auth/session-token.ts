import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { env } from '@/lib/env';

/**
 * Signed (not encrypted) session tokens. The payload holds only an admin
 * id, role and `sessionVersion` — nothing a user wouldn't already
 * implicitly know, and nothing that needs confidentiality beyond what the
 * Secure/HttpOnly cookie flags already provide. Integrity and authenticity
 * (nobody can forge or tamper with a token without AUTH_SECRET) is what
 * matters here, which HS256 signing provides. See ADR 0001.
 */
const SESSION_ALG = 'HS256';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export interface SessionPayload {
  adminId: string;
  role: 'owner' | 'editor';
  sessionVersion: number;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

/**
 * Verifies signature + expiry and returns the payload, or `null` for any
 * failure (expired, tampered, malformed, wrong algorithm). Callers must
 * not distinguish these cases in user-facing responses — all of them mean
 * "not authenticated".
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: [SESSION_ALG] });
    if (
      typeof payload.adminId !== 'string' ||
      (payload.role !== 'owner' && payload.role !== 'editor') ||
      typeof payload.sessionVersion !== 'number'
    ) {
      return null;
    }
    return { adminId: payload.adminId, role: payload.role, sessionVersion: payload.sessionVersion };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) return null;
    return null;
  }
}
