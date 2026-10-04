import { describe, expect, it } from 'vitest';
import { parseFormula } from '@/lib/utilities/formula';

describe('parseFormula', () => {
  it('parses variables and subscripts', () => {
    const segments = parseFormula('y = {theta}_0 + {theta}_1 * x');
    expect(segments).toEqual([
      { kind: 'text', value: 'y = ' },
      { kind: 'variable', value: 'theta' },
      { kind: 'subscript', value: '0' },
      { kind: 'text', value: ' + ' },
      { kind: 'variable', value: 'theta' },
      { kind: 'subscript', value: '1' },
      { kind: 'text', value: ' * x' },
    ]);
  });

  it('parses superscripts', () => {
    const segments = parseFormula('x^2 + y^2 = r^2');
    expect(segments.filter((s) => s.kind === 'superscript')).toEqual([
      { kind: 'superscript', value: '2' },
      { kind: 'superscript', value: '2' },
      { kind: 'superscript', value: '2' },
    ]);
  });

  it('parses braced superscripts/subscripts with multi-character content', () => {
    const segments = parseFormula('a^{n+1}_{i,j}');
    expect(segments).toEqual([
      { kind: 'text', value: 'a' },
      { kind: 'superscript', value: 'n+1' },
      { kind: 'subscript', value: 'i,j' },
    ]);
  });

  it('returns a single text segment for plain text with no tokens', () => {
    expect(parseFormula('plain text')).toEqual([{ kind: 'text', value: 'plain text' }]);
  });
});
