'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ArticleIcon from '@mui/icons-material/Article';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { logoutAction } from '@/features/auth/actions';
import type { SafeAdmin } from '@/models/admin.model';

const DRAWER_WIDTH = 256;

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
  { href: '/admin/episodes', label: 'Episodes', icon: <ArticleIcon /> },
  { href: '/admin/series', label: 'Series', icon: <CollectionsBookmarkIcon /> },
  { href: '/admin/modules', label: 'Modules', icon: <ViewModuleIcon /> },
  { href: '/admin/media', label: 'Media', icon: <PermMediaIcon /> },
  { href: '/admin/settings', label: 'Settings', icon: <SettingsIcon /> },
] as const;

/**
 * Client Component shell for everything under /admin. This file is never
 * imported by any public route, so none of its navigation, icons or admin
 * affordances ship in the public bundle. The session check that actually
 * gates access happened server-side in app/admin/layout.tsx before this
 * component ever renders — this component only presents UI for an
 * already-verified admin.
 */
export default function AdminShell({
  admin,
  children,
}: {
  admin: SafeAdmin;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navList = (
    <List sx={{ px: 1 }}>
      {NAV_ITEMS.map((item) => {
        const selected = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <ListItemButton
            key={item.href}
            component={Link}
            href={item.href}
            selected={selected}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="subtitle1" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          SSML Admin
        </Typography>
      </Toolbar>
      <Divider />
      {navList}
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {admin.email}
        </Typography>
        <Chip label={admin.role} size="small" sx={{ mt: 0.5, mb: 1.5 }} />
        <form action={logoutAction}>
          <ListItemButton component="button" type="submit" sx={{ borderRadius: 2, width: '100%' }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </ListItemButton>
        </form>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'none',
        }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Admin
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          >
            {drawerContent}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawerContent}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          px: { xs: 2, md: 4 },
          py: { xs: 10, md: 12 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
