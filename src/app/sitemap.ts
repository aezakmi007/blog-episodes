import type { MetadataRoute } from 'next';
import { listPublishedSeries } from '@/repositories/series.repository';
import { listPublishedModulesForSeries } from '@/repositories/modules.repository';
import { listPublishedEpisodeSummaries } from '@/repositories/episodes.repository';
import { listTags } from '@/repositories/tags.repository';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

// Generated on first request (and revalidated hourly) rather than at build
// time, so a transient DB/network hiccup during `next build` can't fail the
// whole deployment — consistent with the revalidate window used by /series
// and /topics, the other listing pages built from the same repositories.
export const revalidate = 3600;

/**
 * Dynamic sitemap covering every publicly indexable URL. Draft and
 * scheduled content is structurally excluded because it comes from the
 * same public-only repository functions the pages themselves use — there
 * is no separate "which URLs are public" list to keep in sync.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [series, tags, { items: episodes }] = await Promise.all([
    listPublishedSeries(),
    listTags(),
    listPublishedEpisodeSummaries({ page: 1, pageSize: 500 }),
  ]);

  const modulesBySeries = await Promise.all(
    series.map((s) => listPublishedModulesForSeries(s._id).then((modules) => ({ series: s, modules }))),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/series`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/topics`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${APP_URL}/characters`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${APP_URL}/series/${s.slug}`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const moduleRoutes: MetadataRoute.Sitemap = modulesBySeries.flatMap(({ series: s, modules }) =>
    modules.map((m) => ({
      url: `${APP_URL}/series/${s.slug}/module/${m.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  );

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((e) => ({
    url: `${APP_URL}/episodes/${e.slug}`,
    lastModified: e.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.9,
  }));

  const topicRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${APP_URL}/topics/${tag.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...seriesRoutes, ...moduleRoutes, ...episodeRoutes, ...topicRoutes];
}
