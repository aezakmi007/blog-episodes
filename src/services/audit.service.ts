import { recordAuditLog } from '@/repositories/audit-logs.repository';
import type { AuditAction } from '@/models/audit-log.model';

export interface LogAdminActionInput {
  action: AuditAction;
  actorId: string;
  actorEmail?: string;
  targetType?: 'episode' | 'series' | 'module' | 'media' | 'settings' | 'admin';
  targetId?: string;
  metadata?: Record<string, string | number | boolean>;
}

/** Thin wrapper so every service calls one function with one shape,
 * instead of constructing `createdAt` and remembering the exact field
 * names at every call site. */
export async function logAdminAction(input: LogAdminActionInput): Promise<void> {
  await recordAuditLog({ ...input, createdAt: new Date() });
}
