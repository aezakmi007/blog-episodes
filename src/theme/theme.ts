import { extendTheme } from '@mui/material/styles';
import { colorTokens } from './tokens';

/**
 * Centralized MUI theme, built with `extendTheme` so MUI emits real CSS
 * custom properties (--mui-palette-*, --mui-shape-*, ...) under the hood.
 * Components should read `theme.vars.palette.*` (or just `theme.palette.*`
 * via the sx prop, which MUI resolves to the CSS var automatically) rather
 * than importing tokens.ts directly — this keeps every color swappable
 * from this one file and ensures light/dark mode "just works" without a
 * flash of incorrect theme.
 *
 * Color scheme selection is class-based (`data-mui-color-scheme`) and
 * wired up in ThemeRegistry via `InitColorSchemeScript`, so the correct
 * mode is known before first paint (no FOUC).
 */
export const theme = extendTheme({
  cssVarPrefix: 'ssml',
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
        primary: {
          main: colorTokens.navy[800],
          light: colorTokens.navy[600],
          dark: colorTokens.navy[900],
          contrastText: colorTokens.neutral[0],
        },
        secondary: {
          main: colorTokens.teal[700],
          light: colorTokens.teal[500],
          dark: colorTokens.teal[800],
          contrastText: colorTokens.neutral[0],
        },
        warning: {
          main: colorTokens.amber[600],
          light: colorTokens.amber[500],
          dark: colorTokens.amber[700],
          contrastText: colorTokens.ink.base,
        },
        error: {
          main: colorTokens.coral[600],
          light: colorTokens.coral[500],
          dark: colorTokens.coral[700],
          contrastText: colorTokens.neutral[0],
        },
        success: {
          main: colorTokens.success,
        },
        info: {
          main: colorTokens.teal[700],
        },
        background: {
          default: colorTokens.cream.base,
          paper: colorTokens.cream[100],
        },
        text: {
          primary: colorTokens.navy[900],
          secondary: colorTokens.neutral[600],
        },
        divider: colorTokens.neutral[200],
      },
    },
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: colorTokens.amber[500],
          light: colorTokens.amber[300],
          dark: colorTokens.amber[700],
          contrastText: colorTokens.ink.base,
        },
        secondary: {
          main: colorTokens.teal[500],
          light: colorTokens.teal[300],
          dark: colorTokens.teal[700],
          contrastText: colorTokens.ink.base,
        },
        warning: {
          main: colorTokens.amber[500],
          contrastText: colorTokens.ink.base,
        },
        error: {
          main: colorTokens.coral[500],
          contrastText: colorTokens.ink.base,
        },
        success: {
          main: '#4ADE80',
        },
        info: {
          main: colorTokens.teal[300],
        },
        background: {
          default: colorTokens.ink.base,
          paper: colorTokens.ink[100],
        },
        text: {
          primary: colorTokens.neutral[50],
          secondary: colorTokens.neutral[300],
        },
        divider: colorTokens.ink[200],
      },
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'var(--font-body), "Segoe UI", system-ui, sans-serif',
    h1: { fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontFamily: 'var(--font-display)', fontWeight: 600 },
    h4: { fontFamily: 'var(--font-display)', fontWeight: 600 },
    h5: { fontFamily: 'var(--font-display)', fontWeight: 600 },
    h6: { fontFamily: 'var(--font-display)', fontWeight: 600 },
    // Comfortable long-form reading: generous line-height, body copy sizes
    // tuned for the 60-75ch measure enforced in the episode reader layout.
    body1: { fontSize: '1.0625rem', lineHeight: 1.75 },
    body2: { fontSize: '0.9375rem', lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*:focus-visible': {
          outline: `3px solid ${colorTokens.teal[500]}`,
          outlineOffset: '2px',
        },
        'html, body': {
          scrollBehavior: 'auto',
        },
        '@media (prefers-reduced-motion: no-preference)': {
          'html:focus-within': {
            scrollBehavior: 'smooth',
          },
        },
      },
    },
  },
});
