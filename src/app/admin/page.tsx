import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import { requireAdminSession } from '@/lib/auth/guards';
import {
  countEpisodesByStatus,
  listRecentlyEditedEpisodes,
  findNextScheduledEpisode,
} from '@/repositories/episodes.repository';
import { listSeriesForAdmin } from '@/repositories/series.repository';
import { listModulesForAdmin } from '@/repositories/modules.repository';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession('/admin');

  const [statusCounts, { totalCount: seriesCount }, modules, recentEpisodes, nextScheduled] = await Promise.all([
    countEpisodesByStatus(),
    listSeriesForAdmin({ page: 1, pageSize: 1 }),
    listModulesForAdmin(),
    listRecentlyEditedEpisodes(5),
    findNextScheduledEpisode(),
  ]);

  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Welcome back, {session.admin.email.split('@')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here&apos;s what&apos;s happening across the series.
          </Typography>
        </Stack>
        <Button component={Link} href="/admin/episodes/new" variant="contained" startIcon={<AddIcon />}>
          New episode
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Published" value={statusCounts.published} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Drafts" value={statusCounts.draft} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Scheduled" value={statusCounts.scheduled} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Archived" value={statusCounts.archived} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Series" value={seriesCount} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard label="Modules" value={modules.length} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'var(--font-display)' }}>
              Recently edited
            </Typography>
            <List disablePadding>
              {recentEpisodes.map((episode) => (
                <ListItemButton
                  key={episode._id}
                  component={Link}
                  href={`/admin/episodes/${episode._id}/edit`}
                  sx={{ borderRadius: 1.5, mb: 0.5 }}
                >
                  <ListItemText
                    primary={episode.title}
                    secondary={`${episode.seriesTitle} · updated ${new Date(episode.updatedAt).toLocaleDateString()}`}
                  />
                  <Chip
                    label={episode.status}
                    size="small"
                    color={episode.status === 'published' ? 'success' : 'default'}
                  />
                </ListItemButton>
              ))}
              {recentEpisodes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No episodes yet — create your first one.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'var(--font-display)' }}>
              Next Sunday
            </Typography>
            {nextScheduled ? (
              <Stack spacing={1}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {nextScheduled.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scheduled for{' '}
                  {nextScheduled.scheduledAt ? new Date(nextScheduled.scheduledAt).toLocaleString() : '—'}
                </Typography>
                <Button
                  component={Link}
                  href={`/admin/episodes/${nextScheduled._id}/edit`}
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  View episode
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nothing scheduled yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
