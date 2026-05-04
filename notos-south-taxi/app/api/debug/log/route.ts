/**
 * /api/debug/log
 *
 * POST — called automatically by [locale]/error.tsx when a Server
 *         Component throws. Stores the error in memory.
 *
 * GET  — returns all stored errors so you can read them in the browser.
 *         Protected by ?pass=<ADMIN_PASS>
 *
 * REMOVE THIS ROUTE once the bug is identified and fixed.
 */

import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  digest?: string;
  message?: string;
  name?: string;
  stack?: string;
  url?: string;
  ts?: string;
}

// In-memory store — persists for the lifetime of the serverless instance
declare global {
  // eslint-disable-next-line no-var
  var __debugLog: LogEntry[];
}
global.__debugLog = global.__debugLog ?? [];

export async function POST(req: NextRequest) {
  try {
    const entry: LogEntry = await req.json();
    global.__debugLog.unshift(entry);           // newest first
    if (global.__debugLog.length > 20) {
      global.__debugLog = global.__debugLog.slice(0, 20);
    }
    console.error('[debug/log] Error captured:', JSON.stringify(entry, null, 2));
  } catch {
    // ignore malformed body
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('pass') !== process.env.ADMIN_PASS) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    count: global.__debugLog.length,
    entries: global.__debugLog
  });
}
