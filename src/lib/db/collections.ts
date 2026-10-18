/**
 * Canonical collection name constants. Centralized so a rename or
 * namespace prefix only ever needs to change in one place, and so
 * repositories never reference a raw string literal.
 */
export const COLLECTIONS = {
  ADMINS: 'admins',
  SERIES: 'series',
  MODULES: 'modules',
  EPISODES: 'episodes',
  MEDIA: 'media',
  AUDIT_LOGS: 'auditLogs',
  SITE_SETTINGS: 'siteSettings',
  TAGS: 'tags',
  PAGE_VIEWS: 'pageViews',
} as const;

/** GridFS bucket name for episode audio files — backed by two real
 * collections, `episodeAudio.files` and `episodeAudio.chunks`, that the
 * MongoDB driver manages itself (see repositories/audio.repository.ts). */
export const AUDIO_BUCKET_NAME = 'episodeAudio';

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
