import type { EpisodeDocument } from '@/models/episode.model';

/** Builds JSON-LD for an episode's Article schema. Returned as a plain
 * object — the caller serializes it into a <script type="application/
 * ld+json"> tag via next/script-free inline JSON (safe here because the
 * content is server-generated structured data, not user-supplied HTML). */
export function buildArticleSchema(episode: EpisodeDocument, appUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: episode.title,
    description: episode.excerpt,
    image: episode.heroImage ? [new URL(episode.heroImage, appUrl).toString()] : undefined,
    datePublished: episode.publishedAt?.toISOString(),
    dateModified: episode.updatedAt.toISOString(),
    author: [{ '@type': 'Organization', name: 'Shyam & Salim Learn ML' }],
    publisher: { '@type': 'Organization', name: 'Shyam & Salim Learn ML' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${appUrl}/episodes/${episode.slug}` },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
