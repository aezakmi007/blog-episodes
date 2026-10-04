import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from '@/lib/security/safe-redirect';
import { computeLockoutDuration } from '@/lib/auth/rate-limit';

describe('getSafeRedirectPath', () => {
  it('allows a plain relative admin path', () => {
    expect(getSafeRedirectPath('/admin/episodes')).toBe('/admin/episodes');
  });

  it('falls back for an absolute URL to another host', () => {
    expect(getSafeRedirectPath('https://evil.example.com/phish')).toBe('/admin');
  });

  it('falls back for a protocol-relative URL', () => {
    expect(getSafeRedirectPath('//evil.example.com')).toBe('/admin');
  });

  it('falls back for a path missing the leading slash', () => {
    expect(getSafeRedirectPath('admin/episodes')).toBe('/admin');
  });

  it('falls back for null/undefined/empty input', () => {
    expect(getSafeRedirectPath(null)).toBe('/admin');
    expect(getSafeRedirectPath(undefined)).toBe('/admin');
    expect(getSafeRedirectPath('')).toBe('/admin');
  });

  it('respects a custom fallback', () => {
    expect(getSafeRedirectPath('http://evil.com', '/admin/episodes')).toBe('/admin/episodes');
  });
});

describe('computeLockoutDuration', () => {
  it('does not lock below the threshold', () => {
    expect(computeLockoutDuration(1)).toBeNull();
    expect(computeLockoutDuration(4)).toBeNull();
  });

  it('locks with increasing duration once the threshold is crossed', () => {
    const at5 = computeLockoutDuration(5);
    const at6 = computeLockoutDuration(6);
    const at7 = computeLockoutDuration(7);
    expect(at5).not.toBeNull();
    expect(at6).toBeGreaterThan(at5 as number);
    expect(at7).toBeGreaterThan(at6 as number);
  });

  it('caps the lockout duration at the configured maximum', () => {
    const extreme = computeLockoutDuration(100);
    expect(extreme).toBe(30 * 60_000);
  });
});
