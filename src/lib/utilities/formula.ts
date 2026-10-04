/**
 * Parses the simplified formula syntax documented in
 * src/models/content-block.model.ts: `^` for superscript, `_` for
 * subscript, `{name}` for a variable/Greek letter rendered in math
 * italics. No LaTeX knowledge required from admins. Returns a flat list
 * of typed segments; the formula block renderer turns these into
 * <sup>/<sub>/<em> spans. Kept framework-free (no JSX) so it's trivially
 * unit-testable.
 */
export type FormulaSegment =
  | { kind: 'text'; value: string }
  | { kind: 'variable'; value: string }
  | { kind: 'superscript'; value: string }
  | { kind: 'subscript'; value: string };

const TOKEN_PATTERN = /\{[^}]+\}|\^\{[^}]+\}|\^[^\s^_{}]|_\{[^}]+\}|_[^\s^_{}]/g;

function stripBraces(token: string): string {
  return token.replace(/^[\^_]?\{/, '').replace(/\}$/, '');
}

export function parseFormula(formula: string): FormulaSegment[] {
  const segments: FormulaSegment[] = [];
  let lastIndex = 0;

  for (const match of formula.matchAll(TOKEN_PATTERN)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      segments.push({ kind: 'text', value: formula.slice(lastIndex, index) });
    }

    if (token.startsWith('^')) {
      segments.push({ kind: 'superscript', value: stripBraces(token.slice(1)) });
    } else if (token.startsWith('_')) {
      segments.push({ kind: 'subscript', value: stripBraces(token.slice(1)) });
    } else {
      segments.push({ kind: 'variable', value: stripBraces(token) });
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < formula.length) {
    segments.push({ kind: 'text', value: formula.slice(lastIndex) });
  }

  return segments;
}
