'use server';

import { getAdminSessionOrNull } from '@/lib/auth/guards';
import * as mediaService from '@/services/media.service';
import { fail, type ServiceResult } from '@/lib/utilities/result';
import type { MediaDocument } from '@/models/media.model';

export async function uploadMediaAction(formData: FormData): Promise<ServiceResult<MediaDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');

  const file = formData.get('file');
  if (!(file instanceof File)) return fail('No file provided.');

  return mediaService.uploadMedia(file, session.admin);
}

export async function deleteMediaAction(id: string): Promise<ServiceResult<true>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return mediaService.deleteMedia(id, session.admin);
}
