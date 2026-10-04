# ADR 0003: MUI `extendTheme` CSS-vars theming

**Status:** Accepted (Phase 1 decision, implemented)

## Context

The brief requires "CSS variables and a centralized Material UI theme so that colors are never
unnecessarily hard-coded inside components," plus light mode ("bright Sunday morning") and dark
mode ("evening chai") that must not flash the wrong theme on load.

## Decision

Build the theme with MUI's `extendTheme` (stable in MUI v6) and `CssVarsProvider`/`ThemeProvider`
with `colorSchemes.light` / `colorSchemes.dark`. MUI then generates real CSS custom properties
(`--ssml-palette-*`, prefixed via `cssVarPrefix: 'ssml'`) automatically from one token file
(`src/theme/tokens.ts`), and `InitColorSchemeScript` sets the active scheme attribute on `<html>`
before hydration, eliminating flash-of-incorrect-theme without a third-party `next-themes`
dependency.

All raw hex values live in exactly one file, `src/theme/tokens.ts`; `theme.ts` maps tokens onto MUI
palette slots; components consume colors exclusively via `theme.palette.*` / `sx` props, which MUI
resolves to the generated CSS variables.

## Alternatives considered

- **Hand-rolled CSS variables + `next-themes`** — would work, but duplicates what MUI's CSS-vars
  theme already provides out of the box in v6, and risks two sources of truth (a `:root` CSS file
  and a separate MUI theme object) drifting apart.
- **Tailwind CSS** — not chosen; the brief specifies Material UI as the component system, and
  mixing Tailwind's utility classes with MUI's `sx`/theme system tends to produce two competing
  styling conventions in one codebase.

## Consequences

- Any future rebrand or dark-mode contrast fix is a change to `tokens.ts` (and, for structural
  palette mapping, `theme.ts`) only — no component file ever needs to change for a color update.
- Character accent colors (Shyam/Salim) are re-exported from the same token file
  (`characterColorTokens`) so the episode reader and the theme never disagree on brand color.
