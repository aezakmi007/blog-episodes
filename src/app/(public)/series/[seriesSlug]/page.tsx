import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import { findPublishedSeriesBySlug } from '@/repositories/series.repository';
import { listPublishedModulesForSeries } from '@/repositories/modules.repository';
import AppBreadcrumbs from '@/components/layout/AppBreadcrumbs';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seriesSlug: string }>;
}): Promise<Metadata> {
  const { seriesSlug } = await params;
  const series = await findPublishedSeriesBySlug(seriesSlug);
  if (!series) return {};
  return {
    title: series.title,
    description: series.shortDescription,
    alternates: { canonical: `${APP_URL}/series/${series.slug}` },
  };
}

export default async function SeriesOverviewPage({
  params,
}: {
  params: Promise<{ seriesSlug: string }>;
}) {
  const { seriesSlug } = await params;
  const series = await findPublishedSeriesBySlug(seriesSlug);
  if (!series) notFound();

  const modules = await listPublishedModulesForSeries(series._id);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <AppBreadcrumbs items={[{ label: 'Series', href: '/series' }, { label: series.title }]} />

      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        {series.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        {series.description}
      </Typography>

      <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
        Modules
      </Typography>

      <Stack spacing={1.5}>
        {modules.map((moduleDoc) => (
          <Paper key={moduleDoc._id} variant="outlined">
            <List disablePadding>
              <ListItemButton
                component={Link}
                href={`/series/${series.slug}/module/${moduleDoc.slug}`}
                sx={{ py: 2 }}
              >
                <ListItemText
                  primary={`Module ${moduleDoc.moduleNumber}: ${moduleDoc.title}`}
                  secondary={moduleDoc.description}
                />
                <Chip label="View" size="small" variant="outlined" />
              </ListItemButton>
            </List>
          </Paper>
        ))}
        {modules.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            Modules for this series are coming soon.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
