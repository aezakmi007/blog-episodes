import type { Metadata, Viewport } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
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
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeRegistry>
          <div id="app-shell">{children}</div>
        </ThemeRegistry>
      </body>
    </html>
  );
}
