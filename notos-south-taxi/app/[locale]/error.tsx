'use client';

/**
 * [locale]/error.tsx
 *
 * Catches errors thrown inside Server Components in the [locale] subtree
 * (layout, pages, etc.) and sends the full details to /api/debug/log
 * so you can see them even in a production Vercel build.
 *
 * REMOVE THIS FILE once the bug is identified and fixed.
 */

import { useEffect } from 'react';

export default function LocaleError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // POST the real error details to our logging endpoint
    fetch('/api/debug/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        digest: error.digest,
        message: error.message,
        name: error.name,
        stack: error.stack,
        url: window.location.href,
        ts: new Date().toISOString()
      })
    }).catch(() => {});
  }, [error]);

  return (
    <div style={{
      fontFamily: 'monospace',
      padding: '2rem',
      background: '#1a1a1a',
      color: '#f1f1f1',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ff4444', fontSize: '1.1rem' }}>
        🔴 Server Component error (debug mode)
      </h1>

      <table style={{ borderCollapse: 'collapse', marginTop: '1rem', width: '100%' }}>
        <tbody>
          <tr>
            <td style={label}>Digest</td>
            <td style={value}>{error.digest ?? 'none'}</td>
          </tr>
          <tr>
            <td style={label}>Message</td>
            <td style={value}>{error.message || '(hidden in prod — check /api/debug/log)'}</td>
          </tr>
          <tr>
            <td style={label}>Name</td>
            <td style={value}>{error.name}</td>
          </tr>
          <tr>
            <td style={label}>URL</td>
            <td style={value}>{typeof window !== 'undefined' ? window.location.href : ''}</td>
          </tr>
        </tbody>
      </table>

      {error.stack && (
        <>
          <h2 style={{ color: '#ffaa00', fontSize: '0.95rem', marginTop: '1.5rem' }}>Stack</h2>
          <pre style={{
            background: '#111',
            padding: '1rem',
            borderRadius: '6px',
            overflowX: 'auto',
            fontSize: '0.75rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {error.stack}
          </pre>
        </>
      )}

      <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '1.5rem' }}>
        Full error has been sent to{' '}
        <a href={`/api/debug/log?pass=${encodeURIComponent('change-me')}`}
           style={{ color: '#7af' }}>
          /api/debug/log
        </a>
        {' '}— check there for the real server-side message.
      </p>

      <button
        onClick={reset}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1.2rem',
          background: '#333',
          color: '#fff',
          border: '1px solid #555',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}

const label: React.CSSProperties = {
  color: '#aaa',
  padding: '0.3rem 1rem 0.3rem 0',
  verticalAlign: 'top',
  whiteSpace: 'nowrap'
};

const value: React.CSSProperties = {
  color: '#fff',
  padding: '0.3rem 0',
  wordBreak: 'break-all'
};
