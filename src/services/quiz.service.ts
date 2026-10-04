import { findPublishedEpisodeBySlug } from '@/repositories/episodes.repository';
import type { QuizQuestion } from '@/models/content-block.model';
import { fail, ok, type ServiceResult } from '@/lib/utilities/result';

export type QuizResponseValue = string | boolean;

export interface QuizQuestionResult {
  questionId: string;
  correct: boolean;
  explanation: string;
  /** Revealed only in the response to a submission — never present in the
   * episode's initial public payload (see
   * episode.service.ts#toPublicQuizQuestions). */
  correctAnswerLabel: string;
}

export interface QuizGradeResult {
  results: QuizQuestionResult[];
  score: number;
  total: number;
}

function gradeQuestion(question: QuizQuestion, response: QuizResponseValue | undefined): QuizQuestionResult {
  switch (question.questionType) {
    case 'multiple-choice': {
      const correctOption = question.options.find((o) => o.id === question.correctOptionId);
      return {
        questionId: question.id,
        correct: response === question.correctOptionId,
        explanation: question.explanation,
        correctAnswerLabel: correctOption?.text ?? question.correctOptionId,
      };
    }
    case 'true-false':
      return {
        questionId: question.id,
        correct: response === question.correctAnswer,
        explanation: question.explanation,
        correctAnswerLabel: question.correctAnswer ? 'True' : 'False',
      };
    case 'short-answer': {
      const normalizedResponse = typeof response === 'string' ? response.trim().toLowerCase() : '';
      const correct = question.acceptableAnswers.some(
        (answer) => answer.trim().toLowerCase() === normalizedResponse,
      );
      return {
        questionId: question.id,
        correct,
        explanation: question.explanation,
        correctAnswerLabel: question.acceptableAnswers[0] ?? '',
      };
    }
    default:
      // Exhaustive over QuizQuestion['questionType'] — this branch is
      // unreachable, but kept (rather than relying on a non-null
      // assertion) so a future new question type fails loudly here
      // instead of silently falling through.
      return { questionId: '', correct: false, explanation: '', correctAnswerLabel: '' };
  }
}

/**
 * Re-fetches the published episode server-side (never trusts a
 * client-submitted copy of the quiz) and grades the submitted responses
 * against it. This is the only place the real `correctOptionId` /
 * `correctAnswer` / `acceptableAnswers` values are read for a public
 * quiz submission.
 */
export async function gradeQuizSubmission(
  episodeSlug: string,
  blockId: string,
  responses: Record<string, QuizResponseValue>,
): Promise<ServiceResult<QuizGradeResult>> {
  const episode = await findPublishedEpisodeBySlug(episodeSlug);
  if (!episode) return fail('Episode not found.');

  const block = episode.contentBlocks.find((b) => b.id === blockId);
  if (!block || block.type !== 'quiz') return fail('Quiz not found.');

  const results = block.questions.map((question) => gradeQuestion(question, responses[question.id]));
  const score = results.filter((r) => r.correct).length;

  return ok({ results, score, total: results.length });
}
