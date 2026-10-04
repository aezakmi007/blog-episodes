import { moduleInputSchema, type ModuleDocument } from '@/models/module.model';
import {
  createModule as createModuleRepo,
  updateModule as updateModuleRepo,
  deleteModule as deleteModuleRepo,
  isModuleSlugTaken,
  findModuleById,
} from '@/repositories/modules.repository';
import { adjustSeriesModuleCount, findSeriesById } from '@/repositories/series.repository';
import { countEpisodesForModule } from '@/repositories/episodes.repository';
import { ensureUniqueSlug } from '@/lib/utilities/slug';
import { flattenZodIssues } from '@/lib/validation/common';
import { logAdminAction } from './audit.service';
import { ok, fail, type ServiceResult } from '@/lib/utilities/result';
import type { SafeAdmin } from '@/models/admin.model';

export async function createModule(
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<ModuleDocument>> {
  const parsed = moduleInputSchema.safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));

  const series = await findSeriesById(parsed.data.seriesId);
  if (!series) return fail('Selected series does not exist.', { seriesId: 'Invalid series' });

  const slug = await ensureUniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
    isModuleSlugTaken(parsed.data.seriesId, candidate),
  );

  const moduleDoc = await createModuleRepo({ ...parsed.data, slug });
  await adjustSeriesModuleCount(parsed.data.seriesId, 1);

  await logAdminAction({
    action: 'module.create',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'module',
    targetId: moduleDoc._id,
    metadata: { title: moduleDoc.title, seriesId: moduleDoc.seriesId },
  });

  return ok(moduleDoc);
}

export async function updateModule(
  id: string,
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<ModuleDocument>> {
  const existing = await findModuleById(id);
  if (!existing) return fail('Module not found.');

  const parsed = moduleInputSchema.partial().safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));

  let slug = existing.slug;
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    slug = await ensureUniqueSlug(parsed.data.slug, (candidate) =>
      isModuleSlugTaken(existing.seriesId, candidate, id),
    );
  }

  const updated = await updateModuleRepo(id, { ...parsed.data, slug });
  if (!updated) return fail('Module not found.');

  await logAdminAction({
    action: 'module.update',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'module',
    targetId: id,
  });

  return ok(updated);
}

export async function deleteModule(id: string, actor: SafeAdmin): Promise<ServiceResult<true>> {
  const existing = await findModuleById(id);
  if (!existing) return fail('Module not found.');

  const episodeCount = await countEpisodesForModule(id);
  if (episodeCount > 0) {
    return fail('This module still has episodes — move or delete them before deleting the module.');
  }

  await deleteModuleRepo(id);
  await adjustSeriesModuleCount(existing.seriesId, -1);

  await logAdminAction({
    action: 'module.delete',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'module',
    targetId: id,
    metadata: { title: existing.title },
  });

  return ok(true);
}
