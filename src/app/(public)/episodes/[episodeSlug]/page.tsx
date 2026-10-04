import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { findPublishedEpisodeBySlug, findAdjacentEpisodes } from '@/repositories/episodes.repository';
import { toPublicContentBlocks } from '@/models/content-block.model';
import { CHARACTERS } from '@/features/characters/characters.data';
import CharacterAvatar from '@/components/story/CharacterAvatar';
import AppBreadcrumbs from '@/components/layout/AppBreadcrumbs';
import ReadingProgress from '@/components/episode/ReadingProgress';
import TableOfContents from '@/components/episode/TableOfContents';
import { buildTocEntries } from '@/components/episode/toc';
import ContentBlockRenderer from '@/components/episode/ContentBlockRenderer';
import EpisodeAdjacentNav from '@/components/episode/EpisodeAdjacentNav';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/structured-data';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ episodeSlug: string }>;
}): Promise<Metadata> {
  const { episodeSlug } = await params;
  const episode = await findPublishedEpisodeBySlug(episodeSlug);
  if (!episode) return {};

  const title = episode.seo?.metaTitle || episode.title;
  const description = episode.seo?.metaDescription || episode.excerpt;
  const canonical = episode.seo?.canonicalUrl || `${APP_URL}/episodes/${episode.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: episode.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: episode.seo?.ogTitle || title,
      description: episode.seo?.ogDescription || description,
      type: 'article',
      url: canonical,
      images: episode.heroImage ? [episode.heroImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: episode.seo?.ogTitle || title,
      description: episode.seo?.ogDescription || description,
      images: episode.heroImage ? [episode.heroImage] : undefined,
    },
  };
}

export default async function EpisodePage({
  params,
}: {
  params: Promise<{ episodeSlug: string }>;
}) {
  const { episodeSlug } = await params;
  const episode = await findPublishedEpisodeBySlug(episodeSlug);
  if (!episode) notFound();

  const { previous, next } = await findAdjacentEpisodes(episode.moduleId, episode.episodeNumber);
  const publicBlocks = toPublicContentBlocks(episode.contentBlocks);
  const tocEntries = buildTocEntries(publicBlocks);
  const teacher = CHARACTERS[episode.teacherCharacter];
  const student = CHARACTERS[episode.studentCharacter];

  const articleSchema = buildArticleSchema(episode, APP_URL);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: APP_URL },
    { name: episode.seriesTitle, url: `${APP_URL}/series/${episode.seriesSlug}` },
    { name: episode.moduleTitle, url: `${APP_URL}/series/${episode.seriesSlug}/module/${episode.moduleSlug}` },
    { name: episode.title, url: `${APP_URL}/episodes/${episode.slug}` },
  ]);

  return (
    <>
      {/* Server-generated structured data, not user-authored HTML — safe
          to inline as JSON. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ReadingProgress episodeSlug={episode.slug} />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <AppBreadcrumbs
          items={[
            { label: 'Series', href: '/series' },
            { label: episode.seriesTitle, href: `/series/${episode.seriesSlug}` },
            { label: episode.moduleTitle, href: `/series/${episode.seriesSlug}/module/${episode.moduleSlug}` },
            { label: episode.title },
          ]}
        />

        <Stack spacing={1.5} sx={{ mb: 4, maxWidth: 760 }}>
          <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700 }}>
            Episode {episode.episodeNumber}
          </Typography>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            {episode.title}
          </Typography>
          {episode.subtitle && (
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              {episode.subtitle}
            </Typography>
          )}

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pt: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CharacterAvatar character={teacher} size={32} />
              <Typography variant="body2">
                <strong>{teacher.displayName}</strong> teaches
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <CharacterAvatar character={student} size={32} />
              <Typography variant="body2">
                <strong>{student.displayName}</strong> learns
              </Typography>
            </Stack>
            <Chip
              icon={<ScheduleIcon />}
              label={`${episode.readingTime} min read`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
              <TableOfContents entries={tocEntries} />
            </Box>

            <Box className="reading-measure" sx={{ maxWidth: { xs: '100%', md: 'var(--measure-reading)' } }}>
              {publicBlocks.map((block) => (
                <ContentBlockRenderer
                  key={block.id}
                  block={block}
                  episodeSlug={episode.slug}
                  episodeTitle={episode.title}
                />
              ))}
            </Box>

            <EpisodeAdjacentNav previous={previous} next={next} />
          </Box>

          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <TableOfContents entries={tocEntries} />
          </Box>
        </Box>
      </Container>
    </>
  );
}
