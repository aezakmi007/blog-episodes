'use client';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { ContentBlock } from '@/models/content-block.model';
import { BLOCK_TYPE_META, summarizeBlock } from './blockDefaults';
import BlockFieldsEditor from './BlockFieldsEditor';

export default function BlockEditorRow({
  block,
  index,
  total,
  expanded,
  onToggleExpanded,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChange: (next: ContentBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const meta = BLOCK_TYPE_META.find((m) => m.type === block.type);

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggleExpanded}
      disableGutters
      sx={{ border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5, minWidth: 0 } }}
      >
        <Chip label={meta?.label ?? block.type} size="small" color="secondary" sx={{ flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>
          {summarizeBlock(block)}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="flex-end"
            role="toolbar"
            aria-label={`Block ${index + 1} actions`}
          >
            <IconButton
              size="small"
              aria-label="Move block up"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                onMove(-1);
              }}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Move block down"
              disabled={index === total - 1}
              onClick={(e) => {
                e.stopPropagation();
                onMove(1);
              }}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Duplicate block"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Delete block"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box onClick={(e) => e.stopPropagation()}>
            <BlockFieldsEditor block={block} onChange={onChange} />
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
