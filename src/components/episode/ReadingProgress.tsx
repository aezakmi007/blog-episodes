'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import { saveReadingProgress, getReadingProgress } from '@/lib/utilities/reading-progress-client';

/**
 * Sticky top progress bar + resume-scroll. A single scroll listener
 * (rAF-throttled) drives both the visible bar and the persisted fraction
 * — no separate IntersectionObserver per section, so the cost is
 * constant regardless of episode length.
 *
 * Resuming is a one-time scroll on mount, gated behind
 * `prefers-reduced-motion` using `behavior: 'auto'` either way (an
 * instant jump, never a smooth-scroll animation, since this runs before
 * the reader has had a chance to orient on the page).
 */
export default function ReadingProgress({ episodeSlug }: { episodeSlug: string }) {
  const [fraction, setFraction] = React.useState(0);
  const tickingRef = React.useRef(false);
  const restoredRef = React.useRef(false);

  React.useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = getReadingProgress(episodeSlug);
    if (saved > 0.02) {
      const target = saved * (document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: target, behavior: 'auto' });
    }
  }, [episodeSlug]);

  React.useEffect(() => {
    function handleScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const current = scrollable > 0 ? window.scrollY / scrollable : 0;
        setFraction(current);
        saveReadingProgress(episodeSlug, current);
        tickingRef.current = false;
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [episodeSlug]);

  return (
    <Box
      aria-hidden="true"
      data-hide-on-print="true"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: 3,
        width: `${Math.round(fraction * 100)}%`,
        bgcolor: 'secondary.main',
        zIndex: (theme) => theme.zIndex.appBar + 1,
        transition: 'width 0.1s linear',
      }}
    />
  );
}
