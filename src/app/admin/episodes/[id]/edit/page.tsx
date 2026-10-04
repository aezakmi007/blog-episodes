import { notFound } from 'next/navigation';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { requireAdminSession } from '@/lib/auth/guards';
import { findEpisodeById } from '@/repositories/episodes.repository';
import { listSeriesForAdmin } from '@/repositories/series.repository';
import { listModulesForAdmin } from '@/repositories/modules.repository';
import EpisodeForm from '@/components/admin/EpisodeForm';

export default async function EditEpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminSession(`/admin/episodes/${id}/edit`);

  const [episode, { items: series }, modules] = await Promise.all([
    findEpisodeById(id),
    listSeriesForAdmin({ page: 1, pageSize: 100 }),
    listModulesForAdmin(),
  ]);

  if (!episode) notFound();

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Edit episode
      </Typography>
      <EpisodeForm
        mode="edit"
        episode={episode}
        seriesOptions={series.map((s) => ({ id: s._id, title: s.title }))}
        moduleOptions={modules.map((m) => ({ id: m._id, seriesId: m.seriesId, title: m.title }))}
      />
    </Stack>
  );
}
