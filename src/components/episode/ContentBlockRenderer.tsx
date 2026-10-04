import type { PublicContentBlock } from '@/models/content-block.model';
import MarkdownText from './MarkdownText';
import SceneBlock from './blocks/SceneBlock';
import DialogueBlock from './blocks/DialogueBlock';
import FlashbackBlock from './blocks/FlashbackBlock';
import ConceptCard from './blocks/ConceptCard';
import FormulaBlock from './blocks/FormulaBlock';
import CodeBlock from './blocks/CodeBlock';
import ExampleBlock from './blocks/ExampleBlock';
import TableBlockRenderer from './blocks/TableBlockRenderer';
import ImageBlockRenderer from './blocks/ImageBlockRenderer';
import QuizBlock from './blocks/QuizBlock';
import {
  BanterCallout,
  ConfusionBlockRenderer,
  ExamTipBlockRenderer,
  HomeworkBlockRenderer,
  SummaryBlockRenderer,
  TeaserBlockRenderer,
  DividerBlockRenderer,
} from './blocks/SimpleBlocks';

/**
 * The single entry point for turning a validated content block into UI.
 * One `case` per block type, matching the discriminated union exactly —
 * TypeScript flags this file at compile time if a new block type is added
 * to the schema without a renderer here (the `default` branch's
 * `never`-typed exhaustiveness check).
 */
export default function ContentBlockRenderer({
  block,
  episodeSlug,
  episodeTitle,
}: {
  block: PublicContentBlock;
  episodeSlug: string;
  episodeTitle: string;
}) {
  switch (block.type) {
    case 'scene':
      return <SceneBlock block={block} />;
    case 'dialogue':
      return <DialogueBlock block={block} />;
    case 'narration':
      return <MarkdownText>{block.bodyMarkdown}</MarkdownText>;
    case 'flashback':
      return <FlashbackBlock block={block} />;
    case 'concept':
      return <ConceptCard block={block} episodeSlug={episodeSlug} episodeTitle={episodeTitle} />;
    case 'formula':
      return <FormulaBlock block={block} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'example':
      return <ExampleBlock block={block} />;
    case 'table':
      return <TableBlockRenderer block={block} />;
    case 'image':
      return <ImageBlockRenderer block={block} />;
    case 'banter':
      return <BanterCallout block={block} />;
    case 'confusion':
      return <ConfusionBlockRenderer block={block} />;
    case 'examTip':
      return <ExamTipBlockRenderer block={block} />;
    case 'quiz':
      return <QuizBlock block={block} episodeSlug={episodeSlug} />;
    case 'homework':
      return <HomeworkBlockRenderer block={block} />;
    case 'summary':
      return <SummaryBlockRenderer block={block} />;
    case 'teaser':
      return <TeaserBlockRenderer block={block} />;
    case 'divider':
      return <DividerBlockRenderer block={block} />;
    default: {
      const exhaustiveCheck: never = block;
      void exhaustiveCheck;
      return null;
    }
  }
}
