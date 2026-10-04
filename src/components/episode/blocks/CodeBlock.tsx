'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { ContentBlock } from '@/models/content-block.model';

type CodeBlockData = Extract<ContentBlock, { type: 'code' }>;

/**
 * Deliberately plain (no syntax-highlighting library): the brief asks to
 * "avoid loading large ... libraries on pages that do not animate" and,
 * by the same reasoning, pages with a single short snippet shouldn't pay
 * for a full highlighter's parse tables. If a future episode needs rich
 * highlighting, a syntax highlighter can be dynamically imported here
 * without changing the `code` content-block schema.
 */
export default function CodeBlock({ block }: { block: CodeBlockData }) {
  const [copied, setCopied] = React.useState(false);
  const lines = block.code.split('\n');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Soft failure.
    }
  }

  return (
    <Box
      component="figure"
      sx={{ my: 3, mx: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 1, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {block.language}
        </Typography>
        <Tooltip title={copied ? 'Copied' : 'Copy code'}>
          <IconButton size="small" onClick={handleCopy} aria-label="Copy code">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflowX: 'auto',
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0d1b2e' : '#0F172A'),
          color: '#E2E8F0',
          fontSize: '0.85rem',
          lineHeight: 1.6,
        }}
      >
        <Box component="code" sx={{ fontFamily: 'monospace' }}>
          {lines.map((line, index) => (
            <Box
              key={`${index}-${line.slice(0, 8)}`}
              component="span"
              sx={{
                display: 'block',
                bgcolor: block.highlightLines.includes(index + 1) ? 'rgba(245,158,11,0.18)' : 'transparent',
              }}
            >
              {line || ' '}
            </Box>
          ))}
        </Box>
      </Box>
      {block.caption && (
        <Typography
          component="figcaption"
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', px: 2, py: 1 }}
        >
          {block.caption}
        </Typography>
      )}
    </Box>
  );
}
