import { requireAdminSession } from '@/lib/auth/guards';
import { listSeriesForAdmin } from '@/repositories/series.repository';
import SeriesManager from '@/components/admin/SeriesManager';

export default async function AdminSeriesPage() {
  await requireAdminSession('/admin/series');
  const { items } = await listSeriesForAdmin({ page: 1, pageSize: 100 });
  return <SeriesManager series={items} />;
}
