import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { requireAdminSession } from '@/lib/auth/guards';
import { listSeriesForAdmin } from '@/repositories/series.repository';
import { listModulesForAdmin } from '@/repositories/modules.repository';
import EpisodeForm from '@/components/admin/EpisodeForm';

export default async function NewEpisodePage() {
  await requireAdminSession('/admin/episodes/new');

  const [{ items: series }, modules] = await Promise.all([
    listSeriesForAdmin({ page: 1, pageSize: 100 }),
    listModulesForAdmin(),
  ]);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        New episode
      </Typography>
      <EpisodeForm
        mode="create"
        seriesOptions={series.map((s) => ({ id: s._id, title: s.title }))}
        moduleOptions={modules.map((m) => ({ id: m._id, seriesId: m.seriesId, title: m.title }))}
      />
    </Stack>
  );
}
