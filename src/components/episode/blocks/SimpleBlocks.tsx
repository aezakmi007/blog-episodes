import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import type { ContentBlock } from '@/models/content-block.model';
import { CHARACTERS } from '@/features/characters/characters.data';

/**
 * Several straightforward, presentation-only block types grouped into one
 * file (banter, common-confusion, exam-tip, homework, summary, teaser,
 * divider) — each is a small card or list with no shared layout logic
 * complex enough to justify its own file.
 */

export function BanterCallout({ block }: { block: Extract<ContentBlock, { type: 'banter' }> }) {
  const character = block.speaker ? CHARACTERS[block.speaker] : undefined;
  return (
    <Paper
      variant="outlined"
      sx={{
        my: 3,
        p: 2,
        borderRadius: 3,
        bgcolor: 'action.hover',
        borderStyle: 'dashed',
      }}
    >
      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
        {character && (
          <Box component="span" sx={{ fontWeight: 700, color: character.accentColor, mr: 0.75 }}>
            {character.displayName}:
          </Box>
        )}
        {block.text}
        {block.reactionEmoji && <Box component="span" sx={{ ml: 1 }}>{block.reactionEmoji}</Box>}
      </Typography>
    </Paper>
  );
}

export function ConfusionBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'confusion' }> }) {
  return (
    <Paper variant="outlined" sx={{ my: 3, p: { xs: 2.5, md: 3 }, borderColor: 'error.main' }}>
      <Chip label="Common confusion" size="small" color="error" sx={{ mb: 1.5 }} />
      <Typography variant="body2" sx={{ mb: 1, textDecoration: 'line-through', color: 'text.secondary' }}>
        {block.misconception}
      </Typography>
      <Typography variant="body1">{block.clarification}</Typography>
    </Paper>
  );
}

export function ExamTipBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'examTip' }> }) {
  return (
    <Paper
      variant="outlined"
      sx={{ my: 3, p: 2.5, bgcolor: 'warning.light', color: 'warning.contrastText', borderColor: 'warning.main' }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <LightbulbOutlinedIcon fontSize="small" />
        <Typography variant="body2">
          <strong>Exam tip:</strong> {block.tip}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function HomeworkBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'homework' }> }) {
  return (
    <Paper variant="outlined" sx={{ my: 3, p: { xs: 2.5, md: 3 } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <EmojiObjectsOutlinedIcon fontSize="small" color="secondary" />
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Sunday homework
        </Typography>
        {block.dueLabel && <Chip label={block.dueLabel} size="small" sx={{ ml: 'auto' }} />}
      </Stack>
      <List disablePadding>
        {block.tasks.map((task) => (
          <ListItem key={task} disableGutters sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleOutlineIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={task} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export function SummaryBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'summary' }> }) {
  return (
    <Paper
      id={block.id}
      variant="outlined"
      sx={{ my: 3, p: { xs: 2.5, md: 3 }, bgcolor: 'background.default', scrollMarginTop: '96px' }}
    >
      <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        {block.title}
      </Typography>
      <List disablePadding>
        {block.points.map((point) => (
          <ListItem key={point} disableGutters sx={{ py: 0.5, alignItems: 'flex-start' }}>
            <ListItemIcon sx={{ minWidth: 24, mt: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'secondary.main' }} />
            </ListItemIcon>
            <ListItemText primary={point} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export function TeaserBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'teaser' }> }) {
  const content = (
    <Paper
      variant="outlined"
      sx={{
        my: 3,
        p: { xs: 2.5, md: 3 },
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        textDecoration: 'none',
      }}
    >
      <Typography variant="overline" sx={{ opacity: 0.8 }}>
        Next Sunday
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {block.nextEpisodeTitle}
        </Typography>
        {block.nextEpisodeSlug && <ArrowForwardIcon />}
      </Stack>
      <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
        {block.teaserText}
      </Typography>
    </Paper>
  );

  if (!block.nextEpisodeSlug) return content;
  return (
    <Link href={`/episodes/${block.nextEpisodeSlug}`} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  );
}

export function DividerBlockRenderer({ block }: { block: Extract<ContentBlock, { type: 'divider' }> }) {
  const symbol = block.style === 'chai-cup' ? '☕' : block.style === 'ellipsis' ? '···' : '';
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ my: 4 }} aria-hidden={!block.label}>
      {block.style !== 'plain' && <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />}
      {(symbol || block.label) && (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {block.label ?? symbol}
        </Typography>
      )}
      {block.style !== 'plain' && <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />}
    </Stack>
  );
}
