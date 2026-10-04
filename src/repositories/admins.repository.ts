import { Collection, ObjectId, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AdminDocument, SafeAdmin } from '@/models/admin.model';

type StoredAdmin = Omit<AdminDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredAdmin>> {
  const db = await getDb();
  return db.collection<StoredAdmin>(COLLECTIONS.ADMINS);
}

function toAdminDocument(raw: WithId<StoredAdmin>): AdminDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

/** Strips `passwordHash` — this is the shape every caller outside
 * lib/auth and this file should use. */
export function toSafeAdmin(admin: AdminDocument): SafeAdmin {
  const { passwordHash: _passwordHash, ...safe } = admin;
  return safe;
}

export async function ensureAdminIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ email: 1 }, { unique: true });
}

/** Returns the full document including passwordHash — ONLY for use by
 * lib/auth's credential-verification function. Every other caller must
 * use `findSafeAdminById` / `findSafeAdminByEmail`. */
export async function findAdminByEmailWithPasswordHash(email: string): Promise<AdminDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne({ email: email.toLowerCase() });
  return raw ? toAdminDocument(raw) : null;
}

export async function findSafeAdminById(id: string): Promise<SafeAdmin | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection();
  const raw = await collection.findOne(
    { _id: new ObjectId(id) },
    { projection: { passwordHash: 0 } },
  );
  return raw ? (toAdminDocument(raw as WithId<StoredAdmin>) as unknown as SafeAdmin) : null;
}

export async function countAdmins(): Promise<number> {
  const collection = await getCollection();
  return collection.countDocuments({});
}

/** Used only by the one-time bootstrap CLI (scripts/seed-admin.ts). */
export async function createAdmin(doc: StoredAdmin): Promise<AdminDocument> {
  const collection = await getCollection();
  const result = await collection.insertOne(doc);
  return { _id: result.insertedId.toHexString(), ...doc };
}

export async function recordFailedLogin(
  email: string,
  options: { lockUntil?: Date },
): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne(
    { email: email.toLowerCase() },
    {
      $inc: { failedLoginAttempts: 1 },
      ...(options.lockUntil ? { $set: { lockedUntil: options.lockUntil } } : {}),
    },
  );
}

export async function recordSuccessfulLogin(adminId: string): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne(
    { _id: new ObjectId(adminId) },
    {
      $set: { failedLoginAttempts: 0, lastLoginAt: new Date() },
      $unset: { lockedUntil: '' },
    },
  );
}

export async function setAdminActive(id: string, isActive: boolean): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { isActive, updatedAt: new Date() } });
}

/** Increments `sessionVersion` and returns the new value. This is what
 * makes "rotate on login" and "invalidate on logout" actually work for a
 * stateless JWT session — see lib/auth/session-token.ts and
 * features/auth/auth.service.ts, the only callers. */
export async function incrementAdminSessionVersion(id: string): Promise<number> {
  const collection = await getCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $inc: { sessionVersion: 1 } },
    { returnDocument: 'after', projection: { sessionVersion: 1 } },
  );
  return result?.sessionVersion ?? 1;
}
