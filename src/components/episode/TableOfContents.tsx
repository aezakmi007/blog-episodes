'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { TocEntry } from './toc';

export type { TocEntry } from './toc';

function TocList({ entries, onNavigate }: { entries: TocEntry[]; onNavigate?: () => void }) {
  return (
    <List dense disablePadding>
      {entries.map((entry) => (
        <ListItemButton
          key={entry.id}
          component="a"
          href={`#${entry.id}`}
          onClick={onNavigate}
          sx={{ borderRadius: 1, py: 0.5 }}
        >
          <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={entry.label} />
        </ListItemButton>
      ))}
    </List>
  );
}

/**
 * Desktop: sticky sidebar, always visible. Mobile: a collapsed accordion
 * near the top of the article rather than a bottom-sheet drawer — simpler
 * to implement correctly for keyboard/focus order, and avoids a fixed
 * element competing with the reading-progress bar for the same screen
 * edge.
 */
export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  if (entries.length === 0) return null;

  if (isDesktop) {
    return (
      <Box
        component="nav"
        aria-label="Table of contents"
        sx={{ position: 'sticky', top: 96, alignSelf: 'flex-start', width: 240, flexShrink: 0 }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, pl: 1.5 }}>
          On this page
        </Typography>
        <TocList entries={entries} />
      </Box>
    );
  }

  return (
    <Accordion variant="outlined" sx={{ mb: 3 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-label="Table of contents">
        <Typography variant="subtitle2">On this page</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TocList entries={entries} />
      </AccordionDetails>
    </Accordion>
  );
}
