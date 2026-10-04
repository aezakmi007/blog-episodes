import { z } from 'zod';
import {
  slugSchema,
  objectIdStringSchema,
  contentStatusSchema,
  seoSchema,
} from '@/lib/validation/common';
import { contentBlocksSchema } from './content-block.model';

const characterIdSchema = z.enum(['shyam', 'salim']);

/**
 * Admin-submitted episode payload. `readingTime`, `revision`, `publishedAt`,
 * `createdBy`/`updatedBy` are server-computed and intentionally absent from
 * the input schema — a client can never set them directly (see
 * services/episode.service.ts, Phase 4).
 */
export const episodeInputSchema = z
  .object({
    seriesId: objectIdStringSchema,
    moduleId: objectIdStringSchema,
    title: z.string().min(1).max(200),
    slug: slugSchema,
    subtitle: z.string().max(240).optional(),
    episodeNumber: z.number().int().min(1),
    teacherCharacter: characterIdSchema,
    studentCharacter: characterIdSchema,
    excerpt: z.string().min(1).max(400),
    heroImage: z.string().optional(),
    location: z.string().min(1).max(160),
    sessionDate: z.coerce.date(),
    contentBlocks: contentBlocksSchema,
    tags: z.array(z.string().min(1)).default([]),
    status: contentStatusSchema.default('draft'),
    scheduledAt: z.coerce.date().optional(),
    featured: z.boolean().default(false),
    seo: seoSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.teacherCharacter === data.studentCharacter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teacher and student must be different characters for this episode',
        path: ['studentCharacter'],
      });
    }
    if (data.status === 'scheduled' && !data.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scheduledAt is required when status is "scheduled"',
        path: ['scheduledAt'],
      });
    }
  });
export type EpisodeInput = z.infer<typeof episodeInputSchema>;

/** The full stored document shape (`episodes` collection). */
export interface EpisodeDocument {
  _id: string;
  seriesId: string;
  moduleId: string;
  /** Denormalized at write time from the parent series/module so public
   * reads (breadcrumbs, URLs, listings) never need a lookup/populate —
   * see services/episode.service.ts. Kept in sync whenever a series or
   * module is renamed. */
  seriesSlug: string;
  seriesTitle: string;
  moduleSlug: string;
  moduleTitle: string;
  title: string;
  slug: string;
  subtitle?: string;
  episodeNumber: number;
  teacherCharacter: 'shyam' | 'salim';
  studentCharacter: 'shyam' | 'salim';
  excerpt: string;
  heroImage?: string;
  location: string;
  sessionDate: Date;
  /** Minutes, computed from contentBlocks word count at save time. */
  readingTime: number;
  contentBlocks: z.infer<typeof contentBlocksSchema>;
  tags: string[];
  /** Concept anchor ids, derived from embedded `concept` blocks — kept
   * denormalized here purely so list/search queries don't have to scan
   * every block of every episode. */
  concepts: string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: Date;
  publishedAt?: Date;
  featured: boolean;
  seo?: z.infer<typeof seoSchema>;
  /** Incremented on every save; used for optimistic-concurrency checks in
   * the admin editor (reject a save if the revision the editor started
   * from is stale) and for the "unsaved changes" / audit trail. */
  revision: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Narrow projection returned by public list queries (home, series,
 * topic pages) — never the full document, and never a draft. See
 * repositories/episodes.repository.ts. */
export interface PublicEpisodeSummary {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  heroImage?: string;
  episodeNumber: number;
  teacherCharacter: 'shyam' | 'salim';
  studentCharacter: 'shyam' | 'salim';
  readingTime: number;
  publishedAt?: Date;
  tags: string[];
  seriesSlug: string;
  moduleSlug: string;
}
