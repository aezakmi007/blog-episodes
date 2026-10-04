'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LinkIcon from '@mui/icons-material/Link';
import type { ContentBlock } from '@/models/content-block.model';
import { isBookmarked, toggleBookmark } from '@/lib/utilities/bookmarks-client';

type ConceptBlockData = Extract<ContentBlock, { type: 'concept' }>;

export default function ConceptCard({
  block,
  episodeSlug,
  episodeTitle,
}: {
  block: ConceptBlockData;
  episodeSlug: string;
  episodeTitle: string;
}) {
  const [tab, setTab] = React.useState<'simple' | 'technical'>('simple');
  const [bookmarked, setBookmarked] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setBookmarked(isBookmarked(block.anchorId));
  }, [block.anchorId]);

  function handleBookmark() {
    const next = toggleBookmark({
      conceptAnchorId: block.anchorId,
      conceptName: block.conceptName,
      episodeSlug,
      episodeTitle,
    });
    setBookmarked(next);
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/episodes/${episodeSlug}#${block.anchorId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard can be unavailable; the anchor is still in the address
      // bar once the user scrolls there, so this is a soft failure.
    }
  }

  return (
    <Paper
      id={block.anchorId}
      variant="outlined"
      sx={{ my: 3, p: { xs: 2.5, md: 3 }, scrollMarginTop: '96px', borderColor: 'secondary.main', borderWidth: 1.5 }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label="Concept" size="small" color="secondary" />
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {block.conceptName}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Copy link to this concept">
            <IconButton size="small" onClick={handleCopyLink} aria-label="Copy link to this concept">
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {block.bookmarkable && (
            <Tooltip title={bookmarked ? 'Remove bookmark' : 'Bookmark this concept'}>
              <IconButton
                size="small"
                onClick={handleBookmark}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this concept'}
              >
                {bookmarked ? <BookmarkIcon fontSize="small" color="secondary" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Tabs value={tab} onChange={(_e, next) => setTab(next)} sx={{ mb: 1.5, minHeight: 36 }}>
        <Tab label="Simple" value="simple" sx={{ minHeight: 36, py: 0.5 }} />
        <Tab label="Technical" value="technical" sx={{ minHeight: 36, py: 0.5 }} />
      </Tabs>

      <Typography variant="body1" sx={{ mb: 2 }}>
        {tab === 'simple' ? block.simpleDefinition : block.technicalDefinition}
      </Typography>

      <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: block.relatedTerms.length > 0 ? 1.5 : 0 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
          Real-world example
        </Typography>
        <Typography variant="body2">{block.realWorldExample}</Typography>
      </Box>

      {block.relatedTerms.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {block.relatedTerms.map((term) => (
            <Chip key={term} label={term} size="small" variant="outlined" />
          ))}
        </Stack>
      )}

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Link copied"
      />
    </Paper>
  );
}
