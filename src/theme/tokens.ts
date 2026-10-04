/**
 * Design tokens — the single source of truth for every color used in the
 * product. Nothing outside this file (and theme.ts, which consumes it)
 * should contain a raw hex value. Components read colors through the MUI
 * theme (`theme.palette.*`, `theme.vars.palette.*`) which is generated
 * from these tokens, never by importing this file directly in components.
 *
 * Naming mirrors the brand brief:
 *  - navy: primary brand color, authority + calm
 *  - amber: warm accent, Sunday sunlight, Shyam's accent color
 *  - cream: light-mode canvas, "Sunday morning"
 *  - teal: secondary accent, concept/info surfaces, Salim's accent color
 *  - coral: tertiary accent, warnings/highlights, banter callouts
 *  - ink: dark-mode canvas, "evening chai" background
 */
export const colorTokens = {
  navy: {
    900: '#0B1220',
    800: '#172554',
    700: '#1E3A6E',
    600: '#2C4E8C',
    400: '#6B86B5',
    200: '#C3CEE3',
  },
  amber: {
    700: '#B45309',
    600: '#D97706',
    500: '#F59E0B',
    300: '#FCD34D',
    100: '#FEF3C7',
  },
  teal: {
    800: '#0B4F49',
    700: '#0F766E',
    500: '#14B8A6',
    300: '#5EEAD4',
    100: '#CCFBF1',
  },
  coral: {
    700: '#C2410C',
    600: '#E0552B',
    500: '#F97360',
    300: '#FCA89A',
    100: '#FEE4DD',
  },
  cream: {
    base: '#FFF8E7',
    100: '#FFFDF8',
    200: '#FFF1D6',
  },
  ink: {
    base: '#07111F',
    100: '#0D1B2E',
    200: '#13243B',
  },
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#EEF2F6',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  success: '#2E7D32',
  warning: '#B45309',
  error: '#C2410C',
  info: '#0F766E',
} as const;

/** Character accent colors, re-exported here so the theme and the
 * characters feature read from one token set. Actual character profile
 * data (bio, avatar, badges) lives in src/features/characters, not here —
 * this file only owns color. */
export const characterColorTokens = {
  shyam: colorTokens.amber[600],
  salim: colorTokens.teal[700],
} as const;
