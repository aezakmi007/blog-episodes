import { describe, expect, it } from 'vitest';
import { colorTokens, characterColorTokens } from '@/theme/tokens';
import { theme } from '@/theme/theme';
import { COLLECTIONS } from '@/lib/db/collections';

describe('design tokens', () => {
  it('exposes the brand palette required by the design brief', () => {
    expect(colorTokens.navy[800]).toBe('#172554');
    expect(colorTokens.amber[500]).toBe('#F59E0B');
    expect(colorTokens.cream.base).toBe('#FFF8E7');
    expect(colorTokens.teal[700]).toBe('#0F766E');
    expect(colorTokens.coral[500]).toBe('#F97360');
    expect(colorTokens.ink.base).toBe('#07111F');
  });

  it('gives each character a distinct accent color', () => {
    expect(characterColorTokens.shyam).not.toBe(characterColorTokens.salim);
  });
});

describe('MUI theme', () => {
  it('defines both a light and a dark color scheme', () => {
    expect(theme.colorSchemes?.light).toBeDefined();
    expect(theme.colorSchemes?.dark).toBeDefined();
  });

  it('uses the display/body font CSS variables rather than hard-coded font names', () => {
    expect(theme.typography.fontFamily).toContain('var(--font-body)');
    expect(theme.typography.h1.fontFamily).toContain('var(--font-display)');
  });
});

describe('collection name constants', () => {
  it('declares every collection required by the content model', () => {
    expect(Object.values(COLLECTIONS)).toEqual(
      expect.arrayContaining([
        'admins',
        'series',
        'modules',
        'episodes',
        'media',
        'auditLogs',
        'siteSettings',
        'tags',
      ]),
    );
  });
});
