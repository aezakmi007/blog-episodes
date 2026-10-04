import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { listTags } from '@/repositories/tags.repository';

export const metadata: Metadata = {
  title: 'Topics',
  description: 'Browse every concept and topic covered across all episodes.',
};

export const revalidate = 3600;

export default async function TopicsPage() {
  const tags = await listTags();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        Topics
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
        Every concept, organized by topic rather than by episode.
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {tags.map((tag) => (
          <Chip
            key={tag.slug}
            component={Link}
            href={`/topics/${tag.slug}`}
            label={`${tag.name} (${tag.episodeCount})`}
            clickable
            variant="outlined"
          />
        ))}
        {tags.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No topics yet — check back once episodes are published.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
