import Link from 'next/link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import { requireAdminSession } from '@/lib/auth/guards';
import { listEpisodesForAdmin } from '@/repositories/episodes.repository';
import EpisodeRowActions from '@/components/admin/EpisodeRowActions';
import type { ContentStatus } from '@/lib/validation/common';

const STATUS_TABS: Array<{ label: string; value: ContentStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
];

const PAGE_SIZE = 20;

export default async function AdminEpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminSession('/admin/episodes');
  const params = await searchParams;
  const status = (params.status as ContentStatus | undefined) ?? undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, totalCount } = await listEpisodesForAdmin({ page, pageSize: PAGE_SIZE, status });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Episodes
        </Typography>
        <Button
          component={Link}
          href="/admin/episodes/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          New episode
        </Button>
      </Stack>

      <Tabs value={status ?? 'all'} variant="scrollable" allowScrollButtonsMobile>
        {STATUS_TABS.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
            component={Link}
            href={tab.value === 'all' ? '/admin/episodes' : `/admin/episodes?status=${tab.value}`}
          />
        ))}
      </Tabs>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Series / Module</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Updated</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((episode) => (
            <TableRow key={episode._id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {episode.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  #{episode.episodeNumber} · {episode.teacherCharacter} teaches
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{episode.seriesTitle}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {episode.moduleTitle}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={episode.status}
                  size="small"
                  color={
                    episode.status === 'published'
                      ? 'success'
                      : episode.status === 'scheduled'
                        ? 'warning'
                        : 'default'
                  }
                />
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {new Date(episode.updatedAt).toLocaleDateString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <EpisodeRowActions episode={episode} />
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No episodes yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
          <Button
            component={Link}
            href={`/admin/episodes?${status ? `status=${status}&` : ''}page=${page - 1}`}
            disabled={page <= 1}
            size="small"
          >
            Previous
          </Button>
          <Typography variant="body2" color="text.secondary">
            Page {page} of {totalPages}
          </Typography>
          <Button
            component={Link}
            href={`/admin/episodes?${status ? `status=${status}&` : ''}page=${page + 1}`}
            disabled={page >= totalPages}
            size="small"
          >
            Next
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
