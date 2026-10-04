import { Collection } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import {
  SITE_SETTINGS_DOC_ID,
  type SiteSettingsDocument,
  type SiteSettingsInput,
} from '@/models/site-settings.model';

async function getCollection(): Promise<Collection<SiteSettingsDocument>> {
  const db = await getDb();
  return db.collection<SiteSettingsDocument>(COLLECTIONS.SITE_SETTINGS);
}

const DEFAULTS: Omit<SiteSettingsDocument, 'updatedBy' | 'updatedAt'> = {
  _id: SITE_SETTINGS_DOC_ID,
  siteName: 'Shyam & Salim Learn ML',
  tagline: 'Do dost. Ek chai. Aur Machine Learning.',
  maintenanceMode: false,
  newsletterEnabled: false,
};

export async function getSiteSettings(): Promise<SiteSettingsDocument> {
  const collection = await getCollection();
  const existing = await collection.findOne({ _id: SITE_SETTINGS_DOC_ID });
  if (existing) return existing;

  // Lazily create the single settings document on first read so a fresh
  // database doesn't need a separate migration step for this collection.
  const fallback: SiteSettingsDocument = {
    ...DEFAULTS,
    updatedBy: 'system',
    updatedAt: new Date(),
  };
  await collection.insertOne(fallback);
  return fallback;
}

export async function updateSiteSettings(
  patch: Partial<SiteSettingsInput>,
  updatedBy: string,
): Promise<SiteSettingsDocument> {
  const collection = await getCollection();
  const result = await collection.findOneAndUpdate(
    { _id: SITE_SETTINGS_DOC_ID },
    { $set: { ...patch, updatedBy, updatedAt: new Date() } },
    { returnDocument: 'after', upsert: true },
  );
  if (!result) {
    throw new Error('Failed to update site settings');
  }
  return result;
}
