import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import { findTagBySlug } from '@/repositories/tags.repository';
import { listPublishedEpisodeSummaries } from '@/repositories/episodes.repository';
import AppBreadcrumbs from '@/components/layout/AppBreadcrumbs';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}): Promise<Metadata> {
  const { topicSlug } = await params;
  const tag = await findTagBySlug(topicSlug);
  if (!tag) return {};
  return {
    title: tag.name,
    description: tag.description ?? `Episodes covering ${tag.name}.`,
    alternates: { canonical: `${APP_URL}/topics/${tag.slug}` },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  const tag = await findTagBySlug(topicSlug);
  if (!tag) notFound();

  const { items: episodes } = await listPublishedEpisodeSummaries({ page: 1, pageSize: 50, tag: tag.slug });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <AppBreadcrumbs items={[{ label: 'Topics', href: '/topics' }, { label: tag.name }]} />
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        {tag.name}
      </Typography>
      {tag.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
          {tag.description}
        </Typography>
      )}

      <Stack spacing={2}>
        {episodes.map((episode) => (
          <Card key={episode.slug} variant="outlined">
            <CardActionArea component={Link} href={`/episodes/${episode.slug}`}>
              <CardContent>
                <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
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
            No published episodes for this topic yet.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
