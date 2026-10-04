'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { ContentBlock } from '@/models/content-block.model';
import { parseFormula, type FormulaSegment } from '@/lib/utilities/formula';

type FormulaBlockData = Extract<ContentBlock, { type: 'formula' }>;

function FormulaDisplay({ formula }: { formula: string }) {
  const segments = parseFormula(formula);
  return (
    <Typography
      component="div"
      sx={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.6 }}
    >
      {segments.map((segment: FormulaSegment, index: number) => {
        switch (segment.kind) {
          case 'variable':
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Box key={index} component="em" sx={{ fontStyle: 'italic', color: 'secondary.main' }}>
                {segment.value}
              </Box>
            );
          case 'superscript':
            // eslint-disable-next-line react/no-array-index-key
            return <sup key={index}>{segment.value}</sup>;
          case 'subscript':
            // eslint-disable-next-line react/no-array-index-key
            return <sub key={index}>{segment.value}</sub>;
          default:
            // eslint-disable-next-line react/no-array-index-key
            return <React.Fragment key={index}>{segment.value}</React.Fragment>;
        }
      })}
    </Typography>
  );
}

/**
 * The "blackboard" / formula component. No LaTeX required: the formula
 * string uses the simplified syntax parsed by lib/utilities/formula.ts.
 */
export default function FormulaBlock({ block }: { block: FormulaBlockData }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(block.formula);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Soft failure — formula remains visible and selectable regardless.
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        my: 3,
        p: { xs: 2.5, md: 3 },
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'background.default' : 'primary.main'),
        color: (theme) => (theme.palette.mode === 'dark' ? 'text.primary' : 'primary.contrastText'),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="overline" sx={{ opacity: 0.8, fontWeight: 700 }}>
          {block.title}
        </Typography>
        {block.allowCopy && (
          <Tooltip title={copied ? 'Copied' : 'Copy formula'}>
            <IconButton size="small" onClick={handleCopy} sx={{ color: 'inherit' }} aria-label="Copy formula">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box
        sx={{
          bgcolor: 'rgba(255,255,255,0.08)',
          borderRadius: 1.5,
          p: 2,
          mb: block.stepByStepExplanation.length > 0 || block.variables.length > 0 ? 2 : 0,
          overflowX: 'auto',
        }}
      >
        <FormulaDisplay formula={block.formula} />
      </Box>

      {block.variables.length > 0 && (
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          {block.variables.map((v) => (
            <Typography variant="body2" key={v.symbol} sx={{ opacity: 0.9 }}>
              <strong>{v.symbol}</strong> — {v.meaning}
            </Typography>
          ))}
        </Stack>
      )}

      {block.stepByStepExplanation.length > 0 && (
        <Stack spacing={0.75} component="ol" sx={{ pl: 3, m: 0 }}>
          {block.stepByStepExplanation.map((step, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Typography component="li" variant="body2" key={index} sx={{ opacity: 0.9 }}>
              {step}
            </Typography>
          ))}
        </Stack>
      )}

      {block.numericalExample && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
            Numerical example
          </Typography>
          <Typography variant="body2">{block.numericalExample}</Typography>
        </Box>
      )}

      {block.derivation && (
        <Accordion
          variant="outlined"
          sx={{
            mt: 2,
            bgcolor: 'transparent',
            color: 'inherit',
            borderColor: 'rgba(255,255,255,0.2)',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'inherit' }} />}>
            <Typography variant="body2">Show derivation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2">{block.derivation}</Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
}
