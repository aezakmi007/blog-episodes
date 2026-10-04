import type { ContentBlock } from '@/models/content-block.model';

const WORDS_PER_MINUTE = 200;

/** Extracts the reader-facing word count out of a content block, ignoring
 * structural fields (ids, enums, media URLs) that don't contribute to
 * actual reading time. */
function wordCountForBlock(block: ContentBlock): number {
  const count = (text: string | undefined) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0);

  switch (block.type) {
    case 'scene':
      return count(block.ambientDescription) + count(block.sceneTitle);
    case 'dialogue':
      return block.lines.reduce((sum, line) => sum + count(line.text), 0);
    case 'narration':
      return count(block.bodyMarkdown);
    case 'flashback':
      return (
        count(block.bodyMarkdown) +
        (block.lines?.reduce((sum, line) => sum + count(line.text), 0) ?? 0)
      );
    case 'concept':
      return count(block.simpleDefinition) + count(block.technicalDefinition) + count(block.realWorldExample);
    case 'formula':
      return (
        block.stepByStepExplanation.reduce((sum, step) => sum + count(step), 0) +
        count(block.numericalExample) +
        count(block.derivation)
      );
    case 'code':
      // Code reads slower than prose; weight it accordingly rather than
      // counting tokens at prose speed.
      return Math.ceil(count(block.code) * 0.5);
    case 'example':
      return count(block.scenario) + count(block.walkthroughMarkdown);
    case 'table':
      return block.rows.flat().reduce((sum, cell) => sum + count(cell), 0);
    case 'image':
      return count(block.caption);
    case 'banter':
      return count(block.text);
    case 'confusion':
      return count(block.misconception) + count(block.clarification);
    case 'examTip':
      return count(block.tip);
    case 'quiz':
      return block.questions.reduce((sum, q) => sum + count(q.prompt) + count(q.explanation), 0);
    case 'homework':
      return block.tasks.reduce((sum, t) => sum + count(t), 0);
    case 'summary':
      return block.points.reduce((sum, p) => sum + count(p), 0);
    case 'teaser':
      return count(block.teaserText);
    case 'divider':
      return 0;
    default:
      return 0;
  }
}

/** Reading time in whole minutes, minimum 1, based on a 200 words/minute
 * pace (a touch slower than the ~238 wpm adult average, to account for
 * dialogue-heavy content and pauses on concept/formula blocks). */
export function calculateReadingTime(blocks: ContentBlock[]): number {
  const totalWords = blocks.reduce((sum, block) => sum + wordCountForBlock(block), 0);
  return Math.max(1, Math.round(totalWords / WORDS_PER_MINUTE));
}
