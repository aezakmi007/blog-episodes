import { z } from 'zod';

/** `auditLogs` collection — append-only record of administrative events.
 * Written by services/audit.service.ts, never directly by route handlers,
 * so every mutation path logs consistently. Never store passwords,
 * session tokens or full request bodies here — only the identifiers and
 * outcome needed to answer "who did what, when". */
export const auditActionSchema = z.enum([
  'login.success',
  'login.failure',
  'logout',
  'episode.create',
  'episode.update',
  'episode.publish',
  'episode.unpublish',
  'episode.schedule',
  'episode.delete',
  'series.create',
  'series.update',
  'series.delete',
  'module.create',
  'module.update',
  'module.delete',
  'media.upload',
  'media.delete',
  'settings.update',
]);
export type AuditAction = z.infer<typeof auditActionSchema>;

export interface AuditLogDocument {
  _id: string;
  action: AuditAction;
  /** Admin id, or null for a failed login against an email that may not
   * correspond to any account (avoids leaking account existence in logs
   * read by anyone other than a trusted operator). */
  actorId: string | null;
  actorEmail?: string;
  targetType?: 'episode' | 'series' | 'module' | 'media' | 'settings' | 'admin';
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
  ipAddress?: string;
  createdAt: Date;
}
