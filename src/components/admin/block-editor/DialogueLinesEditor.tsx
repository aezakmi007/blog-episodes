'use client';

import { nanoid } from 'nanoid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import type { DialogueLine } from '@/models/content-block.model';
import { CHARACTERS } from '@/features/characters/characters.data';

/**
 * Editor for a dialogue block's `lines` array. Reordering is up/down
 * buttons rather than drag-and-drop — fully keyboard- and
 * screen-reader-operable without needing to verify a drag library's
 * accessibility layer (see ADR 0004).
 */
export default function DialogueLinesEditor({
  lines,
  onChange,
}: {
  lines: DialogueLine[];
  onChange: (next: DialogueLine[]) => void;
}) {
  function updateLine(index: number, patch: Partial<DialogueLine>) {
    const next = lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
    onChange(reindex(next));
  }

  function moveLine(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lines.length) return;
    const next = [...lines];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(targetIndex, 0, moved);
    onChange(reindex(next));
  }

  function removeLine(index: number) {
    onChange(reindex(lines.filter((_, i) => i !== index)));
  }

  function addLine() {
    onChange(
      reindex([
        ...lines,
        { id: `ln-${nanoid(6)}`, speaker: 'shyam', text: '', emphasis: 'none', displayOrder: 0 },
      ]),
    );
  }

  return (
    <Stack spacing={2}>
      {lines.map((line, index) => (
        <Box key={line.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={line.speaker}
              onChange={(_e, next) => next && updateLine(index, { speaker: next })}
              aria-label="Speaker"
            >
              <ToggleButton value="shyam" aria-label="Shyam">
                {CHARACTERS.shyam.displayName}
              </ToggleButton>
              <ToggleButton value="salim" aria-label="Salim">
                {CHARACTERS.salim.displayName}
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ flexGrow: 1 }} />

            <IconButton
              size="small"
              aria-label="Move line up"
              disabled={index === 0}
              onClick={() => moveLine(index, -1)}
            >
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Move line down"
              disabled={index === lines.length - 1}
              onClick={() => moveLine(index, 1)}
            >
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Remove line"
              onClick={() => removeLine(index)}
              disabled={lines.length <= 1}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            label="Line"
            fullWidth
            multiline
            minRows={2}
            value={line.text}
            onChange={(e) => updateLine(index, { text: e.target.value })}
            sx={{ mb: 1.5 }}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              label="Stage direction (optional)"
              fullWidth
              size="small"
              value={line.stageDirection ?? ''}
              onChange={(e) => updateLine(index, { stageDirection: e.target.value || undefined })}
            />
            <TextField
              label="Reaction (optional)"
              fullWidth
              size="small"
              value={line.reaction ?? ''}
              onChange={(e) => updateLine(index, { reaction: e.target.value || undefined })}
            />
          </Stack>
        </Box>
      ))}

      <Divider />
      <Button startIcon={<AddIcon />} onClick={addLine} sx={{ alignSelf: 'flex-start' }}>
        Add line
      </Button>
    </Stack>
  );
}

function reindex(lines: DialogueLine[]): DialogueLine[] {
  return lines.map((line, index) => ({ ...line, displayOrder: index }));
}
