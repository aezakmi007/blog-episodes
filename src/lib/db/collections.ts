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

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
