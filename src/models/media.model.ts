import { z } from 'zod';

/** `media` collection — metadata for uploaded assets. The binary itself is
 * stored by whatever storage backend is configured (local /public in
 * development, an object store in production — see docs/architecture.md);
 * this document is the queryable/manageable record admins see in
 * /admin/media. */
export const mediaInputSchema = z.object({
  filename: z.string().min(1).max(260),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  altText: z.string().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type MediaInput = z.infer<typeof mediaInputSchema>;

export interface MediaDocument extends MediaInput {
  _id: string;
  uploadedBy: string;
  createdAt: Date;
}
