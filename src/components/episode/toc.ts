import type { PublicContentBlock } from '@/models/content-block.model';

export interface TocEntry {
  id: string;
  label: string;
}

export function buildTocEntries(blocks: PublicContentBlock[]): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const block of blocks) {
    if (block.type === 'scene') entries.push({ id: block.id, label: block.sceneTitle });
    else if (block.type === 'concept') entries.push({ id: block.anchorId, label: block.conceptName });
    else if (block.type === 'quiz') entries.push({ id: block.id, label: block.title });
    else if (block.type === 'summary') entries.push({ id: block.id, label: block.title });
  }
  return entries;
}
