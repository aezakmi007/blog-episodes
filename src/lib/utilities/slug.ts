import slugify from 'slugify';

export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/**
 * Appends a short numeric suffix (`-2`, `-3`, ...) until `isTaken` returns
 * false. Used by services to guarantee slug uniqueness at the scope the
 * brief requires (globally for series, per-series for modules, globally
 * for episodes — see repositories for the exact uniqueness query).
 */
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = toSlug(base);
  let candidate = baseSlug;
  let suffix = 2;

  while (await isTaken(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
