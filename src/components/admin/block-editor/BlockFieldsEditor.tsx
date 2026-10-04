'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid2';
import type { ContentBlock } from '@/models/content-block.model';
import StringListField from './StringListField';
import DialogueLinesEditor from './DialogueLinesEditor';
import QuizQuestionsEditor from './QuizQuestionsEditor';

/**
 * Renders the field set for exactly one content block, dispatching on
 * `block.type`. This is the visual block editor the brief requires in
 * place of a raw JSON textarea — each block type gets purpose-built
 * fields rather than a generic key/value grid.
 */
export default function BlockFieldsEditor({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (next: ContentBlock) => void;
}) {
  switch (block.type) {
    case 'scene':
      return (
        <Stack spacing={2}>
          <TextField
            label="Scene title"
            fullWidth
            value={block.sceneTitle}
            onChange={(e) => onChange({ ...block, sceneTitle: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Location"
                fullWidth
                value={block.location}
                onChange={(e) => onChange({ ...block, location: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Time"
                fullWidth
                value={block.time}
                onChange={(e) => onChange({ ...block, time: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            label="Session label"
            fullWidth
            value={block.sessionLabel}
            onChange={(e) => onChange({ ...block, sessionLabel: e.target.value })}
          />
          <TextField
            select
            label="Background theme"
            fullWidth
            value={block.backgroundTheme}
            onChange={(e) => onChange({ ...block, backgroundTheme: e.target.value as typeof block.backgroundTheme })}
          >
            <MenuItem value="balcony-morning">Balcony — morning</MenuItem>
            <MenuItem value="rooftop-evening">Rooftop — evening</MenuItem>
            <MenuItem value="classroom-flashback">Classroom — flashback</MenuItem>
            <MenuItem value="neutral">Neutral</MenuItem>
          </TextField>
          <TextField
            label="Ambient description"
            fullWidth
            multiline
            minRows={2}
            value={block.ambientDescription}
            onChange={(e) => onChange({ ...block, ambientDescription: e.target.value })}
          />
        </Stack>
      );

    case 'dialogue':
      return <DialogueLinesEditor lines={block.lines} onChange={(lines) => onChange({ ...block, lines })} />;

    case 'narration':
      return (
        <TextField
          label="Narration text"
          fullWidth
          multiline
          minRows={4}
          value={block.bodyMarkdown}
          onChange={(e) => onChange({ ...block, bodyMarkdown: e.target.value })}
          helperText="Supports **bold**, *italic*, `code` and [links](url)."
        />
      );

    case 'flashback':
      return (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Title"
                fullWidth
                value={block.title}
                onChange={(e) => onChange({ ...block, title: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Date badge"
                fullWidth
                value={block.dateBadge}
                onChange={(e) => onChange({ ...block, dateBadge: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            label="Body"
            fullWidth
            multiline
            minRows={3}
            value={block.bodyMarkdown}
            onChange={(e) => onChange({ ...block, bodyMarkdown: e.target.value })}
          />
        </Stack>
      );

    case 'concept':
      return (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Concept name"
                fullWidth
                value={block.conceptName}
                onChange={(e) => onChange({ ...block, conceptName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Anchor id"
                fullWidth
                helperText="Used for #anchor links and bookmarks"
                value={block.anchorId}
                onChange={(e) => onChange({ ...block, anchorId: e.target.value })}
              />
            </Grid>
          </Grid>
          <TextField
            label="Simple definition"
            fullWidth
            multiline
            minRows={2}
            value={block.simpleDefinition}
            onChange={(e) => onChange({ ...block, simpleDefinition: e.target.value })}
          />
          <TextField
            label="Technical definition"
            fullWidth
            multiline
            minRows={2}
            value={block.technicalDefinition}
            onChange={(e) => onChange({ ...block, technicalDefinition: e.target.value })}
          />
          <TextField
            label="Real-world example"
            fullWidth
            multiline
            minRows={2}
            value={block.realWorldExample}
            onChange={(e) => onChange({ ...block, realWorldExample: e.target.value })}
          />
          <StringListField
            label="Related terms"
            value={block.relatedTerms}
            onChange={(relatedTerms) => onChange({ ...block, relatedTerms })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.bookmarkable}
                onChange={(e) => onChange({ ...block, bookmarkable: e.target.checked })}
              />
            }
            label="Bookmarkable"
          />
        </Stack>
      );

    case 'formula':
      return (
        <Stack spacing={2}>
          <TextField
            label="Title"
            fullWidth
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <TextField
            label="Formula"
            fullWidth
            value={block.formula}
            helperText="Use ^ for superscript, _ for subscript, {name} for variables/Greek letters — e.g. y = {theta}_0 + {theta}_1 * x"
            onChange={(e) => onChange({ ...block, formula: e.target.value })}
          />
          <StringListField
            label="Step-by-step explanation"
            value={block.stepByStepExplanation}
            onChange={(stepByStepExplanation) => onChange({ ...block, stepByStepExplanation })}
          />
          <TextField
            label="Numerical example (optional)"
            fullWidth
            multiline
            minRows={2}
            value={block.numericalExample ?? ''}
            onChange={(e) => onChange({ ...block, numericalExample: e.target.value || undefined })}
          />
          <TextField
            label="Derivation (optional, shown collapsed)"
            fullWidth
            multiline
            minRows={2}
            value={block.derivation ?? ''}
            onChange={(e) => onChange({ ...block, derivation: e.target.value || undefined })}
          />
        </Stack>
      );

    case 'code':
      return (
        <Stack spacing={2}>
          <TextField
            label="Language"
            value={block.language}
            onChange={(e) => onChange({ ...block, language: e.target.value })}
            sx={{ maxWidth: 200 }}
          />
          <TextField
            label="Code"
            fullWidth
            multiline
            minRows={6}
            value={block.code}
            onChange={(e) => onChange({ ...block, code: e.target.value })}
            slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: '0.875rem' } } }}
          />
          <TextField
            label="Caption (optional)"
            fullWidth
            value={block.caption ?? ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
          />
        </Stack>
      );

    case 'example':
      return (
        <Stack spacing={2}>
          <TextField
            label="Title"
            fullWidth
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <TextField
            label="Scenario"
            fullWidth
            multiline
            minRows={2}
            value={block.scenario}
            onChange={(e) => onChange({ ...block, scenario: e.target.value })}
          />
          <TextField
            label="Walkthrough"
            fullWidth
            multiline
            minRows={3}
            value={block.walkthroughMarkdown}
            onChange={(e) => onChange({ ...block, walkthroughMarkdown: e.target.value })}
          />
          <TextField
            label="Outcome (optional)"
            fullWidth
            multiline
            minRows={2}
            value={block.outcome ?? ''}
            onChange={(e) => onChange({ ...block, outcome: e.target.value || undefined })}
          />
        </Stack>
      );

    case 'table':
      return (
        <Stack spacing={2}>
          <StringListField
            label="Columns"
            value={block.columns}
            onChange={(columns) => onChange({ ...block, columns })}
            helperText="One column header per line"
          />
          <TextField
            label="Rows"
            fullWidth
            multiline
            minRows={4}
            value={block.rows.map((row) => row.join(' | ')).join('\n')}
            helperText="One row per line, cells separated by | — e.g. Present | 42"
            onChange={(e) =>
              onChange({
                ...block,
                rows: e.target.value.split('\n').map((row) => row.split('|').map((cell) => cell.trim())),
              })
            }
          />
          <TextField
            label="Note (optional)"
            fullWidth
            value={block.note ?? ''}
            onChange={(e) => onChange({ ...block, note: e.target.value || undefined })}
          />
        </Stack>
      );

    case 'image':
      return (
        <Stack spacing={2}>
          <TextField
            label="Image URL"
            fullWidth
            value={block.image.src}
            helperText="Upload via /admin/media, then paste the URL here"
            onChange={(e) => onChange({ ...block, image: { ...block.image, src: e.target.value } })}
          />
          <TextField
            label="Alt text"
            fullWidth
            value={block.image.alt}
            required={!block.decorative}
            onChange={(e) => onChange({ ...block, image: { ...block.image, alt: e.target.value } })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={block.decorative}
                onChange={(e) => onChange({ ...block, decorative: e.target.checked })}
              />
            }
            label="Decorative (hidden from screen readers)"
          />
          <TextField
            label="Caption (optional)"
            fullWidth
            value={block.caption ?? ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
          />
          <TextField
            label="Credit (optional)"
            fullWidth
            value={block.credit ?? ''}
            onChange={(e) => onChange({ ...block, credit: e.target.value || undefined })}
          />
        </Stack>
      );

    case 'banter':
      return (
        <Stack spacing={2}>
          <TextField
            select
            label="Speaker (optional)"
            fullWidth
            value={block.speaker ?? ''}
            onChange={(e) =>
              onChange({ ...block, speaker: (e.target.value || undefined) as typeof block.speaker })
            }
          >
            <MenuItem value="">Either / unspecified</MenuItem>
            <MenuItem value="shyam">Shyam</MenuItem>
            <MenuItem value="salim">Salim</MenuItem>
          </TextField>
          <TextField
            label="Text"
            fullWidth
            multiline
            minRows={2}
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
          />
          <TextField
            label="Reaction emoji (optional)"
            value={block.reactionEmoji ?? ''}
            onChange={(e) => onChange({ ...block, reactionEmoji: e.target.value || undefined })}
            sx={{ maxWidth: 160 }}
          />
        </Stack>
      );

    case 'confusion':
      return (
        <Stack spacing={2}>
          <TextField
            label="Misconception"
            fullWidth
            multiline
            minRows={2}
            value={block.misconception}
            onChange={(e) => onChange({ ...block, misconception: e.target.value })}
          />
          <TextField
            label="Clarification"
            fullWidth
            multiline
            minRows={2}
            value={block.clarification}
            onChange={(e) => onChange({ ...block, clarification: e.target.value })}
          />
        </Stack>
      );

    case 'examTip':
      return (
        <Stack spacing={2}>
          <TextField
            label="Tip"
            fullWidth
            multiline
            minRows={2}
            value={block.tip}
            onChange={(e) => onChange({ ...block, tip: e.target.value })}
          />
          <TextField
            select
            label="Importance"
            value={block.importance}
            onChange={(e) => onChange({ ...block, importance: e.target.value as typeof block.importance })}
            sx={{ maxWidth: 200 }}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </Stack>
      );

    case 'quiz':
      return (
        <Stack spacing={2}>
          <TextField
            label="Quiz title"
            fullWidth
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <QuizQuestionsEditor
            questions={block.questions}
            onChange={(questions) => onChange({ ...block, questions })}
          />
        </Stack>
      );

    case 'homework':
      return (
        <Stack spacing={2}>
          <StringListField label="Tasks" value={block.tasks} onChange={(tasks) => onChange({ ...block, tasks })} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Due label (optional)"
                fullWidth
                value={block.dueLabel ?? ''}
                onChange={(e) => onChange({ ...block, dueLabel: e.target.value || undefined })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Difficulty"
                fullWidth
                value={block.difficulty}
                onChange={(e) => onChange({ ...block, difficulty: e.target.value as typeof block.difficulty })}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="challenge">Challenge</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      );

    case 'summary':
      return (
        <Stack spacing={2}>
          <TextField
            label="Title"
            fullWidth
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
          />
          <StringListField label="Points" value={block.points} onChange={(points) => onChange({ ...block, points })} />
        </Stack>
      );

    case 'teaser':
      return (
        <Stack spacing={2}>
          <TextField
            label="Next episode title"
            fullWidth
            value={block.nextEpisodeTitle}
            onChange={(e) => onChange({ ...block, nextEpisodeTitle: e.target.value })}
          />
          <TextField
            label="Teaser text"
            fullWidth
            multiline
            minRows={2}
            value={block.teaserText}
            onChange={(e) => onChange({ ...block, teaserText: e.target.value })}
          />
        </Stack>
      );

    case 'divider':
      return (
        <Stack spacing={2}>
          <TextField
            select
            label="Style"
            value={block.style}
            onChange={(e) => onChange({ ...block, style: e.target.value as typeof block.style })}
            sx={{ maxWidth: 220 }}
          >
            <MenuItem value="chai-cup">Chai cup</MenuItem>
            <MenuItem value="ellipsis">Ellipsis</MenuItem>
            <MenuItem value="scene-break">Scene break</MenuItem>
            <MenuItem value="plain">Plain</MenuItem>
          </TextField>
          <TextField
            label="Label (optional)"
            fullWidth
            value={block.label ?? ''}
            onChange={(e) => onChange({ ...block, label: e.target.value || undefined })}
          />
        </Stack>
      );

    default:
      return null;
  }
}
