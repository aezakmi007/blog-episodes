'use client';

/**
 * Local-storage-backed bookmarks for the MVP (per the brief: "Locally
 * stored or account-based bookmarks, depending on implementation scope").
 * Deliberately a thin, framework-free module (not a React hook) so it can
 * be called from any client component and from the /bookmarks page alike,
 * with one storage shape shared by both.
 *
 * Forward-compatible with account-based bookmarks later: swapping this
 * module's implementation for one backed by a `/api/bookmarks` route
 * would not require changing any call site's shape (`BookmarkEntry`).
 */

const STORAGE_KEY = 'ssml:bookmarks:v1';

export interface BookmarkEntry {
  conceptAnchorId: string;
  conceptName: string;
  episodeSlug: string;
  episodeTitle: string;
  addedAt: string;
}

function readAll(): BookmarkEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BookmarkEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: BookmarkEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable (private browsing, quota) — bookmarking
    // is a convenience feature, so we fail silently rather than throw.
  }
}

export function getBookmarks(): BookmarkEntry[] {
  return readAll().sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export function isBookmarked(conceptAnchorId: string): boolean {
  return readAll().some((entry) => entry.conceptAnchorId === conceptAnchorId);
}

export function toggleBookmark(entry: Omit<BookmarkEntry, 'addedAt'>): boolean {
  const all = readAll();
  const existingIndex = all.findIndex((e) => e.conceptAnchorId === entry.conceptAnchorId);

  if (existingIndex >= 0) {
    all.splice(existingIndex, 1);
    writeAll(all);
    return false;
  }

  all.push({ ...entry, addedAt: new Date().toISOString() });
  writeAll(all);
  return true;
}

export function removeBookmark(conceptAnchorId: string): void {
  writeAll(readAll().filter((entry) => entry.conceptAnchorId !== conceptAnchorId));
}
