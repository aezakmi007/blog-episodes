'use client';

import { m, LazyMotion, domAnimation, useReducedMotion } from 'framer-motion';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import type { ContentBlock } from '@/models/content-block.model';
import MarkdownText from '../MarkdownText';

type FlashbackBlockData = Extract<ContentBlock, { type: 'flashback' }>;

/**
 * A visually distinct "memory" presentation: warm sepia tone, notebook
 * texture, a date badge, and (motion permitting) a gentle entry. The
 * meaning ("this is a flashback") is carried by the badge, the heading
 * and the border/background styling — never by the animation alone, so
 * it is fully legible with `prefers-reduced-motion` or with JavaScript
 * disabled (the animation wrapper still renders its children, just
 * without the transition, via `useReducedMotion`).
 *
 * `LazyMotion` + the `m` component (rather than importing `motion`
 * directly) keeps Framer Motion's bundle cost to its smaller
 * `domAnimation` feature set, and only on pages that actually render a
 * flashback.
 */
export default function FlashbackBlock({ block }: { block: FlashbackBlockData }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={block.entryAnimation !== 'none' && !prefersReducedMotion ? { opacity: 0, y: 12 } : false}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Box
          sx={{
            my: 4,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 2,
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#2a2015' : '#FBF3E3'),
            border: '1px solid',
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#4a3a22' : '#E6D5B0'),
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <Chip label={block.dateBadge} size="small" sx={{ fontWeight: 700 }} />
            <Typography variant="overline" color="text.secondary">
              Flashback
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
            {block.title}
          </Typography>
          <MarkdownText>{block.bodyMarkdown}</MarkdownText>
        </Box>
      </m.div>
    </LazyMotion>
  );
}
