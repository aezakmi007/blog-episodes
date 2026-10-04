import Link from 'next/link';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { PublicEpisodeSummary } from '@/models/episode.model';

function NavCard({ episode, direction }: { episode: PublicEpisodeSummary; direction: 'previous' | 'next' }) {
  return (
    <Paper
      component={Link}
      href={`/episodes/${episode.slug}`}
      variant="outlined"
      sx={{
        p: 2.5,
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
        '&:hover': { borderColor: 'secondary.main' },
      }}
    >
      <Stack
        direction={direction === 'next' ? 'row-reverse' : 'row'}
        spacing={1}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack spacing={0.5} sx={{ textAlign: direction === 'next' ? 'right' : 'left' }}>
          <Typography variant="caption" color="text.secondary">
            {direction === 'previous' ? 'Previous episode' : 'Next episode'}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {episode.title}
          </Typography>
        </Stack>
        {direction === 'previous' ? <ArrowBackIcon color="action" /> : <ArrowForwardIcon color="action" />}
      </Stack>
    </Paper>
  );
}

export default function EpisodeAdjacentNav({
  previous,
  next,
}: {
  previous: PublicEpisodeSummary | null;
  next: PublicEpisodeSummary | null;
}) {
  if (!previous && !next) return null;

  return (
    <Grid container spacing={2} sx={{ mt: 4 }}>
      <Grid size={{ xs: 12, sm: 6 }}>{previous && <NavCard episode={previous} direction="previous" />}</Grid>
      <Grid size={{ xs: 12, sm: 6 }}>{next && <NavCard episode={next} direction="next" />}</Grid>
    </Grid>
  );
}
