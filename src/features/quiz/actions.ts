'use server';

import { gradeQuizSubmission, type QuizResponseValue } from '@/services/quiz.service';
import type { ServiceResult } from '@/lib/utilities/result';
import type { QuizGradeResult } from '@/services/quiz.service';

/**
 * No admin-session check here on purpose — this is a public action any
 * reader can call. It re-reads the real quiz from the published episode
 * server-side (never trusting the client's copy), so the only thing a
 * caller can do is grade their own submitted answers against the public
 * episode's actual quiz, which is no more sensitive than viewing the page.
 */
export async function checkQuizAnswersAction(
  episodeSlug: string,
  blockId: string,
  responses: Record<string, QuizResponseValue>,
): Promise<ServiceResult<QuizGradeResult>> {
  return gradeQuizSubmission(episodeSlug, blockId, responses);
}
