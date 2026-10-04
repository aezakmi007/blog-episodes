import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import type { ContentBlock } from '@/models/content-block.model';
import { colorTokens } from '@/theme/tokens';

type SceneBlockData = Extract<ContentBlock, { type: 'scene' }>;

const THEME_GRADIENTS: Record<SceneBlockData['backgroundTheme'], string> = {
  'balcony-morning': `linear-gradient(135deg, ${colorTokens.amber[100]} 0%, ${colorTokens.cream.base} 100%)`,
  'rooftop-evening': `linear-gradient(135deg, ${colorTokens.navy[700]} 0%, ${colorTokens.navy[900]} 100%)`,
  'classroom-flashback': `linear-gradient(135deg, ${colorTokens.neutral[200]} 0%, ${colorTokens.cream[200]} 100%)`,
  neutral: `linear-gradient(135deg, ${colorTokens.neutral[100]} 0%, ${colorTokens.neutral[50]} 100%)`,
};

const DARK_THEMES = new Set<SceneBlockData['backgroundTheme']>(['rooftop-evening']);

/**
 * A full-bleed, illustrated-feeling scene header. No illustration asset
 * exists yet, so the "ambient visual" is a theme-appropriate gradient —
 * swapping in a real illustration later (via `illustration`) is additive,
 * not a rewrite of this component.
 */
export default function SceneBlock({ block }: { block: SceneBlockData }) {
  const isDark = DARK_THEMES.has(block.backgroundTheme);

  return (
    <Box
      id={block.id}
      role="group"
      aria-label={`Scene: ${block.sceneTitle}`}
      sx={{
        background: THEME_GRADIENTS[block.backgroundTheme],
        color: isDark ? colorTokens.neutral[50] : colorTokens.navy[900],
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        my: 4,
        scrollMarginTop: '96px',
      }}
    >
      <Typography
        variant="overline"
        sx={{ opacity: 0.75, fontWeight: 700, letterSpacing: '0.1em' }}
      >
        {block.sessionLabel}
      </Typography>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        {block.sceneTitle}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }} sx={{ mb: 2, opacity: 0.9 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <PlaceIcon fontSize="small" />
          <Typography variant="body2">{block.location}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <ScheduleIcon fontSize="small" />
          <Typography variant="body2">{block.time}</Typography>
        </Stack>
      </Stack>
      <Typography variant="body1" sx={{ fontStyle: 'italic', opacity: 0.9, maxWidth: 640 }}>
        {block.ambientDescription}
      </Typography>
    </Box>
  );
}
