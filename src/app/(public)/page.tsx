import type { Metadata } from 'next';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import { listPublishedSeries } from '@/repositories/series.repository';
import { listPublishedModulesForSeries } from '@/repositories/modules.repository';
import { listPublishedEpisodeSummaries, findLatestPublishedEpisode } from '@/repositories/episodes.repository';
import { CHARACTERS } from '@/features/characters/characters.data';
import CharacterAvatar from '@/components/story/CharacterAvatar';
import ContinueReadingRail from '@/components/home/ContinueReadingRail';

export const metadata: Metadata = {
  title: 'Home',
  description:
    'Do dost. Ek chai. Aur Machine Learning. Har Sunday Shyam aur Salim milte hain — kabhi Machine Learning samajhte hain, kabhi bachpan ke kisse nikal aate hain.',
};

export const revalidate = 1800;

export default async function HomePage() {
  const [series, latestEpisode, { items: recentEpisodes }] = await Promise.all([
    listPublishedSeries(),
    findLatestPublishedEpisode(),
    listPublishedEpisodeSummaries({ page: 1, pageSize: 8 }),
  ]);

  const seriesProgress = await Promise.all(
    series.map(async (item) => {
      const [modules, { items: episodes }] = await Promise.all([
        listPublishedModulesForSeries(item._id),
        listPublishedEpisodeSummaries({ page: 1, pageSize: 100, seriesSlug: item.slug }),
      ]);
      const modulesWithEpisodes = new Set(episodes.map((e) => e.moduleSlug)).size;
      return { series: item, totalModules: modules.length, modulesWithEpisodes, episodeCount: episodes.length };
    }),
  );

  const popularConcepts = Array.from(
    new Map(
      recentEpisodes
        .flatMap((episode) => episode.tags.map((tag) => [tag, episode] as const))
        .slice(0, 8),
    ).entries(),
  );

  return (
    <>
      {/* 1. Cinematic hero */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(180deg, var(--mui-palette-background-paper) 0%, var(--mui-palette-background-default) 100%)',
          '[data-mui-color-scheme="dark"] &': {
            background:
              'linear-gradient(180deg, var(--mui-palette-background-default) 0%, var(--mui-palette-background-paper) 100%)',
          },
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3} alignItems="flex-start">
                <Typography
                  variant="overline"
                  sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.12em' }}
                >
                  Machine Learning · Season 1
                </Typography>
                <Typography
                  component="h1"
                  variant="h2"
                  sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, maxWidth: 640 }}
                >
                  Do dost. Ek chai. Aur Machine Learning.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, fontSize: '1.1rem' }}>
                  Har Sunday Shyam aur Salim milte hain. Kabhi Machine Learning samajhte hain, kabhi
                  bachpan ke kisse nikal aate hain, aur kabhi padhai se zyada ek-doosre ki taang
                  kheench lete hain.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                  <Button component={Link} href="/series" variant="contained" size="large">
                    Start learning
                  </Button>
                  <Button component={Link} href="/characters" variant="outlined" size="large">
                    Meet Shyam &amp; Salim
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            {/* Elegant placeholder for a future illustrated Sunday scene —
                an abstract, original composition (gradients + shapes),
                never copyrighted character artwork. */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                aria-hidden="true"
                sx={{
                  position: 'relative',
                  height: { xs: 240, md: 320 },
                  borderRadius: 4,
                  background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--mui-palette-warning-main) 20%, transparent), transparent 60%),
                     radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--mui-palette-secondary-main) 20%, transparent), transparent 60%),
                     linear-gradient(135deg, color-mix(in srgb, var(--mui-palette-primary-main) 13%, transparent), transparent)`,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack direction="row" spacing={-1.5}>
                  <CharacterAvatar character={CHARACTERS.shyam} size={88} />
                  <CharacterAvatar character={CHARACTERS.salim} size={88} />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <ContinueReadingRail candidates={recentEpisodes} />

        {/* 3. Latest Sunday episode */}
        {latestEpisode && (
          <Box component="section" sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
              Latest Sunday
            </Typography>
            <Card variant="outlined">
              <CardActionArea component={Link} href={`/episodes/${latestEpisode.slug}`}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
                    <Chip
                      label={`${CHARACTERS[latestEpisode.teacherCharacter].displayName} teaches`}
                      size="small"
                      color="secondary"
                    />
                    <Chip label={`${latestEpisode.readingTime} min read`} size="small" variant="outlined" />
                  </Stack>
                  <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
                    {latestEpisode.title}
                  </Typography>
                  {latestEpisode.subtitle && (
                    <Typography variant="body1" color="text.secondary">
                      {latestEpisode.subtitle}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        )}

        {/* 2. Introduction to Shyam and Salim */}
        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
            Who&apos;s teaching?
          </Typography>
          <Grid container spacing={2}>
            {Object.values(CHARACTERS).map((character) => (
              <Grid key={character.id} size={{ xs: 12, sm: 6 }}>
                <Paper
                  component={Link}
                  href="/characters"
                  variant="outlined"
                  sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
                >
                  <CharacterAvatar character={character} size={48} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {character.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {character.shortBio}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 5 & 6. Current learning series + module progress */}
        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
            Current series
          </Typography>
          <Grid container spacing={2}>
            {seriesProgress.map(({ series: item, totalModules, modulesWithEpisodes, episodeCount }) => (
              <Grid key={item._id} size={{ xs: 12, sm: 6 }}>
                <Paper
                  component={Link}
                  href={`/series/${item.slug}`}
                  variant="outlined"
                  sx={{ p: 2.5, display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {episodeCount} episode{episodeCount === 1 ? '' : 's'} across {totalModules} module
                    {totalModules === 1 ? '' : 's'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={totalModules > 0 ? (modulesWithEpisodes / totalModules) * 100 : 0}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* 7. Popular concepts */}
        {popularConcepts.length > 0 && (
          <Box component="section" sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
              Popular concepts
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {popularConcepts.map(([tag, episode]) => (
                <Chip
                  key={tag}
                  component={Link}
                  href={`/topics/${tag}`}
                  label={tag}
                  clickable
                  variant="outlined"
                  title={`Featured in "${episode.title}"`}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ mb: 6 }} />

        {/* 8. How alternate-Sunday teaching works */}
        <Box component="section" sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
            How it works
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
            On one Sunday, Shyam teaches Salim. The next, Salim teaches Shyam. Each episode marks
            who&apos;s in the teacher&apos;s seat that week, so the explanations always come from
            someone who was recently exactly as confused as the reader.
          </Typography>
        </Box>
      </Container>
    </>
  );
}
