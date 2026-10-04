import { Collection, ObjectId, type Filter, type WithId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import type { EpisodeDocument, PublicEpisodeSummary } from '@/models/episode.model';
import type { ContentStatus } from '@/lib/validation/common';

type StoredEpisode = Omit<EpisodeDocument, '_id'>;

async function getCollection(): Promise<Collection<StoredEpisode>> {
  const db = await getDb();
  return db.collection<StoredEpisode>(COLLECTIONS.EPISODES);
}

function toEpisodeDocument(raw: WithId<StoredEpisode>): EpisodeDocument {
  const { _id, ...rest } = raw;
  return { _id: _id.toHexString(), ...rest };
}

/** Fields safe to send to a public list page — never the full
 * contentBlocks array (which may include quiz answers and is simply more
 * data than a listing needs). Detail pages fetch the full document
 * through `findPublishedEpisodeByFullSlug`, and the service layer strips
 * quiz answers before that reaches a Server Component. */
const PUBLIC_SUMMARY_PROJECTION = {
  slug: 1,
  title: 1,
  subtitle: 1,
  excerpt: 1,
  heroImage: 1,
  episodeNumber: 1,
  teacherCharacter: 1,
  studentCharacter: 1,
  readingTime: 1,
  publishedAt: 1,
  tags: 1,
  seriesSlug: 1,
  moduleSlug: 1,
} as const;

export async function ensureEpisodeIndexes(): Promise<void> {
  const collection = await getCollection();
  await collection.createIndex({ slug: 1 }, { unique: true });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ publishedAt: -1 });
  await collection.createIndex({ seriesId: 1 });
  await collection.createIndex({ moduleId: 1 });
  await collection.createIndex({ status: 1, publishedAt: -1 });
  await collection.createIndex({ tags: 1 });
  // Text index for MVP search — see services/search.service.ts (Phase 6)
  // and ADR 0002 for the planned migration path to Atlas Search.
  await collection.createIndex(
    { title: 'text', excerpt: 'text', tags: 'text', concepts: 'text' },
    { name: 'episode_text_search' },
  );
}

export async function isEpisodeSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const collection = await getCollection();
  const filter: Filter<StoredEpisode> = { slug };
  if (excludeId) filter._id = { $ne: new ObjectId(excludeId) };
  const existing = await collection.findOne(filter, { projection: { _id: 1 } });
  return existing !== null;
}

export async function createEpisode(doc: StoredEpisode): Promise<EpisodeDocument> {
  const collection = await getCollection();
  const result = await collection.insertOne(doc);
  return { _id: result.insertedId.toHexString(), ...doc };
}

export async function updateEpisode(
  id: string,
  patch: Partial<StoredEpisode>,
): Promise<EpisodeDocument | null> {
  const collection = await getCollection();
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...patch, updatedAt: new Date() }, $inc: { revision: 1 } },
    { returnDocument: 'after' },
  );
  return result ? toEpisodeDocument(result) : null;
}

export async function deleteEpisode(id: string): Promise<boolean> {
  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function findEpisodeById(id: string): Promise<EpisodeDocument | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getCollection();
  const raw = await collection.findOne({ _id: new ObjectId(id) });
  return raw ? toEpisodeDocument(raw) : null;
}

/** Public read: the ONLY function in this file that detail pages may call
 * for rendering an episode. Hard-filters on status + publishedAt so a
 * draft or a not-yet-due scheduled episode can never be reached by slug
 * enumeration. */
export async function findPublishedEpisodeBySlug(slug: string): Promise<EpisodeDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne({
    slug,
    status: 'published',
    publishedAt: { $lte: new Date() },
  });
  return raw ? toEpisodeDocument(raw) : null;
}

export interface ListPublishedEpisodesOptions {
  page: number;
  pageSize: number;
  seriesSlug?: string;
  moduleSlug?: string;
  tag?: string;
  featuredOnly?: boolean;
}

export async function listPublishedEpisodeSummaries(
  options: ListPublishedEpisodesOptions,
): Promise<{ items: PublicEpisodeSummary[]; totalCount: number }> {
  const collection = await getCollection();
  const filter: Filter<StoredEpisode> = {
    status: 'published',
    publishedAt: { $lte: new Date() },
  };
  if (options.seriesSlug) filter.seriesSlug = options.seriesSlug;
  if (options.moduleSlug) filter.moduleSlug = options.moduleSlug;
  if (options.tag) filter.tags = options.tag;
  if (options.featuredOnly) filter.featured = true;

  const [items, totalCount] = await Promise.all([
    collection
      .find(filter, { projection: PUBLIC_SUMMARY_PROJECTION })
      .sort({ publishedAt: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items as unknown as PublicEpisodeSummary[], totalCount };
}

export async function findLatestPublishedEpisode(): Promise<PublicEpisodeSummary | null> {
  const collection = await getCollection();
  const raw = await collection.findOne(
    { status: 'published', publishedAt: { $lte: new Date() } },
    { projection: PUBLIC_SUMMARY_PROJECTION, sort: { publishedAt: -1 } },
  );
  return raw as unknown as PublicEpisodeSummary | null;
}

/** Previous/next episode within the same module, ordered by episode
 * number — powers the reader's "previous/next episode" navigation. */
export async function findAdjacentEpisodes(
  moduleId: string,
  episodeNumber: number,
): Promise<{ previous: PublicEpisodeSummary | null; next: PublicEpisodeSummary | null }> {
  const collection = await getCollection();
  const baseFilter: Filter<StoredEpisode> = {
    moduleId,
    status: 'published',
    publishedAt: { $lte: new Date() },
  };

  const [previous, next] = await Promise.all([
    collection.findOne(
      { ...baseFilter, episodeNumber: { $lt: episodeNumber } },
      { projection: PUBLIC_SUMMARY_PROJECTION, sort: { episodeNumber: -1 } },
    ),
    collection.findOne(
      { ...baseFilter, episodeNumber: { $gt: episodeNumber } },
      { projection: PUBLIC_SUMMARY_PROJECTION, sort: { episodeNumber: 1 } },
    ),
  ]);

  return {
    previous: previous as unknown as PublicEpisodeSummary | null,
    next: next as unknown as PublicEpisodeSummary | null,
  };
}

export interface ListEpisodesForAdminOptions {
  page: number;
  pageSize: number;
  status?: ContentStatus;
  seriesId?: string;
}

export async function listEpisodesForAdmin(
  options: ListEpisodesForAdminOptions,
): Promise<{ items: EpisodeDocument[]; totalCount: number }> {
  const collection = await getCollection();
  const filter: Filter<StoredEpisode> = {};
  if (options.status) filter.status = options.status;
  if (options.seriesId) filter.seriesId = options.seriesId;

  const [items, totalCount] = await Promise.all([
    collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items.map(toEpisodeDocument), totalCount };
}

export async function countEpisodesByStatus(): Promise<Record<ContentStatus, number>> {
  const collection = await getCollection();
  const results = await collection
    .aggregate<{ _id: ContentStatus; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    .toArray();

  const counts: Record<ContentStatus, number> = { draft: 0, scheduled: 0, published: 0, archived: 0 };
  for (const row of results) counts[row._id] = row.count;
  return counts;
}

export async function listRecentlyEditedEpisodes(limit: number): Promise<EpisodeDocument[]> {
  const collection = await getCollection();
  const raw = await collection.find({}).sort({ updatedAt: -1 }).limit(limit).toArray();
  return raw.map(toEpisodeDocument);
}

export async function countEpisodesForModule(moduleId: string): Promise<number> {
  const collection = await getCollection();
  return collection.countDocuments({ moduleId });
}

export async function countEpisodesForSeries(seriesId: string): Promise<number> {
  const collection = await getCollection();
  return collection.countDocuments({ seriesId });
}

/**
 * MVP full-text search over published episodes, backed by the MongoDB
 * text index created in `ensureEpisodeIndexes`. Kept behind this one
 * function (rather than inlined at the call site) so a later migration to
 * Atlas Search or a dedicated search service only requires changing this
 * function's body — `services/search.service.ts` and the `/search` page
 * depend only on this signature. See ADR 0002.
 */
export async function searchPublishedEpisodeSummaries(
  query: string,
  options: { page: number; pageSize: number },
): Promise<{ items: PublicEpisodeSummary[]; totalCount: number }> {
  const collection = await getCollection();
  const filter: Filter<StoredEpisode> = {
    status: 'published',
    publishedAt: { $lte: new Date() },
    $text: { $search: query },
  };

  const [items, totalCount] = await Promise.all([
    collection
      .find(filter, {
        projection: { ...PUBLIC_SUMMARY_PROJECTION, score: { $meta: 'textScore' } },
      })
      .sort({ score: { $meta: 'textScore' } })
      .skip((options.page - 1) * options.pageSize)
      .limit(options.pageSize)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items as unknown as PublicEpisodeSummary[], totalCount };
}

export async function findNextScheduledEpisode(): Promise<EpisodeDocument | null> {
  const collection = await getCollection();
  const raw = await collection.findOne(
    { status: 'scheduled', scheduledAt: { $gte: new Date() } },
    { sort: { scheduledAt: 1 } },
  );
  return raw ? toEpisodeDocument(raw) : null;
}
