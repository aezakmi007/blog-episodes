import { z } from 'zod';

/** `siteSettings` — a single-document collection (one row, fixed id
 * `"global"`) holding application-level configuration editable from
 * /admin/settings, so these values don't require a redeploy to change. */
export const siteSettingsInputSchema = z.object({
  siteName: z.string().min(1).max(120).default('Shyam & Salim Learn ML'),
  tagline: z.string().min(1).max(200).default('Do dost. Ek chai. Aur Machine Learning.'),
  defaultOgImage: z.string().optional(),
  maintenanceMode: z.boolean().default(false),
  newsletterEnabled: z.boolean().default(false),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;

export interface SiteSettingsDocument extends SiteSettingsInput {
  _id: 'global';
  updatedBy: string;
  updatedAt: Date;
}

export const SITE_SETTINGS_DOC_ID = 'global' as const;
