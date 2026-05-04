'use client';

/**
 * global-error.tsx — catches server-side exceptions that bubble up to
 * the root layout and displays the real error message instead of the
 * generic Vercel "Application error / Digest: XXXXXXXXX" screen.
 *
 * REMOVE THIS FILE before going to production once the bug is fixed.
 */

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'monospace', padding: '2rem', background: '#1a1a1a', color: '#f1f1f1' }}>
        <h1 style={{ color: '#ff4444', fontSize: '1.2rem' }}>
          🔴 Server-side error (debug mode — remove before prod)
        </h1>

        <table style={{ borderCollapse: 'collapse', marginTop: '1rem', width: '100%' }}>
          <tbody>
            <tr>
              <td style={labelStyle}>Digest</td>
              <td style={valueStyle}>{error.digest ?? 'none'}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Message</td>
              <td style={valueStyle}>{error.message || '(empty)'}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Name</td>
              <td style={valueStyle}>{error.name}</td>
            </tr>
          </tbody>
        </table>

        {error.stack && (
          <>
            <h2 style={{ color: '#ffaa00', fontSize: '1rem', marginTop: '1.5rem' }}>Stack trace</h2>
            <pre style={{
              background: '#111',
              padding: '1rem',
              borderRadius: '6px',
              overflowX: 'auto',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {error.stack}
            </pre>
          </>
        )}

        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            padding: '0.5rem 1.2rem',
            background: '#333',
            color: '#fff',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

const labelStyle: React.CSSProperties = {
  color: '#aaa',
  padding: '0.3rem 1rem 0.3rem 0',
  verticalAlign: 'top',
  whiteSpace: 'nowrap'
};

const valueStyle: React.CSSProperties = {
  color: '#fff',
  padding: '0.3rem 0',
  wordBreak: 'break-all'
};
