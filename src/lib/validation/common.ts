import { z } from 'zod';

/** A MongoDB ObjectId, represented as its 24-char hex string at every API
 * boundary. Repositories convert to/from `ObjectId` — nothing above the
 * repository layer ever imports `ObjectId` directly. */
export const objectIdStringSchema = z
  .string()
  .regex(/^[0-9a-f]{24}$/i, 'Must be a valid identifier');

/** Slugs are lowercase, hyphen-separated, URL-safe, and stable once
 * published — see docs/architecture.md "Slugs and relationships". */
export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers and hyphens only');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  items: T[],
  totalCount: number,
  { page, pageSize }: PaginationQuery,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

export const contentStatusSchema = z.enum(['draft', 'scheduled', 'published', 'archived']);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

/** Flattens a ZodError into a flat `{ "field.path": "message" }` map — the
 * shape every admin form in this app uses for inline validation errors.
 * Shared here so every service formats validation failures identically. */
export function flattenZodIssues(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export const seoSchema = z.object({
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  canonicalUrl: z.string().url().optional(),
  ogTitle: z.string().max(70).optional(),
  ogDescription: z.string().max(200).optional(),
  ogImage: z.string().optional(),
  noIndex: z.boolean().default(false),
});
export type Seo = z.infer<typeof seoSchema>;
