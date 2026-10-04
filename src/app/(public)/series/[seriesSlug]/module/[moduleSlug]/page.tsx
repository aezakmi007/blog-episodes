import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { findPublishedSeriesBySlug } from '@/repositories/series.repository';
import { findPublishedModuleBySlug } from '@/repositories/modules.repository';
import { listPublishedEpisodeSummaries } from '@/repositories/episodes.repository';
import AppBreadcrumbs from '@/components/layout/AppBreadcrumbs';
import { CHARACTERS } from '@/features/characters/characters.data';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seriesSlug: string; moduleSlug: string }>;
}): Promise<Metadata> {
  const { seriesSlug, moduleSlug } = await params;
  const series = await findPublishedSeriesBySlug(seriesSlug);
  if (!series) return {};
  const moduleDoc = await findPublishedModuleBySlug(series._id, moduleSlug);
  if (!moduleDoc) return {};
  return {
    title: moduleDoc.title,
    description: moduleDoc.description,
    alternates: { canonical: `${APP_URL}/series/${seriesSlug}/module/${moduleSlug}` },
  };
}

export default async function ModuleOverviewPage({
  params,
}: {
  params: Promise<{ seriesSlug: string; moduleSlug: string }>;
}) {
  const { seriesSlug, moduleSlug } = await params;
  const series = await findPublishedSeriesBySlug(seriesSlug);
  if (!series) notFound();

  const moduleDoc = await findPublishedModuleBySlug(series._id, moduleSlug);
  if (!moduleDoc) notFound();

  const { items: episodes } = await listPublishedEpisodeSummaries({
    page: 1,
    pageSize: 50,
    seriesSlug: series.slug,
    moduleSlug: moduleDoc.slug,
  });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <AppBreadcrumbs
        items={[
          { label: 'Series', href: '/series' },
          { label: series.title, href: `/series/${series.slug}` },
          { label: moduleDoc.title },
        ]}
      />

      <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700 }}>
        Module {moduleDoc.moduleNumber}
      </Typography>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        {moduleDoc.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        {moduleDoc.description}
      </Typography>

      <Stack spacing={2}>
        {episodes.map((episode) => (
          <Card key={episode.slug} variant="outlined">
            <CardActionArea component={Link} href={`/episodes/${episode.slug}`}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={`Episode ${episode.episodeNumber}`} size="small" />
                  <Chip
                    label={`${CHARACTERS[episode.teacherCharacter].displayName} teaches`}
                    size="small"
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {episode.readingTime} min read
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 0.5 }}>
                  {episode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {episode.excerpt}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {episodes.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Episodes for this module are coming soon.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
