'use server';

import { getAdminSessionOrNull, assertRole } from '@/lib/auth/guards';
import * as moduleService from '@/services/module.service';
import { fail, type ServiceResult } from '@/lib/utilities/result';
import type { ModuleDocument } from '@/models/module.model';

export async function createModuleAction(input: unknown): Promise<ServiceResult<ModuleDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return moduleService.createModule(input, session.admin);
}

export async function updateModuleAction(
  id: string,
  input: unknown,
): Promise<ServiceResult<ModuleDocument>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  return moduleService.updateModule(id, input, session.admin);
}

export async function deleteModuleAction(id: string): Promise<ServiceResult<true>> {
  const session = await getAdminSessionOrNull();
  if (!session) return fail('Your session has expired. Please sign in again.');
  if (!assertRole(session, ['owner'])) return fail('Only an owner can delete a module.');
  return moduleService.deleteModule(id, session.admin);
}
