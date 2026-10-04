'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import TextField from '@mui/material/TextField';
import type { ContentBlock } from '@/models/content-block.model';
import { parseContentBlocks } from '@/models/content-block.model';
import { BLOCK_TYPE_META, createDefaultBlock } from './blockDefaults';
import BlockEditorRow from './BlockEditorRow';

/**
 * The episode content editor. Blocks are added from a typed menu (never a
 * blank "paste JSON here" box), reordered with up/down controls, and
 * edited through BlockFieldsEditor's per-type forms. An "Advanced" JSON
 * view exists behind an explicit toggle for power users / bulk edits, but
 * it is never the primary or default editing surface, per the brief.
 */
export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
}) {
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(blocks[0]?.id ?? null);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [advancedText, setAdvancedText] = React.useState('');
  const [advancedError, setAdvancedError] = React.useState<string | null>(null);

  function reorder(blocksList: ContentBlock[]): ContentBlock[] {
    return blocksList.map((block, index) => ({ ...block, order: index }));
  }

  function addBlock(type: ContentBlock['type']) {
    const newBlock = createDefaultBlock(type, blocks.length);
    onChange(reorder([...blocks, newBlock]));
    setExpandedId(newBlock.id);
    setMenuAnchor(null);
  }

  function updateBlock(index: number, next: ContentBlock) {
    onChange(blocks.map((b, i) => (i === index ? next : b)));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    onChange(reorder(next));
  }

  function duplicateBlock(index: number) {
    const source = blocks[index];
    if (!source) return;
    const copy: ContentBlock = { ...source, id: `${source.id}-copy-${Date.now().toString(36)}` };
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(reorder(next));
    setExpandedId(copy.id);
  }

  function removeBlock(index: number) {
    onChange(reorder(blocks.filter((_, i) => i !== index)));
  }

  function openAdvanced() {
    setAdvancedText(JSON.stringify(blocks, null, 2));
    setAdvancedError(null);
    setAdvancedOpen(true);
  }

  function applyAdvanced() {
    try {
      const parsedJson = JSON.parse(advancedText);
      const result = parseContentBlocks(parsedJson);
      if (!result.success) {
        setAdvancedError(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
        return;
      }
      onChange(result.data);
      setAdvancedOpen(false);
    } catch {
      setAdvancedError('Invalid JSON.');
    }
  }

  return (
    <Stack spacing={2}>
      {blocks.length === 0 && (
        <Alert severity="info">This episode has no content blocks yet. Add one to get started.</Alert>
      )}

      {blocks.map((block, index) => (
        <BlockEditorRow
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          expanded={expandedId === block.id}
          onToggleExpanded={() => setExpandedId((current) => (current === block.id ? null : block.id))}
          onChange={(next) => updateBlock(index, next)}
          onMove={(direction) => moveBlock(index, direction)}
          onDuplicate={() => duplicateBlock(index)}
          onRemove={() => removeBlock(index)}
        />
      ))}

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          Add block
        </Button>
        <Button size="small" startIcon={<CodeIcon />} onClick={openAdvanced} color="inherit">
          Advanced (JSON)
        </Button>
      </Stack>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {BLOCK_TYPE_META.map((meta) => (
          <MenuItem key={meta.type} onClick={() => addBlock(meta.type)}>
            <ListItemText primary={meta.label} secondary={meta.shortDescription} />
          </MenuItem>
        ))}
      </Menu>

      {advancedOpen && (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Advanced: edit all blocks as JSON
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Intended for bulk edits or copy/paste between episodes. Validated against the same
            schema as the visual editor before it&apos;s applied — nothing invalid can be saved.
          </Typography>
          {advancedError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {advancedError}
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            minRows={10}
            value={advancedText}
            onChange={(e) => setAdvancedText(e.target.value)}
            slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
          />
          <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
            <Button variant="contained" onClick={applyAdvanced}>
              Apply
            </Button>
            <Button onClick={() => setAdvancedOpen(false)} color="inherit">
              Cancel
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
