import Box from '@mui/material/Box';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

/**
 * Layout for every public-facing route (home, series, episodes, topics,
 * characters, about, search, bookmarks). Deliberately separate from the
 * admin layout tree — the public bundle never imports admin navigation,
 * admin components or auth-session UI, so there is no accidental code
 * path (or client bundle leak) that could expose admin affordances here.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Header />
      <Box component="main" id="main-content" sx={{ flex: 1 }} tabIndex={-1}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
