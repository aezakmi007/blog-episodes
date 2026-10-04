import { z } from 'zod';
import { slugSchema } from '@/lib/validation/common';

/** `tags` collection — canonical metadata for episode tags, so /topics can
 * list and describe each one rather than just surfacing a raw string. */
export const tagInputSchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugSchema,
  description: z.string().max(400).optional(),
});
export type TagInput = z.infer<typeof tagInputSchema>;

export interface TagDocument extends TagInput {
  _id: string;
  /** Denormalized count, refreshed whenever an episode is published,
   * unpublished or retagged — see services/tags.service.ts. */
  episodeCount: number;
  createdAt: Date;
  updatedAt: Date;
}
