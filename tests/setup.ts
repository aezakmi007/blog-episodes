import '@testing-library/jest-dom/vitest';

// Vitest + jsdom does not implement matchMedia; MUI's useMediaQuery (used by
// Header.tsx) needs it. Polyfilled once, globally, for every test file.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
