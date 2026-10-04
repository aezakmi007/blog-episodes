'use server';

import { getAdminSessionOrNull } from '@/lib/auth/guards';
import { siteSettingsInputSchema } from '@/models/site-settings.model';
import { updateSiteSettings } from '@/repositories/site-settings.repository';
import { logAdminAction } from '@/services/audit.service';
import { flattenZodIssues } from '@/lib/validation/common';
import { fail, ok, type ServiceResult } from '@/lib/utilities/result';
import type { SiteSettingsDocument } from '@/models/site-settings.model';

export async function updateSiteSettingsAction(
  rawInput: unknown,
): Promise<ServiceResult<SiteSettingsDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');

  // Settings affect the whole site, so this is restricted to the owner
  // role rather than any active admin — see lib/auth/guards.ts assertRole.
  if (session.admin.role !== 'owner') {
    return fail('Only an owner can change site-wide settings.');
  }

  const parsed = siteSettingsInputSchema.partial().safeParse(rawInput);
  if (!parsed.success) return fail('Please fix the highlighted fields.', flattenZodIssues(parsed.error));

  const updated = await updateSiteSettings(parsed.data, session.admin._id);

  await logAdminAction({
    action: 'settings.update',
    actorId: session.admin._id,
    actorEmail: session.admin.email,
    targetType: 'settings',
  });

  return ok(updated);
}
