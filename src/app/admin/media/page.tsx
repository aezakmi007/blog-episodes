import { requireAdminSession } from '@/lib/auth/guards';
import { listMedia } from '@/repositories/media.repository';
import MediaManager from '@/components/admin/MediaManager';

export default async function AdminMediaPage() {
  await requireAdminSession('/admin/media');
  const { items } = await listMedia(1, 60);
  return <MediaManager media={items} />;
}
