import { Collection, ObjectId, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { MediaDocument, MediaInput } from '@/models/media.model';

type StoredMedia = Omit<MediaDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredMedia>> {
  const db = await getDb();
  return db.collection<StoredMedia>(COLLECTIONS.MEDIA);
}

function toMediaDocument(raw: WithId<StoredMedia>): MediaDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

export async function ensureMediaIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ createdAt: -1 });
}

export async function createMedia(input: MediaInput, uploadedBy: string): Promise<MediaDocument> {
  const collection = await getCollection();
  const doc: StoredMedia = { ...input, uploadedBy, createdAt: new Date() };
  const result = await collection.insertOne(doc);
  return { _id: result.insertedId.toHexString(), ...doc };
}

export async function listMedia(page: number, pageSize: number) {
  const collection = await getCollection();
  const [items, totalCount] = await Promise.all([
    collection
      .find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray(),
    collection.countDocuments({}),
  ]);
  return { items: items.map(toMediaDocument), totalCount };
}

export async function deleteMedia(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
