'use client';

/**
 * Locally stored quiz history for the MVP ("Score stored locally in MVP",
 * "Future compatibility with user accounts"). Same shape-first approach as
 * bookmarks-client.ts — swapping this for an account-backed store later
 * only changes this file's implementation, not call sites.
 */

const STORAGE_KEY = 'ssml:quiz-scores:v1';

export interface QuizScoreEntry {
  episodeSlug: string;
  blockId: string;
  score: number;
  total: number;
  completedAt: string;
}

function readAll(): QuizScoreEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuizScoreEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordQuizScore(entry: QuizScoreEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const all = readAll().filter((e) => !(e.episodeSlug === entry.episodeSlug && e.blockId === entry.blockId));
    all.push(entry);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Non-critical — the result is still shown on screen even if it
    // can't be persisted.
  }
}

export function getQuizScores(): QuizScoreEntry[] {
  return readAll().sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
