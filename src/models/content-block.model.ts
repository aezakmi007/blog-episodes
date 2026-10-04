import { z } from 'zod';

/**
 * Content block schemas — the heart of the "no uncontrolled HTML string"
 * requirement. An episode's body is `contentBlocks: ContentBlock[]`, a
 * discriminated union keyed on `type`. Every variant is validated
 * independently by `parseContentBlock`, so a single malformed block in an
 * admin submission produces one precise, field-level error instead of
 * rejecting the whole episode.
 *
 * Free-text fields below (e.g. `bodyMarkdown`, dialogue `text`) allow a
 * small, safe Markdown subset — bold, italic, inline code, links — which
 * is sanitized again at render time via `rehype-sanitize`
 * (src/components/episode/MarkdownText.tsx, Phase 5). Nothing here is ever
 * rendered with `dangerouslySetInnerHTML`.
 *
 * FORMULA SYNTAX (no LaTeX required): a formula string uses `^` for
 * superscript (`x^2`), `_` for subscript (`x_i`), and `{name}` for a
 * variable/Greek letter that should render in math italics (`{theta}`,
 * `{sigma}`). E.g. `"y = {theta}_0 + {theta}_1 * x"`. This is documented
 * for admins in the formula block editor's help text (Phase 4).
 */

const characterIdSchema = z.enum(['shyam', 'salim']);

const mediaRefSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'Alt text is required for every non-decorative image'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const visualSettingsSchema = z
  .object({
    accent: z.enum(['shyam', 'salim', 'neutral']).optional(),
    background: z.string().optional(),
  })
  .partial()
  .optional();

const blockBase = {
  id: z.string().min(1, 'Block id is required'),
  order: z.number().int().min(0),
  visualSettings: visualSettingsSchema,
};

// ---------------------------------------------------------------------------
// 1. Scene
// ---------------------------------------------------------------------------
export const sceneBlockSchema = z.object({
  ...blockBase,
  type: z.literal('scene'),
  sceneTitle: z.string().min(1).max(160),
  location: z.string().min(1).max(160),
  time: z.string().min(1).max(80),
  sessionLabel: z.string().min(1).max(120),
  backgroundTheme: z.enum(['balcony-morning', 'rooftop-evening', 'classroom-flashback', 'neutral']),
  illustration: mediaRefSchema.optional(),
  ambientDescription: z.string().min(1).max(600),
  transitionStyle: z.enum(['fade', 'cut', 'page-turn', 'none']).default('fade'),
});

// ---------------------------------------------------------------------------
// 2. Dialogue
// ---------------------------------------------------------------------------
export const dialogueLineSchema = z.object({
  id: z.string().min(1),
  speaker: characterIdSchema,
  text: z.string().min(1).max(2000),
  stageDirection: z.string().max(200).optional(),
  reaction: z.string().max(40).optional(),
  illustration: mediaRefSchema.optional(),
  emphasis: z.enum(['none', 'bold', 'highlight']).default('none'),
  conceptRef: z.string().optional(),
  displayOrder: z.number().int().min(0),
});
export type DialogueLine = z.infer<typeof dialogueLineSchema>;

export const dialogueBlockSchema = z.object({
  ...blockBase,
  type: z.literal('dialogue'),
  lines: z.array(dialogueLineSchema).min(1, 'A dialogue block needs at least one line'),
});

// ---------------------------------------------------------------------------
// 3. Narration
// ---------------------------------------------------------------------------
export const narrationBlockSchema = z.object({
  ...blockBase,
  type: z.literal('narration'),
  bodyMarkdown: z.string().min(1).max(3000),
  tone: z.enum(['scene-setting', 'aside', 'ambient']).default('scene-setting'),
});

// ---------------------------------------------------------------------------
// 4. Flashback
// ---------------------------------------------------------------------------
export const flashbackBlockSchema = z.object({
  ...blockBase,
  type: z.literal('flashback'),
  title: z.string().min(1).max(160),
  dateBadge: z.string().min(1).max(80),
  bodyMarkdown: z.string().min(1).max(3000),
  lines: z.array(dialogueLineSchema).optional(),
  entryAnimation: z.enum(['page-turn', 'fade', 'none']).default('page-turn'),
});

// ---------------------------------------------------------------------------
// 5. Concept card
// ---------------------------------------------------------------------------
export const conceptBlockSchema = z.object({
  ...blockBase,
  type: z.literal('concept'),
  conceptName: z.string().min(1).max(160),
  anchorId: z.string().min(1).max(160),
  simpleDefinition: z.string().min(1).max(600),
  technicalDefinition: z.string().min(1).max(1200),
  realWorldExample: z.string().min(1).max(1200),
  relatedTerms: z.array(z.string().min(1)).default([]),
  diagram: mediaRefSchema.optional(),
  bookmarkable: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// 6. Formula
// ---------------------------------------------------------------------------
export const formulaVariableSchema = z.object({
  symbol: z.string().min(1).max(40),
  meaning: z.string().min(1).max(200),
});

export const formulaBlockSchema = z.object({
  ...blockBase,
  type: z.literal('formula'),
  title: z.string().min(1).max(160),
  formula: z.string().min(1).max(400),
  variables: z.array(formulaVariableSchema).default([]),
  stepByStepExplanation: z.array(z.string().min(1)).default([]),
  numericalExample: z.string().max(800).optional(),
  derivation: z.string().max(2000).optional(),
  allowCopy: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// 7. Code
// ---------------------------------------------------------------------------
export const codeBlockSchema = z.object({
  ...blockBase,
  type: z.literal('code'),
  language: z.string().min(1).max(40),
  code: z.string().min(1).max(8000),
  caption: z.string().max(200).optional(),
  highlightLines: z.array(z.number().int().positive()).default([]),
});

// ---------------------------------------------------------------------------
// 8. Example
// ---------------------------------------------------------------------------
export const exampleBlockSchema = z.object({
  ...blockBase,
  type: z.literal('example'),
  title: z.string().min(1).max(160),
  scenario: z.string().min(1).max(600),
  walkthroughMarkdown: z.string().min(1).max(2000),
  outcome: z.string().max(600).optional(),
});

// ---------------------------------------------------------------------------
// 9. Table
// ---------------------------------------------------------------------------
export const tableBlockSchema = z.object({
  ...blockBase,
  type: z.literal('table'),
  caption: z.string().max(200).optional(),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(z.array(z.string())).min(1),
  note: z.string().max(400).optional(),
});

// ---------------------------------------------------------------------------
// 10. Image / illustration
// ---------------------------------------------------------------------------
export const imageBlockSchema = z.object({
  ...blockBase,
  type: z.literal('image'),
  image: mediaRefSchema,
  caption: z.string().max(240).optional(),
  credit: z.string().max(160).optional(),
  decorative: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// 11. Joke / banter callout
// ---------------------------------------------------------------------------
export const banterBlockSchema = z.object({
  ...blockBase,
  type: z.literal('banter'),
  speaker: characterIdSchema.optional(),
  text: z.string().min(1).max(600),
  reactionEmoji: z.string().max(8).optional(),
});

// ---------------------------------------------------------------------------
// 12. Common-confusion
// ---------------------------------------------------------------------------
export const confusionBlockSchema = z.object({
  ...blockBase,
  type: z.literal('confusion'),
  misconception: z.string().min(1).max(400),
  clarification: z.string().min(1).max(800),
  relatedConceptRef: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 13. Exam tip
// ---------------------------------------------------------------------------
export const examTipBlockSchema = z.object({
  ...blockBase,
  type: z.literal('examTip'),
  tip: z.string().min(1).max(500),
  importance: z.enum(['low', 'medium', 'high']).default('medium'),
});

// ---------------------------------------------------------------------------
// 14. Quiz
// ---------------------------------------------------------------------------
const quizQuestionBase = {
  id: z.string().min(1),
  prompt: z.string().min(1).max(400),
  explanation: z.string().min(1).max(800),
};

export const multipleChoiceQuestionSchema = z.object({
  ...quizQuestionBase,
  questionType: z.literal('multiple-choice'),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1).max(200) })).min(2).max(6),
  correctOptionId: z.string().min(1),
});

export const trueFalseQuestionSchema = z.object({
  ...quizQuestionBase,
  questionType: z.literal('true-false'),
  correctAnswer: z.boolean(),
});

export const shortAnswerQuestionSchema = z.object({
  ...quizQuestionBase,
  questionType: z.literal('short-answer'),
  acceptableAnswers: z.array(z.string().min(1)).min(1),
});

export const quizQuestionSchema = z.discriminatedUnion('questionType', [
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
]);
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizBlockSchema = z.object({
  ...blockBase,
  type: z.literal('quiz'),
  title: z.string().min(1).max(160).default('Pop quiz'),
  questions: z.array(quizQuestionSchema).min(1).max(10),
});

/** A quiz question with answer-revealing fields stripped — this is the
 * shape actually sent to the public page HTML; the full
 * `quizBlockSchema` (with `correctOptionId` / `correctAnswer` /
 * `acceptableAnswers`) only ever lives server-side and inside the admin
 * editor's authenticated payload. See services/quiz.service.ts (Phase 6). */
export type PublicQuizQuestion =
  | Omit<MultipleChoiceQuestion, 'correctOptionId'>
  | Omit<TrueFalseQuestion, 'correctAnswer'>
  | Omit<ShortAnswerQuestion, 'acceptableAnswers'>;

type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
type TrueFalseQuestion = z.infer<typeof trueFalseQuestionSchema>;
type ShortAnswerQuestion = z.infer<typeof shortAnswerQuestionSchema>;

// ---------------------------------------------------------------------------
// 15. Homework
// ---------------------------------------------------------------------------
export const homeworkBlockSchema = z.object({
  ...blockBase,
  type: z.literal('homework'),
  tasks: z.array(z.string().min(1).max(300)).min(1),
  dueLabel: z.string().max(80).optional(),
  difficulty: z.enum(['easy', 'medium', 'challenge']).default('medium'),
});

// ---------------------------------------------------------------------------
// 16. Summary
// ---------------------------------------------------------------------------
export const summaryBlockSchema = z.object({
  ...blockBase,
  type: z.literal('summary'),
  title: z.string().min(1).max(160).default('Is Sunday ka nichod'),
  points: z.array(z.string().min(1).max(300)).min(1),
});

// ---------------------------------------------------------------------------
// 17. Next-episode teaser
// ---------------------------------------------------------------------------
export const teaserBlockSchema = z.object({
  ...blockBase,
  type: z.literal('teaser'),
  nextEpisodeTitle: z.string().min(1).max(160),
  nextEpisodeSlug: z.string().optional(),
  teaserText: z.string().min(1).max(400),
});

// ---------------------------------------------------------------------------
// 18. Divider / scene transition
// ---------------------------------------------------------------------------
export const dividerBlockSchema = z.object({
  ...blockBase,
  type: z.literal('divider'),
  style: z.enum(['ellipsis', 'chai-cup', 'scene-break', 'plain']).default('chai-cup'),
  label: z.string().max(80).optional(),
});

// ---------------------------------------------------------------------------
// Discriminated union + helpers
// ---------------------------------------------------------------------------
export const contentBlockSchema = z.discriminatedUnion('type', [
  sceneBlockSchema,
  dialogueBlockSchema,
  narrationBlockSchema,
  flashbackBlockSchema,
  conceptBlockSchema,
  formulaBlockSchema,
  codeBlockSchema,
  exampleBlockSchema,
  tableBlockSchema,
  imageBlockSchema,
  banterBlockSchema,
  confusionBlockSchema,
  examTipBlockSchema,
  quizBlockSchema,
  homeworkBlockSchema,
  summaryBlockSchema,
  teaserBlockSchema,
  dividerBlockSchema,
]);

export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type ContentBlockType = ContentBlock['type'];

export const contentBlocksSchema = z
  .array(contentBlockSchema)
  .min(1, 'An episode needs at least one content block')
  .superRefine((blocks, ctx) => {
    const ids = new Set<string>();
    blocks.forEach((block, index) => {
      if (ids.has(block.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate block id "${block.id}"`,
          path: [index, 'id'],
        });
      }
      ids.add(block.id);
    });
  });

/**
 * Validates a single block in isolation, returning a precise error for
 * just that block rather than requiring the whole array to be re-parsed.
 * Used by the admin block editor so one invalid block doesn't block
 * editing the others.
 */
export function parseContentBlock(input: unknown) {
  return contentBlockSchema.safeParse(input);
}

export function parseContentBlocks(input: unknown) {
  return contentBlocksSchema.safeParse(input);
}

/** Every block type unchanged except `quiz`, whose questions have had
 * answer-revealing fields stripped. This is the type the episode reader
 * (a Server Component tree that sends its props to the client) actually
 * receives — see services/episode.service.ts `sanitizeEpisodeForPublic`. */
export type PublicContentBlock = Exclude<ContentBlock, { type: 'quiz' }> | PublicQuizBlock;
export interface PublicQuizBlock extends Omit<Extract<ContentBlock, { type: 'quiz' }>, 'questions'> {
  questions: PublicQuizQuestion[];
}

function toPublicQuizQuestion(question: QuizQuestion): PublicQuizQuestion {
  if (question.questionType === 'multiple-choice') {
    const { correctOptionId: _correctOptionId, ...rest } = question;
    return rest;
  }
  if (question.questionType === 'true-false') {
    const { correctAnswer: _correctAnswer, ...rest } = question;
    return rest;
  }
  const { acceptableAnswers: _acceptableAnswers, ...rest } = question;
  return rest;
}

/** Strips answer-revealing fields from every quiz block in an episode's
 * content. Call this before an episode ever reaches a Server Component
 * that passes props to a Client Component (the public reader) — grading
 * happens separately, server-side, via services/quiz.service.ts, which
 * re-reads the real question data from the database rather than trusting
 * anything the client sends back. */
export function toPublicContentBlocks(blocks: ContentBlock[]): PublicContentBlock[] {
  return blocks.map((block): PublicContentBlock => {
    if (block.type !== 'quiz') return block;
    return { ...block, questions: block.questions.map(toPublicQuizQuestion) };
  });
}
