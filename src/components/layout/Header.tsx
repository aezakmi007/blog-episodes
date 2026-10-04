'use client';

import * as React from 'react';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

/**
 * Public site header. This is the ONLY public-facing navigation — it must
 * never link to /admin/* (admin navigation lives exclusively inside the
 * admin layout, rendered only after server-side session verification).
 */
const NAV_LINKS = [
  { href: '/series', label: 'Series' },
  { href: '/topics', label: 'Topics' },
  { href: '/characters', label: 'Characters' },
  { href: '/about', label: 'About' },
] as const;

export default function Header() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundImage: 'none',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 'var(--header-height)', gap: 2 }}>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: { xs: 1, md: 0 },
            }}
          >
            Shyam &amp; Salim{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              Learn ML
            </Box>
          </Typography>

          {isDesktop && (
            <Stack direction="row" spacing={1} sx={{ flexGrow: 1, ml: 2 }} component="nav" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <Button key={link.href} component={Link} href={link.href} color="inherit" sx={{ fontWeight: 500 }}>
                  {link.label}
                </Button>
              ))}
            </Stack>
          )}

          <Button
            component={Link}
            href="/search"
            variant="outlined"
            color="inherit"
            size="small"
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Search
          </Button>

          {!isDesktop && (
            <IconButton
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileOpen((open) => !open)}
              edge="end"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          )}
        </Toolbar>
      </Container>

      <Drawer
        id="mobile-nav-drawer"
        anchor="right"
        open={!isDesktop && mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ width: 280, pt: 2 }} role="navigation" aria-label="Primary">
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                sx={{ minHeight: 48 }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <ListItemButton component={Link} href="/search" onClick={() => setMobileOpen(false)} sx={{ minHeight: 48 }}>
              <ListItemText primary="Search" />
            </ListItemButton>
            <ListItemButton component={Link} href="/bookmarks" onClick={() => setMobileOpen(false)} sx={{ minHeight: 48 }}>
              <ListItemText primary="Bookmarks" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
