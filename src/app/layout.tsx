import type { Metadata, Viewport } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import ThemeRegistry from '@/theme/ThemeRegistry';
import './globals.css';

/**
 * Display font — distinctive, storybook-like, used for headings and the
 * hero. Fraunces has warm, humanist serif detailing that suits the
 * "Sunday morning chai" editorial mood without tipping into novelty.
 */
const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
});

/**
 * Body font — highly legible at long-form reading sizes, tall x-height,
 * calm letterforms. Used for everything except headings.
 */
const bodyFont = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Shyam & Salim Learn ML',
    template: '%s · Shyam & Salim Learn ML',
  },
  description:
    'Do dost. Ek chai. Aur Machine Learning. Har Sunday, Shyam aur Salim milte hain — kabhi Machine Learning samajhte hain, kabhi bachpan ke kisse nikal aate hain.',
  applicationName: 'Shyam & Salim Learn ML',
  authors: [{ name: 'Shyam & Salim Learn ML' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF8E7' },
    { media: '(prefers-color-scheme: dark)', color: '#07111F' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`} suppressHydrationWarning>
      <body>
        <div className="corner-mark" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="18" fill="#172554" />
            <path
              d="M11 14.5c0-1.38 1.12-2.5 2.5-2.5h7c1.38 0 2.5 1.12 2.5 2.5v3.75c0 1.38-1.12 2.5-2.5 2.5h-5.1l-2.9 2.4v-2.4h-1c-1.38 0-2.5-1.12-2.5-2.5V14.5Z"
              fill="#F59E0B"
            />
            <path
              d="M25 17.25c0-.97-.78-1.75-1.75-1.75h-.5v3.35c0 1.93-1.57 3.5-3.5 3.5h-2.78c.32.72 1.04 1.25 1.9 1.25h3.57l2.06 1.7v-1.7h.5c.97 0 1.75-.78 1.75-1.75v-4.6Z"
              fill="#5EEAD4"
            />
          </svg>
        </div>
        <ThemeRegistry>
          <div id="app-shell">{children}</div>
        </ThemeRegistry>
        <Analytics />
      </body>
    </html>
  );
}
