'use server';

import { getAdminSessionOrNull, assertRole } from '@/lib/auth/guards';
import * as seriesService from '@/services/series.service';
import { fail, type ServiceResult } from '@/lib/utilities/result';
import type { SeriesDocument } from '@/models/series.model';

export async function createSeriesAction(input: unknown): Promise<ServiceResult<SeriesDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return seriesService.createSeries(input, session.admin);
}

export async function updateSeriesAction(
  id: string,
  input: unknown,
): Promise<ServiceResult<SeriesDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return seriesService.updateSeries(id, input, session.admin);
}

export async function deleteSeriesAction(id: string): Promise<ServiceResult<true>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  if (!assertRole(session, ['owner'])) return fail('Only an owner can delete a series.');
  return seriesService.deleteSeries(id, session.admin);
}
