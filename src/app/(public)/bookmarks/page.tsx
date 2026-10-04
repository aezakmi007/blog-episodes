import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import BookmarksList from '@/components/story/BookmarksList';

export const metadata: Metadata = {
  title: 'Bookmarks',
  description: 'Concepts you’ve bookmarked while reading.',
  robots: { index: false, follow: true },
};

/**
 * Bookmarks live in the visitor's browser (localStorage), so this page is
 * a thin Server Component shell around a Client Component that reads
 * them — nothing here can be rendered server-side since there is nothing
 * to fetch until the browser has localStorage access.
 */
export default function BookmarksPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        Your bookmarks
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 560 }}>
        Saved on this device only, for now — bookmark any concept card while reading an episode.
      </Typography>
      <BookmarksList />
    </Container>
  );
}
