import { requireAdminSession } from '@/lib/auth/guards';
import { listModulesForAdmin } from '@/repositories/modules.repository';
import { listSeriesForAdmin } from '@/repositories/series.repository';
import ModulesManager from '@/components/admin/ModulesManager';

export default async function AdminModulesPage() {
  await requireAdminSession('/admin/modules');
  const [modules, { items: series }] = await Promise.all([
    listModulesForAdmin(),
    listSeriesForAdmin({ page: 1, pageSize: 100 }),
  ]);
  return <ModulesManager modules={modules} series={series} />;
}
