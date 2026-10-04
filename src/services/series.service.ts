import { seriesInputSchema, type SeriesInput, type SeriesDocument } from '@/models/series.model';
import {
  createSeries as createSeriesRepo,
  updateSeries as updateSeriesRepo,
  deleteSeries as deleteSeriesRepo,
  isSeriesSlugTaken,
  findSeriesById,
} from '@/repositories/series.repository';
import { ensureUniqueSlug } from '@/lib/utilities/slug';
import { flattenZodIssues } from '@/lib/validation/common';
import { logAdminAction } from './audit.service';
import { ok, fail, type ServiceResult } from '@/lib/utilities/result';
import type { SafeAdmin } from '@/models/admin.model';

export async function createSeries(
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<SeriesDocument>> {
  const parsed = seriesInputSchema.safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));

  const slug = await ensureUniqueSlug(parsed.data.slug || parsed.data.title, (candidate) =>
    isSeriesSlugTaken(candidate),
  );

  const series = await createSeriesRepo({ ...parsed.data, slug });

  await logAdminAction({
    action: 'series.create',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'series',
    targetId: series._id,
    metadata: { title: series.title },
  });

  return ok(series);
}

export async function updateSeries(
  id: string,
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<SeriesDocument>> {
  const existing = await findSeriesById(id);
  if (!existing) return fail('Series not found.');

  const parsed = seriesInputSchema.partial().safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));

  let slug = existing.slug;
  if (parsed.data.slug && parsed.data.slug !== existing.slug) {
    slug = await ensureUniqueSlug(parsed.data.slug, (candidate) => isSeriesSlugTaken(candidate, id));
  }

  const updated = await updateSeriesRepo(id, { ...parsed.data, slug });
  if (!updated) return fail('Series not found.');

  await logAdminAction({
    action: 'series.update',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'series',
    targetId: id,
  });

  return ok(updated);
}

export async function deleteSeries(id: string, actor: SafeAdmin): Promise<ServiceResult<true>> {
  const existing = await findSeriesById(id);
  if (!existing) return fail('Series not found.');

  if (existing.totalModules > 0) {
    return fail('This series still has modules — remove or reassign them before deleting the series.');
  }

  await deleteSeriesRepo(id);
  await logAdminAction({
    action: 'series.delete',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'series',
    targetId: id,
    metadata: { title: existing.title },
  });

  return ok(true);
}

export type { SeriesInput };
