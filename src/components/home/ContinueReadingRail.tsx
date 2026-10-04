'use client';

import * as React from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { getAllReadingProgress } from '@/lib/utilities/reading-progress-client';
import type { PublicEpisodeSummary } from '@/models/episode.model';

/**
 * Reads per-episode scroll progress out of localStorage (client-only —
 * there is nothing to read on the server) and cross-references it against
 * the recent-episode list the page already fetched, rather than making a
 * second request. Renders nothing until mounted, and nothing at all if
 * the visitor has no in-progress episodes — this section simply doesn't
 * appear for a first-time visitor.
 */
export default function ContinueReadingRail({ candidates }: { candidates: PublicEpisodeSummary[] }) {
  const [inProgress, setInProgress] = React.useState<Array<PublicEpisodeSummary & { fraction: number }>>([]);

  React.useEffect(() => {
    const progress = getAllReadingProgress();
    const matches = candidates
      .map((episode) => ({ ...episode, fraction: progress[episode.slug] ?? 0 }))
      .filter((episode) => episode.fraction > 0.05 && episode.fraction < 0.95);
    setInProgress(matches);
  }, [candidates]);

  if (inProgress.length === 0) return null;

  return (
    <Box component="section" aria-label="Continue reading" sx={{ mb: 6 }}>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
        Continue reading
      </Typography>
      <Stack spacing={1.5}>
        {inProgress.map((episode) => (
          <Paper
            key={episode.slug}
            component={Link}
            href={`/episodes/${episode.slug}`}
            variant="outlined"
            sx={{ p: 2, display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.75 }}>
              {episode.title}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.round(episode.fraction * 100)}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
