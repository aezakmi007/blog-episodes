import { Collection, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { AuditLogDocument } from '@/models/audit-log.model';

type StoredAuditLog = Omit<AuditLogDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredAuditLog>> {
  const db = await getDb();
  return db.collection<StoredAuditLog>(COLLECTIONS.AUDIT_LOGS);
}

function toAuditLogDocument(raw: WithId<StoredAuditLog>): AuditLogDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

export async function ensureAuditLogIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ createdAt: -1 });
  await collection.createIndex({ actorId: 1, createdAt: -1 });
  await collection.createIndex({ action: 1, createdAt: -1 });
}

export async function recordAuditLog(entry: StoredAuditLog): Promise<void> {
  const collection = await getCollection();
  await collection.insertOne(entry);
}

export async function listRecentAuditLogs(limit: number): Promise<AuditLogDocument[]> {
  const collection = await getCollection();
  const raw = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return raw.map(toAuditLogDocument);
}
