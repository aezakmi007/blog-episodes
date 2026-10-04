import { nanoid } from 'nanoid';
import type { ContentBlock, ContentBlockType } from '@/models/content-block.model';

export interface BlockTypeMeta {
  type: ContentBlockType;
  label: string;
  shortDescription: string;
}

/** Drives the "Add block" menu and each row's summary chip. Order here is
 * the order block types are offered to admins — roughly narrative order
 * (scene-setting first, assessment/wrap-up blocks last). */
export const BLOCK_TYPE_META: BlockTypeMeta[] = [
  { type: 'scene', label: 'Scene', shortDescription: 'Sets location, time and ambient mood' },
  { type: 'dialogue', label: 'Dialogue', shortDescription: 'A back-and-forth between Shyam and Salim' },
  { type: 'narration', label: 'Narration', shortDescription: 'Third-person scene-setting text' },
  { type: 'flashback', label: 'Flashback', shortDescription: 'A visually distinct memory sequence' },
  { type: 'concept', label: 'Concept card', shortDescription: 'A definition with a real-world example' },
  { type: 'formula', label: 'Formula', shortDescription: 'An equation with variables and steps' },
  { type: 'code', label: 'Code', shortDescription: 'A syntax-highlighted code sample' },
  { type: 'example', label: 'Example', shortDescription: 'A worked scenario and its outcome' },
  { type: 'table', label: 'Table', shortDescription: 'Rows and columns of structured data' },
  { type: 'image', label: 'Image', shortDescription: 'A standalone illustration or photo' },
  { type: 'banter', label: 'Joke / banter', shortDescription: 'A short, callout-styled aside' },
  { type: 'confusion', label: 'Common confusion', shortDescription: 'A misconception and its fix' },
  { type: 'examTip', label: 'Exam tip', shortDescription: 'A short, highlighted pointer' },
  { type: 'quiz', label: 'Quiz', shortDescription: 'Multiple-choice, true/false or short-answer' },
  { type: 'homework', label: 'Homework', shortDescription: 'Tasks for before the next Sunday' },
  { type: 'summary', label: 'Summary', shortDescription: 'Bulleted recap of the episode' },
  { type: 'teaser', label: 'Next-episode teaser', shortDescription: 'A hook for what comes next' },
  { type: 'divider', label: 'Divider', shortDescription: 'A scene-transition visual break' },
];

/** Creates a new block of the given type with valid, minimal placeholder
 * content — every default already satisfies its Zod schema so a freshly
 * added block never blocks saving; the admin edits the placeholder text
 * in place rather than filling in a blank form from scratch. */
export function createDefaultBlock(type: ContentBlockType, order: number): ContentBlock {
  const id = `blk-${nanoid(8)}`;

  switch (type) {
    case 'scene':
      return {
        id,
        type,
        order,
        sceneTitle: 'New scene',
        location: "Salim's balcony",
        time: 'Sunday, 11:00 AM',
        sessionLabel: 'Session',
        backgroundTheme: 'balcony-morning',
        ambientDescription: 'Describe the ambience here.',
        transitionStyle: 'fade',
      };
    case 'dialogue':
      return {
        id,
        type,
        order,
        lines: [
          { id: `ln-${nanoid(6)}`, speaker: 'shyam', text: 'New line…', emphasis: 'none', displayOrder: 0 },
        ],
      };
    case 'narration':
      return { id, type, order, bodyMarkdown: 'Narration text…', tone: 'scene-setting' };
    case 'flashback':
      return {
        id,
        type,
        order,
        title: 'A memory',
        dateBadge: 'Year',
        bodyMarkdown: 'Describe the flashback…',
        entryAnimation: 'page-turn',
      };
    case 'concept':
      return {
        id,
        type,
        order,
        conceptName: 'New concept',
        anchorId: `concept-${nanoid(6)}`,
        simpleDefinition: 'Simple explanation…',
        technicalDefinition: 'Technical explanation…',
        realWorldExample: 'Real-world example…',
        relatedTerms: [],
        bookmarkable: true,
      };
    case 'formula':
      return {
        id,
        type,
        order,
        title: 'New formula',
        formula: 'y = {theta}_0 + {theta}_1 * x',
        variables: [],
        stepByStepExplanation: [],
        allowCopy: true,
      };
    case 'code':
      return { id, type, order, language: 'python', code: '# code here', highlightLines: [] };
    case 'example':
      return {
        id,
        type,
        order,
        title: 'New example',
        scenario: 'Describe the scenario…',
        walkthroughMarkdown: 'Walk through it…',
      };
    case 'table':
      return {
        id,
        type,
        order,
        columns: ['Column 1', 'Column 2'],
        rows: [['', '']],
      };
    case 'image':
      return {
        id,
        type,
        order,
        image: { src: '', alt: '' },
        decorative: false,
      };
    case 'banter':
      return { id, type, order, text: 'A short joke or aside…' };
    case 'confusion':
      return { id, type, order, misconception: 'What people often get wrong…', clarification: 'The actual truth…' };
    case 'examTip':
      return { id, type, order, tip: 'A helpful exam tip…', importance: 'medium' };
    case 'quiz':
      return {
        id,
        type,
        order,
        title: 'Pop quiz',
        questions: [
          {
            id: `q-${nanoid(6)}`,
            questionType: 'multiple-choice',
            prompt: 'New question?',
            explanation: 'Explanation…',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
            ],
            correctOptionId: 'a',
          },
        ],
      };
    case 'homework':
      return { id, type, order, tasks: ['New task…'], difficulty: 'medium' };
    case 'summary':
      return { id, type, order, title: 'Is Sunday ka nichod', points: ['Key point…'] };
    case 'teaser':
      return { id, type, order, nextEpisodeTitle: 'Next episode title', teaserText: 'Teaser text…' };
    case 'divider':
      return { id, type, order, style: 'chai-cup' };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled block type: ${exhaustiveCheck}`);
    }
  }
}

/** Short, human-readable one-line summary shown on a collapsed block row
 * — enough context to identify the block without expanding it. */
export function summarizeBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'scene':
      return block.sceneTitle;
    case 'dialogue':
      return `${block.lines.length} line${block.lines.length === 1 ? '' : 's'}`;
    case 'narration':
      return block.bodyMarkdown.slice(0, 80);
    case 'flashback':
      return block.title;
    case 'concept':
      return block.conceptName;
    case 'formula':
      return block.title;
    case 'code':
      return `${block.language} snippet`;
    case 'example':
      return block.title;
    case 'table':
      return `${block.rows.length} row${block.rows.length === 1 ? '' : 's'} × ${block.columns.length} cols`;
    case 'image':
      return block.caption || block.image.alt || 'Image';
    case 'banter':
      return block.text.slice(0, 80);
    case 'confusion':
      return block.misconception.slice(0, 80);
    case 'examTip':
      return block.tip.slice(0, 80);
    case 'quiz':
      return `${block.questions.length} question${block.questions.length === 1 ? '' : 's'}`;
    case 'homework':
      return `${block.tasks.length} task${block.tasks.length === 1 ? '' : 's'}`;
    case 'summary':
      return block.title;
    case 'teaser':
      return block.nextEpisodeTitle;
    case 'divider':
      return block.label || block.style;
    default:
      return '';
  }
}
