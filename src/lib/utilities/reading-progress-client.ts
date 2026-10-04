'use client';

/** Per-episode scroll position, so a reader can resume where they left
 * off ("Resume reading through local storage" in the brief). Stores a
 * fraction (0-1) rather than a pixel offset so it survives layout/content
 * changes reasonably well. */
const STORAGE_PREFIX = 'ssml:reading-progress:';

export function saveReadingProgress(episodeSlug: string, fraction: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${episodeSlug}`, String(Math.max(0, Math.min(1, fraction))));
  } catch {
    // Non-critical.
  }
}

export function getReadingProgress(episodeSlug: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${episodeSlug}`);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

/** Used by the homepage's "Continue reading" rail — a map of every
 * episode slug the reader has made progress on, each with its last known
 * fraction, read directly out of localStorage (no server round trip). */
export function getAllReadingProgress(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const result: Record<string, number> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const slug = key.slice(STORAGE_PREFIX.length);
        const value = Number(window.localStorage.getItem(key));
        if (Number.isFinite(value)) result[slug] = value;
      }
    }
  } catch {
    // Non-critical.
  }
  return result;
}
