import type { MetadataRoute } from 'next';

/**
 * robots.txt. /admin and its auth routes are disallowed here as a
 * defense-in-depth measure — the actual access control is the server-side
 * session check in Phase 3, not this file. Search engines that ignore
 * robots.txt are still blocked from reaching admin content because every
 * admin page independently verifies the session server-side.
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
