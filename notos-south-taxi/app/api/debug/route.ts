import { NextResponse } from 'next/server';

/**
 * GET /api/debug
 *
 * Returns a JSON report of:
 *  - Which env vars are set (values hidden, just present/missing)
 *  - Node version and runtime info
 *  - Whether key modules load without error
 *
 * REMOVE THIS ROUTE before going to production once the bug is fixed.
 * Protected by ADMIN_PASS so it's not publicly accessible.
 */

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SITE_URL',
  'DRIVER_WHATSAPP_NUMBER',
  'DRIVER_EMAIL',
  'VIVA_BASE_URL',
  'VIVA_ACCOUNTS_URL',
  'VIVA_CLIENT_ID',
  'VIVA_CLIENT_SECRET',
  'VIVA_SOURCE_CODE',
  'VIVA_MERCHANT_ID',
  'VIVA_API_KEY',
  'VIVA_WEBHOOK_VERIFICATION_KEY',
  'GOOGLE_MAPS_API_KEY',
  'GEOAPIFY_API_KEY',
  'ADMIN_USER',
  'ADMIN_PASS',
  'SENDZEN_API_KEY',
  'SENDZEN_FROM_PHONE_ID',
  'SENDZEN_TEMPLATE_NAME',
  'DATABASE_URL',
];

async function tryImport(modulePath: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await import(modulePath);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('pass') !== process.env.ADMIN_PASS) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1. Env var presence check
  const envReport: Record<string, 'set' | 'missing'> = {};
  for (const key of REQUIRED_ENV_VARS) {
    envReport[key] = process.env[key] ? 'set' : 'missing';
  }

  // 2. Try importing the modules most likely to crash on boot
  const moduleReport = {
    '@/lib/integrations/viva': await tryImport('@/lib/integrations/viva'),
    '@/lib/integrations/maps': await tryImport('@/lib/integrations/maps'),
    '@/lib/integrations/geoapify': await tryImport('@/lib/integrations/geoapify'),
    '@/lib/integrations/sendzen': await tryImport('@/lib/integrations/sendzen'),
    '@/lib/db': await tryImport('@/lib/db'),
    '@/lib/pricing': await tryImport('@/lib/pricing'),
    '@/lib/site-config': await tryImport('@/lib/site-config'),
  };

  // 3. Runtime info
  const runtime = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: `${Math.round(process.uptime())}s`,
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    nextVersion: process.env.NEXT_RUNTIME ?? 'unknown',
    vercelEnv: process.env.VERCEL_ENV ?? 'not-vercel',
    vercelRegion: process.env.VERCEL_REGION ?? 'unknown',
  };

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    runtime,
    env: envReport,
    modules: moduleReport,
  }, { status: 200 });
}
