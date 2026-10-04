import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { listPublishedSeries } from '@/repositories/series.repository';

export const metadata: Metadata = {
  title: 'All series',
  description: 'Every learning series from Shyam & Salim — Machine Learning, and more to come.',
};

export const revalidate = 3600;

export default async function SeriesIndexPage() {
  const series = await listPublishedSeries();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
        Series
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Each series is a full subject, taught module by module, one Sunday conversation at a time.
      </Typography>

      <Grid container spacing={3}>
        {series.map((item) => (
          <Grid key={item._id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea component={Link} href={`/series/${item.slug}`} sx={{ height: '100%', p: 0.5 }}>
                <CardContent>
                  <Chip label={`${item.totalModules} modules`} size="small" sx={{ mb: 1.5 }} />
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.shortDescription}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {series.length === 0 && (
          <Grid size={12}>
            <Stack alignItems="center" sx={{ py: 8 }}>
              <Typography variant="body1" color="text.secondary">
                No series published yet — check back soon.
              </Typography>
            </Stack>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
