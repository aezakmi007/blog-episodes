'use client';

import * as React from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { theme } from './theme';

/**
 * Client-side theming boundary for the whole app.
 *
 * - `AppRouterCacheProvider` wires Emotion's SSR cache correctly for the
 *   App Router (without it, styles flash/flicker on first paint).
 * - `InitColorSchemeScript` injects a tiny inline script before hydration
 *   that reads the persisted color-scheme preference and sets the
 *   `data-mui-color-scheme` attribute on <html> synchronously, so there is
 *   no flash of the wrong theme (FOUC) — this is the only inline script in
 *   the app and it contains no user data.
 * - `defaultMode="system"` respects the visitor's OS preference until they
 *   explicitly toggle light/dark via the UI (ModeToggle, added in Phase 5).
 *
 * This file is intentionally the *only* client boundary at the root —
 * everything it wraps can still be Server Components; MUI's CSS-vars theme
 * does not force its children into client-side rendering.
 */
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <InitColorSchemeScript attribute="data" defaultMode="system" />
      <ThemeProvider theme={theme} defaultMode="system" disableTransitionOnChange>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
