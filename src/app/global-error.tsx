'use client';

/**
 * Last-resort error boundary. Next.js requires this file to render its own
 * <html>/<body> because it replaces the root layout when a rendering error
 * escapes every nested boundary. Kept deliberately framework-free (no MUI,
 * no theme) so it can never itself fail to render because of a theming or
 * data problem — this is the backstop, it has to always work.
 *
 * `error` is logged to the server console (Next.js does this automatically
 * for Server Component errors); we never render `error.message` or
 * `error.stack` to the visitor, since that could leak implementation
 * details.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#FFF8E7',
          color: '#172554',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#F97360' }}>
            Kuch gadbad ho gaya
          </p>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Is page ko load karne mein dikkat aayi.
          </h1>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Shyam aur Salim bhi kabhi-kabhi atak jaate hain. Ek baar phir try kariye.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 999,
              border: 'none',
              background: '#172554',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
