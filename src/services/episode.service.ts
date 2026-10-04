import { episodeInputSchema, type EpisodeDocument } from '@/models/episode.model';
import type { ContentBlock } from '@/models/content-block.model';
import {
  createEpisode as createEpisodeRepo,
  updateEpisode as updateEpisodeRepo,
  deleteEpisode as deleteEpisodeRepo,
  isEpisodeSlugTaken,
  findEpisodeById,
} from '@/repositories/episodes.repository';
import { findSeriesById } from '@/repositories/series.repository';
import { findModuleById } from '@/repositories/modules.repository';
import { upsertTag, adjustTagEpisodeCount } from '@/repositories/tags.repository';
import { ensureUniqueSlug, toSlug } from '@/lib/utilities/slug';
import { calculateReadingTime } from '@/lib/utilities/reading-time';
import { flattenZodIssues } from '@/lib/validation/common';
import { revalidateEpisodePaths } from '@/lib/seo/revalidate';
import { logAdminAction } from './audit.service';
import { ok, fail, type ServiceResult } from '@/lib/utilities/result';
import type { SafeAdmin } from '@/models/admin.model';

function deriveConcepts(blocks: ContentBlock[]): string[] {
  return blocks.filter((b): b is Extract<ContentBlock, { type: 'concept' }> => b.type === 'concept').map(
    (b) => b.anchorId,
  );
}

async function syncTags(tags: string[]): Promise<string[]> {
  const slugs: string[] = [];
  for (const tag of tags) {
    const slug = toSlug(tag);
    await upsertTag({ name: tag, slug });
    slugs.push(slug);
  }
  return slugs;
}

async function adjustTagCounts(tags: string[], delta: 1 | -1): Promise<void> {
  await Promise.all(tags.map((slug) => adjustTagEpisodeCount(slug, delta)));
}

function revalidate(episode: EpisodeDocument): void {
  revalidateEpisodePaths({
    episodeSlug: episode.slug,
    seriesSlug: episode.seriesSlug,
    moduleSlug: episode.moduleSlug,
  });
}

export async function createEpisode(
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<EpisodeDocument>> {
  const parsed = episodeInputSchema.safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));
  const input = parsed.data;

  const series = await findSeriesById(input.seriesId);
  if (!series) return fail('Selected series does not exist.', { seriesId: 'Invalid series' });

  const moduleDoc = await findModuleById(input.moduleId);
  if (!moduleDoc || moduleDoc.seriesId !== input.seriesId) {
    return fail('Selected module does not belong to the selected series.', { moduleId: 'Invalid module' });
  }

  const slug = await ensureUniqueSlug(input.slug || input.title, (candidate) => isEpisodeSlugTaken(candidate));
  const tagSlugs = await syncTags(input.tags);
  const concepts = deriveConcepts(input.contentBlocks);
  const readingTime = calculateReadingTime(input.contentBlocks);
  const now = new Date();
  const isPublishedNow = input.status === 'published';

  const episode = await createEpisodeRepo({
    ...input,
    slug,
    tags: tagSlugs,
    concepts,
    readingTime,
    seriesSlug: series.slug,
    seriesTitle: series.title,
    moduleSlug: moduleDoc.slug,
    moduleTitle: moduleDoc.title,
    publishedAt: isPublishedNow ? now : undefined,
    featured: input.featured,
    revision: 1,
    createdBy: actor._id,
    updatedBy: actor._id,
    createdAt: now,
    updatedAt: now,
  });

  if (isPublishedNow) await adjustTagCounts(tagSlugs, 1);

  await logAdminAction({
    action: 'episode.create',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'episode',
    targetId: episode._id,
    metadata: { title: episode.title, status: episode.status },
  });

  revalidate(episode);
  return ok(episode);
}

export async function updateEpisode(
  id: string,
  rawInput: unknown,
  actor: SafeAdmin,
): Promise<ServiceResult<EpisodeDocument>> {
  const existing = await findEpisodeById(id);
  if (!existing) return fail('Episode not found.');

  const parsed = episodeInputSchema.safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));
  const input = parsed.data;

  const series = await findSeriesById(input.seriesId);
  if (!series) return fail('Selected series does not exist.', { seriesId: 'Invalid series' });

  const moduleDoc = await findModuleById(input.moduleId);
  if (!moduleDoc || moduleDoc.seriesId !== input.seriesId) {
    return fail('Selected module does not belong to the selected series.', { moduleId: 'Invalid module' });
  }

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, (candidate) => isEpisodeSlugTaken(candidate, id));
  }

  const tagSlugs = await syncTags(input.tags);
  const concepts = deriveConcepts(input.contentBlocks);
  const readingTime = calculateReadingTime(input.contentBlocks);

  const wasPublished = existing.status === 'published';
  const willBePublished = input.status === 'published';

  const updated = await updateEpisodeRepo(id, {
    ...input,
    slug,
    tags: tagSlugs,
    concepts,
    readingTime,
    seriesSlug: series.slug,
    seriesTitle: series.title,
    moduleSlug: moduleDoc.slug,
    moduleTitle: moduleDoc.title,
    publishedAt: willBePublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    updatedBy: actor._id,
  });
  if (!updated) return fail('Episode not found.');

  // Keep tag episode counts accurate across: tag-set changes while
  // published, and publish/unpublish transitions.
  if (wasPublished && willBePublished) {
    const removed = existing.tags.filter((t) => !tagSlugs.includes(t));
    const added = tagSlugs.filter((t) => !existing.tags.includes(t));
    await adjustTagCounts(removed, -1);
    await adjustTagCounts(added, 1);
  } else if (!wasPublished && willBePublished) {
    await adjustTagCounts(tagSlugs, 1);
  } else if (wasPublished && !willBePublished) {
    await adjustTagCounts(existing.tags, -1);
  }

  await logAdminAction({
    action: 'episode.update',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'episode',
    targetId: id,
    metadata: { title: updated.title, status: updated.status },
  });

  revalidate(updated);
  // Also revalidate the previous slug/location in case the episode moved
  // series/module or its slug changed, so the old URL's cache clears too.
  if (existing.slug !== updated.slug || existing.seriesSlug !== updated.seriesSlug) {
    revalidate(existing);
  }

  return ok(updated);
}

async function setEpisodeStatus(
  id: string,
  status: EpisodeDocument['status'],
  actor: SafeAdmin,
  options: { scheduledAt?: Date } = {},
): Promise<ServiceResult<EpisodeDocument>> {
  const existing = await findEpisodeById(id);
  if (!existing) return fail('Episode not found.');

  const wasPublished = existing.status === 'published';
  const willBePublished = status === 'published';

  const updated = await updateEpisodeRepo(id, {
    status,
    scheduledAt: options.scheduledAt,
    publishedAt: willBePublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    updatedBy: actor._id,
  });
  if (!updated) return fail('Episode not found.');

  if (!wasPublished && willBePublished) await adjustTagCounts(existing.tags, 1);
  if (wasPublished && !willBePublished) await adjustTagCounts(existing.tags, -1);

  const actionMap: Record<EpisodeDocument['status'], 'episode.publish' | 'episode.unpublish' | 'episode.schedule'> = {
    published: 'episode.publish',
    draft: 'episode.unpublish',
    archived: 'episode.unpublish',
    scheduled: 'episode.schedule',
  };

  await logAdminAction({
    action: actionMap[status],
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'episode',
    targetId: id,
  });

  revalidate(updated);
  return ok(updated);
}

export async function publishEpisode(id: string, actor: SafeAdmin): Promise<ServiceResult<EpisodeDocument>> {
  return setEpisodeStatus(id, 'published', actor);
}

export async function unpublishEpisode(id: string, actor: SafeAdmin): Promise<ServiceResult<EpisodeDocument>> {
  return setEpisodeStatus(id, 'draft', actor);
}

export async function archiveEpisode(id: string, actor: SafeAdmin): Promise<ServiceResult<EpisodeDocument>> {
  return setEpisodeStatus(id, 'archived', actor);
}

export async function scheduleEpisode(
  id: string,
  scheduledAt: Date,
  actor: SafeAdmin,
): Promise<ServiceResult<EpisodeDocument>> {
  if (scheduledAt.getTime() <= Date.now()) {
    return fail('Scheduled time must be in the future.', { scheduledAt: 'Must be in the future' });
  }
  return setEpisodeStatus(id, 'scheduled', actor, { scheduledAt });
}

export async function deleteEpisode(id: string, actor: SafeAdmin): Promise<ServiceResult<true>> {
  const existing = await findEpisodeById(id);
  if (!existing) return fail('Episode not found.');

  await deleteEpisodeRepo(id);
  if (existing.status === 'published') await adjustTagCounts(existing.tags, -1);

  await logAdminAction({
    action: 'episode.delete',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'episode',
    targetId: id,
    metadata: { title: existing.title },
  });

  revalidate(existing);
  return ok(true);
}

export async function duplicateEpisode(
  id: string,
  actor: SafeAdmin,
): Promise<ServiceResult<EpisodeDocument>> {
  const existing = await findEpisodeById(id);
  if (!existing) return fail('Episode not found.');

  const duplicateSlug = await ensureUniqueSlug(`${existing.title} copy`, (candidate) =>
    isEpisodeSlugTaken(candidate),
  );
  const now = new Date();
  const { _id: _existingId, ...existingFields } = existing;

  const duplicate = await createEpisodeRepo({
    ...existingFields,
    slug: duplicateSlug,
    title: `${existing.title} (Copy)`,
    status: 'draft',
    publishedAt: undefined,
    scheduledAt: undefined,
    featured: false,
    revision: 1,
    createdBy: actor._id,
    updatedBy: actor._id,
    createdAt: now,
    updatedAt: now,
  });

  await logAdminAction({
    action: 'episode.create',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'episode',
    targetId: duplicate._id,
    metadata: { title: duplicate.title, duplicatedFrom: id },
  });

  return ok(duplicate);
}
