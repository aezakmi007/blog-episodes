import { z } from 'zod';
import { slugSchema, contentStatusSchema, seoSchema } from '@/lib/validation/common';

/**
 * A `series` groups modules (e.g. "Machine Learning with Shyam and
 * Salim"), and is the top-level unit a visitor browses from /series.
 * `_id` is added by the repository layer (Mongo generates it) — schemas
 * here validate the input a client/admin submits, not the stored document
 * shape 1:1.
 */
export const seriesInputSchema = z.object({
  title: z.string().min(1).max(160),
  slug: slugSchema,
  description: z.string().min(1).max(4000),
  shortDescription: z.string().min(1).max(280),
  coverImage: z.string().optional(),
  status: contentStatusSchema.default('draft'),
  displayOrder: z.number().int().min(0).default(0),
  metadata: seoSchema.optional(),
});
export type SeriesInput = z.infer<typeof seriesInputSchema>;

/** The shape stored in MongoDB (`series` collection). `totalModules` is
 * derived/cached by the service layer whenever a module is added, removed
 * or reassigned — it is never trusted from client input. */
export interface SeriesDocument extends SeriesInput {
  _id: string;
  totalModules: number;
  createdAt: Date;
  updatedAt: Date;
}
