import { revalidatePath } from 'next/cache';

/**
 * Revalidates exactly the public pages a given episode's content could
 * affect, called after create/update/publish/unpublish/delete. Listing
 * paths explicitly (rather than revalidating everything) keeps publishing
 * cheap and keeps the cache invalidation blast radius reviewable.
 *
 * Safe to call even before the corresponding public routes exist
 * (Phase 5) — revalidating a path with no matching route is a no-op.
 */
export function revalidateEpisodePaths(params: {
  episodeSlug: string;
  seriesSlug: string;
  moduleSlug: string;
}): void {
  revalidatePath('/');
  revalidatePath('/series');
  revalidatePath(`/series/${params.seriesSlug}`);
  revalidatePath(`/series/${params.seriesSlug}/module/${params.moduleSlug}`);
  revalidatePath(`/episodes/${params.episodeSlug}`);
  revalidatePath('/topics');
  revalidatePath('/search');
}

export function revalidateSeriesPaths(seriesSlug: string): void {
  revalidatePath('/series');
  revalidatePath(`/series/${seriesSlug}`);
  revalidatePath('/');
}

export function revalidateModulePaths(seriesSlug: string, moduleSlug: string): void {
  revalidatePath(`/series/${seriesSlug}`);
  revalidatePath(`/series/${seriesSlug}/module/${moduleSlug}`);
}
