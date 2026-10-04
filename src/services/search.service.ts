import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import { searchPublishedEpisodeSummaries } from '@/repositories/episodes.repository';
import type { PublicEpisodeSummary } from '@/models/episode.model';
import type { SeriesDocument } from '@/models/series.model';
import type { ModuleDocument } from '@/models/module.model';

/** Narrow projections for the title-match queries below — explicit
 * generics on `db.collection<T>()` so every field accessed here is
 * type-checked against the real document shape rather than falling back
 * to a loose `Document` index signature. */
type StoredSeries = Omit<SeriesDocument, '_id'>;
type StoredModule = Omit<ModuleDocument, '_id'>;

export interface SearchResult {
  kind: 'episode' | 'series' | 'module';
  title: string;
  description: string;
  href: string;
}

const RESULTS_PER_PAGE = 10;

/**
 * Combines the MongoDB text-indexed episode search with a lightweight
 * title match against series and modules (small collections — a case-
 * insensitive regex scan is appropriate at this scale and avoids a second
 * text index). Mirrors the brief's required search scope: episode title,
 * excerpt, tags, concepts, series name, module name.
 */
export async function searchSite(
  query: string,
  page: number,
): Promise<{ items: SearchResult[]; totalCount: number }> {
  const trimmed = query.trim();
  if (!trimmed) return { items: [], totalCount: 0 };

  const db = await getDb();
  const nameRegex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const [episodeResults, seriesMatches, moduleMatches] = await Promise.all([
    searchPublishedEpisodeSummaries(trimmed, { page, pageSize: RESULTS_PER_PAGE }),
    db
      .collection<StoredSeries>(COLLECTIONS.SERIES)
      .find({ status: 'published', title: nameRegex })
      .limit(5)
      .toArray(),
    db
      .collection<StoredModule>(COLLECTIONS.MODULES)
      .find({ status: 'published', title: nameRegex })
      .limit(5)
      .toArray(),
  ]);

  const episodeItems: SearchResult[] = episodeResults.items.map((episode: PublicEpisodeSummary) => ({
    kind: 'episode',
    title: episode.title,
    description: episode.excerpt,
    href: `/episodes/${episode.slug}`,
  }));

  const seriesItems: SearchResult[] = seriesMatches.map((s) => ({
    kind: 'series',
    title: s.title,
    description: s.shortDescription,
    href: `/series/${s.slug}`,
  }));

  const moduleSeriesIds = [...new Set(moduleMatches.map((m) => m.seriesId))].filter((id) =>
    ObjectId.isValid(id),
  );
  const parentSeries = moduleSeriesIds.length
    ? await db
        .collection<StoredSeries>(COLLECTIONS.SERIES)
        .find({ _id: { $in: moduleSeriesIds.map((id) => new ObjectId(id)) } })
        .toArray()
    : [];
  const seriesSlugById = new Map(parentSeries.map((s) => [s._id.toHexString(), s.slug]));

  const moduleItems: SearchResult[] = moduleMatches
    .map((m): SearchResult | null => {
      const seriesSlug = seriesSlugById.get(m.seriesId);
      if (!seriesSlug) return null;
      return {
        kind: 'module',
        title: m.title,
        description: m.description,
        href: `/series/${seriesSlug}/module/${m.slug}`,
      };
    })
    .filter((item): item is SearchResult => item !== null);

  // Only include series/module matches on page 1 — pagination tracks the
  // (usually much larger) episode result set.
  const items = page === 1 ? [...seriesItems, ...moduleItems, ...episodeItems] : episodeItems;

  return { items, totalCount: episodeResults.totalCount + (page === 1 ? seriesItems.length + moduleItems.length : 0) };
}
