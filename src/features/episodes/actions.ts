'use server';

import { getAdminSessionOrNull, assertRole } from '@/lib/auth/guards';
import * as episodeService from '@/services/episode.service';
import { fail, type ServiceResult } from '@/lib/utilities/result';
import type { EpisodeDocument } from '@/models/episode.model';

/**
 * Every exported function here re-checks the session itself
 * (`getAdminSessionOrNull`) even though it is only ever called from a
 * page already wrapped by app/admin/layout.tsx's `requireAdminSession()`.
 * That is deliberate, not redundant — see docs/architecture.md "Security
 * boundaries" and the brief's "every administrative mutation
 * independently verifies the session and admin role" requirement. A
 * Server Action can, in principle, be invoked directly (bypassing the
 * page that normally renders the button that calls it), so it must not
 * assume the caller already passed through a layout check.
 */
export async function createEpisodeAction(input: unknown): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.createEpisode(input, session.admin);
}

export async function updateEpisodeAction(
  id: string,
  input: unknown,
): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.updateEpisode(id, input, session.admin);
}

export async function publishEpisodeAction(id: string): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.publishEpisode(id, session.admin);
}

export async function unpublishEpisodeAction(id: string): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.unpublishEpisode(id, session.admin);
}

export async function archiveEpisodeAction(id: string): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.archiveEpisode(id, session.admin);
}

export async function scheduleEpisodeAction(
  id: string,
  scheduledAt: string,
): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.scheduleEpisode(id, new Date(scheduledAt), session.admin);
}

export async function deleteEpisodeAction(id: string): Promise<ServiceResult<true>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  if (!assertRole(session, ['owner'])) return fail('Only an owner can delete episodes.');
  return episodeService.deleteEpisode(id, session.admin);
}

export async function duplicateEpisodeAction(id: string): Promise<ServiceResult<EpisodeDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return episodeService.duplicateEpisode(id, session.admin);
}
