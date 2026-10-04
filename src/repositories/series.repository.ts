import { Collection, ObjectId, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { SeriesDocument, SeriesInput } from '@/models/series.model';

/** Internal storage shape: `_id` is a real ObjectId at the driver
 * boundary. Every function in this file converts to/from the public
 * `SeriesDocument` shape (`_id: string`) before returning — callers
 * outside the repository layer never see a raw ObjectId. */
type StoredSeries = Omit<SeriesDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredSeries>> {
  const db = await getDb();
  return db.collection<StoredSeries>(COLLECTIONS.SERIES);
}

function toSeriesDocument(raw: WithId<StoredSeries>): SeriesDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

/** Called once at app startup / by the seed script — safe to call
 * repeatedly, `createIndex` is idempotent. */
export async function ensureSeriesIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ status: 1, displayOrder: 1 });
}

export async function isSeriesSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const collection = await getCollection();
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: new ObjectId(excludeId) };
  const existing = await collection.findOne(filter, { projection: { _id: 1 } });
  return existing !== null;
}

export async function createSeries(input: SeriesInput): Promise<SeriesDocument> {
  const collection = await getCollection();
  const now = new Date();
  const doc: StoredSeries = { ...input, totalModules: 0, createdAt: now, updatedAt: now };
  const result = await collection.insertOne(doc as StoredSeries);
  return { _id: result.insertedId.toHexString(), ...doc };
}

export async function updateSeries(
  id: string,
  patch: Partial<SeriesInput>,
): Promise<SeriesDocument | null> {
  const collection = await getCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return result ? toSeriesDocument(result) : null;
}

export async function adjustSeriesModuleCount(seriesId: string, delta: number): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne({ _id: new ObjectId(seriesId) }, { $inc: { totalModules: delta } });
}

export async function deleteSeries(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function findSeriesById(id: string): Promise<SeriesDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection();
  const raw = await collection.findOne({ _id: new ObjectId(id) });
  return raw ? toSeriesDocument(raw) : null;
}

/** Public read: only ever returns a series whose status is "published". */
export async function findPublishedSeriesBySlug(slug: string): Promise<SeriesDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne({ slug, status: 'published' });
  return raw ? toSeriesDocument(raw) : null;
}

export async function listPublishedSeries(): Promise<SeriesDocument[]> {
  const collection = await getCollection();
  const raw = await collection.find({ status: 'published' }).sort({ displayOrder: 1 }).toArray();
  return raw.map(toSeriesDocument);
}

export interface ListSeriesForAdminOptions {
  page: number;
  pageSize: number;
  status?: SeriesDocument['status'];
}

export async function listSeriesForAdmin(
  options: ListSeriesForAdminOptions,
): Promise<{ items: SeriesDocument[]; totalCount: number }> {
  const collection = await getCollection();
  const filter = options.status ? { status: options.status } : {};
  const [items, totalCount] = await Promise.all([
    collection
      .find(filter)
      .sort({ displayOrder: 1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  return { items: items.map(toSeriesDocument), totalCount };
}
