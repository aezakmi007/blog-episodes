import { describe, expect, it } from 'vitest';
import {
  parseContentBlock,
  parseContentBlocks,
  type ContentBlock,
} from '@/models/content-block.model';
import { calculateReadingTime } from '@/lib/utilities/reading-time';
import { ensureUniqueSlug, toSlug } from '@/lib/utilities/slug';

const validScene: ContentBlock = {
  id: 'scene-1',
  type: 'scene',
  order: 0,
  sceneTitle: 'Balcony',
  location: "Salim's balcony",
  time: 'Sunday, 11:15 AM',
  sessionLabel: 'Module 2 · Session 1',
  backgroundTheme: 'balcony-morning',
  ambientDescription: 'Chai aur pakode.',
  transitionStyle: 'fade',
};

const validDialogue: ContentBlock = {
  id: 'dialogue-1',
  type: 'dialogue',
  order: 1,
  lines: [
    { id: 'l1', speaker: 'shyam', text: 'Chalo shuru karte hain.', emphasis: 'none', displayOrder: 0 },
    { id: 'l2', speaker: 'salim', text: 'Haan bhai, bata.', emphasis: 'none', displayOrder: 1 },
  ],
};

describe('content block validation', () => {
  it('accepts a well-formed scene block', () => {
    const result = parseContentBlock(validScene);
    expect(result.success).toBe(true);
  });

  it('rejects a block missing required fields', () => {
    const result = parseContentBlock({ id: 'bad', type: 'scene', order: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown block type', () => {
    const result = parseContentBlock({ id: 'bad', type: 'carousel', order: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects a dialogue block with zero lines', () => {
    const result = parseContentBlock({ id: 'd', type: 'dialogue', order: 0, lines: [] });
    expect(result.success).toBe(false);
  });

  it('preserves dialogue line order through validation', () => {
    const result = parseContentBlock(validDialogue);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === 'dialogue') {
      expect(result.data.lines.map((l) => l.displayOrder)).toEqual([0, 1]);
      expect(result.data.lines[0]?.speaker).toBe('shyam');
      expect(result.data.lines[1]?.speaker).toBe('salim');
    }
  });

  it('accepts an array of valid blocks', () => {
    const result = parseContentBlocks([validScene, validDialogue]);
    expect(result.success).toBe(true);
  });

  it('rejects an array with duplicate block ids', () => {
    const result = parseContentBlocks([validScene, { ...validScene, order: 1 }]);
    expect(result.success).toBe(false);
  });

  it('rejects an empty content block array', () => {
    const result = parseContentBlocks([]);
    expect(result.success).toBe(false);
  });

  it('requires a multiple-choice quiz question to have at least 2 options', () => {
    const result = parseContentBlock({
      id: 'quiz-1',
      type: 'quiz',
      order: 0,
      title: 'Quiz',
      questions: [
        {
          id: 'q1',
          questionType: 'multiple-choice',
          prompt: 'Prompt?',
          explanation: 'Because.',
          options: [{ id: 'a', text: 'Only one option' }],
          correctOptionId: 'a',
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('reading time', () => {
  it('returns at least 1 minute for any non-empty content', () => {
    expect(calculateReadingTime([validScene])).toBeGreaterThanOrEqual(1);
  });

  it('increases with more words', () => {
    const short = calculateReadingTime([validDialogue]);
    const longDialogue: ContentBlock = {
      ...validDialogue,
      lines: Array.from({ length: 50 }, (_, i) => ({
        id: `l${i}`,
        speaker: i % 2 === 0 ? 'shyam' : 'salim',
        text: 'Yeh ek lambi dialogue line hai jisme bohot saare alfaaz hain taaki reading time badh jaaye.',
        emphasis: 'none' as const,
        displayOrder: i,
      })),
    };
    const long = calculateReadingTime([longDialogue]);
    expect(long).toBeGreaterThan(short);
  });
});

describe('slug utilities', () => {
  it('slugifies titles into lowercase, hyphenated strings', () => {
    expect(toSlug('Machine Learning Mein Data Ki Aukaat')).toBe('machine-learning-mein-data-ki-aukaat');
  });

  it('appends a numeric suffix until a free slug is found', async () => {
    const taken = new Set(['data-basics', 'data-basics-2']);
    const result = await ensureUniqueSlug('Data Basics', async (candidate) => taken.has(candidate));
    expect(result).toBe('data-basics-3');
  });

  it('returns the base slug when it is not taken', async () => {
    const result = await ensureUniqueSlug('Fresh Title', async () => false);
    expect(result).toBe('fresh-title');
  });
});
