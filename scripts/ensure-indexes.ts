import 'dotenv/config';
import { ensureSeriesIndexes } from '@/repositories/series.repository';
import { ensureModuleIndexes } from '@/repositories/modules.repository';
import { ensureEpisodeIndexes } from '@/repositories/episodes.repository';
import { ensureAdminIndexes } from '@/repositories/admins.repository';
import { ensureMediaIndexes } from '@/repositories/media.repository';
import { ensureAuditLogIndexes } from '@/repositories/audit-logs.repository';
import { ensureTagIndexes } from '@/repositories/tags.repository';

/**
 * Creates every index the application relies on. `createIndex` is
 * idempotent, so this is safe to run repeatedly (every deploy, every
 * local seed) without risk of duplicating or corrupting indexes.
 */
export async function ensureAllIndexes(): Promise<void> {
  await Promise.all([
    ensureSeriesIndexes(),
    ensureModuleIndexes(),
    ensureEpisodeIndexes(),
    ensureAdminIndexes(),
    ensureMediaIndexes(),
    ensureAuditLogIndexes(),
    ensureTagIndexes(),
  ]);
}

if (require.main === module) {
  ensureAllIndexes()
    .then(() => {
      console.warn('All indexes ensured.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('Failed to ensure indexes:', error);
      process.exit(1);
    });
}
