'use client';

import * as React from 'react';
import Link from 'next/link';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getBookmarks, removeBookmark, type BookmarkEntry } from '@/lib/utilities/bookmarks-client';

export default function BookmarksList() {
  const [bookmarks, setBookmarks] = React.useState<BookmarkEntry[] | null>(null);

  React.useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  function handleRemove(anchorId: string) {
    removeBookmark(anchorId);
    setBookmarks(getBookmarks());
  }

  // Avoid a flash of "no bookmarks" before the client-only read resolves.
  if (bookmarks === null) return null;

  if (bookmarks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No bookmarks yet. Look for the bookmark icon on any concept card.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {bookmarks.map((bookmark) => (
        <Paper
          key={bookmark.conceptAnchorId}
          variant="outlined"
          sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Stack
            component={Link}
            href={`/episodes/${bookmark.episodeSlug}#${bookmark.conceptAnchorId}`}
            sx={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {bookmark.conceptName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {bookmark.episodeTitle}
            </Typography>
          </Stack>
          <IconButton
            aria-label={`Remove bookmark: ${bookmark.conceptName}`}
            onClick={() => handleRemove(bookmark.conceptAnchorId)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Paper>
      ))}
    </Stack>
  );
}
