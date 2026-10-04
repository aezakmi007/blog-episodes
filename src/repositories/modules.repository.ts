import { Collection, ObjectId, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { ModuleDocument, ModuleInput } from '@/models/module.model';

type StoredModule = Omit<ModuleDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredModule>> {
  const db = await getDb();
  return db.collection<StoredModule>(COLLECTIONS.MODULES);
}

function toModuleDocument(raw: WithId<StoredModule>): ModuleDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

export async function ensureModuleIndexes(): Promise<void> {
  const collection = await getCollection();
  // Slugs are unique per-series, not globally — two different series can
  // each have a "module-1".
  await collection.createIndex({ seriesId: 1, slug: 1 }, { unique: true });
  await collection.createIndex({ seriesId: 1, displayOrder: 1 });
  await collection.createIndex({ status: 1 });
}

export async function isModuleSlugTaken(
  seriesId: string,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const collection = await getCollection();
  const filter: Record<string, unknown> = { seriesId, slug };
  if (excludeId) filter._id = { $ne: new ObjectId(excludeId) };
  const existing = await collection.findOne(filter, { projection: { _id: 1 } });
  return existing !== null;
}

export async function createModule(input: ModuleInput): Promise<ModuleDocument> {
  const collection = await getCollection();
  const now = new Date();
  const doc: StoredModule = { ...input, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc);
  return { _id: result.insertedId.toHexString(), ...doc };
}

export async function updateModule(
  id: string,
  patch: Partial<ModuleInput>,
): Promise<ModuleDocument | null> {
  const collection = await getCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return result ? toModuleDocument(result) : null;
}

export async function deleteModule(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function findModuleById(id: string): Promise<ModuleDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection();
  const raw = await collection.findOne({ _id: new ObjectId(id) });
  return raw ? toModuleDocument(raw) : null;
}

export async function findPublishedModuleBySlug(
  seriesId: string,
  slug: string,
): Promise<ModuleDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne({ seriesId, slug, status: 'published' });
  return raw ? toModuleDocument(raw) : null;
}

export async function listPublishedModulesForSeries(seriesId: string): Promise<ModuleDocument[]> {
  const collection = await getCollection();
  const raw = await collection
    .find({ seriesId, status: 'published' })
    .sort({ displayOrder: 1 })
    .toArray();
  return raw.map(toModuleDocument);
}

export async function listModulesForAdmin(seriesId?: string): Promise<ModuleDocument[]> {
  const collection = await getCollection();
  const filter = seriesId ? { seriesId } : {};
  const raw = await collection.find(filter).sort({ seriesId: 1, displayOrder: 1 }).toArray();
  return raw.map(toModuleDocument);
}
