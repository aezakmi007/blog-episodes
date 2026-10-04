import { Collection, ObjectId, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { TagDocument, TagInput } from '@/models/tag.model';

type StoredTag = Omit<TagDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredTag>> {
  const db = await getDb();
  return db.collection<StoredTag>(COLLECTIONS.TAGS);
}

function toTagDocument(raw: WithId<StoredTag>): TagDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

export async function ensureTagIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ slug: 1 }, { unique: true });
}

export async function upsertTag(input: TagInput): Promise<TagDocument> {
  const collection = await getCollection();
  const now = new Date();
  const result = await collection.findOneAndUpdate(
    { slug: input.slug },
    {
      $set: { name: input.name, description: input.description, updatedAt: now },
      $setOnInsert: { episodeCount: 0, createdAt: now },
    },
    { returnDocument: 'after', upsert: true },
  );
  if (!result) throw new Error('Failed to upsert tag');
  return toTagDocument(result);
}

export async function findTagBySlug(slug: string): Promise<TagDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne({ slug });
  return raw ? toTagDocument(raw) : null;
}

export async function listTags(): Promise<TagDocument[]> {
  const collection = await getCollection();
  const raw = await collection.find({}).sort({ name: 1 }).toArray();
  return raw.map(toTagDocument);
}

export async function adjustTagEpisodeCount(slug: string, delta: number): Promise<void> {
  const collection = await getCollection();
  await collection.updateOne({ slug }, { $inc: { episodeCount: delta } });
}

export async function deleteTag(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
