import { z } from 'zod';
import { slugSchema, objectIdStringSchema, contentStatusSchema } from '@/lib/validation/common';

/** A `module` belongs to exactly one series (e.g. "Module 2: Understanding
 * and Preparing Data" under "Machine Learning with Shyam and Salim"). */
export const moduleInputSchema = z.object({
  seriesId: objectIdStringSchema,
  title: z.string().min(1).max(160),
  slug: slugSchema,
  description: z.string().min(1).max(2000),
  moduleNumber: z.number().int().min(1),
  displayOrder: z.number().int().min(0).default(0),
  coverImage: z.string().optional(),
  status: contentStatusSchema.default('draft'),
});
export type ModuleInput = z.infer<typeof moduleInputSchema>;

export interface ModuleDocument extends ModuleInput {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}
