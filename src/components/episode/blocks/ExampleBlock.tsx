import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import type { ContentBlock } from '@/models/content-block.model';
import MarkdownText from '../MarkdownText';

type ExampleBlockData = Extract<ContentBlock, { type: 'example' }>;

export default function ExampleBlock({ block }: { block: ExampleBlockData }) {
  return (
    <Paper variant="outlined" sx={{ my: 3, p: { xs: 2.5, md: 3 }, borderStyle: 'dashed' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Chip label="Example" size="small" />
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {block.title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
        {block.scenario}
      </Typography>
      <MarkdownText>{block.walkthroughMarkdown}</MarkdownText>
      {block.outcome && (
        <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 600 }}>
          Outcome: {block.outcome}
        </Typography>
      )}
    </Paper>
  );
}
