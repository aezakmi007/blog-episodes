import { NextResponse } from 'next/server';
import { pingDatabase } from '@/lib/db/mongodb';

/**
 * Minimal liveness/readiness endpoint. Intentionally returns the least
 * amount of detail possible — no connection string, no driver error
 * message, no stack trace — so it is safe to leave reachable in
 * production for uptime monitoring.
 */
export async function GET() {
  const db = await pingDatabase();

  return NextResponse.json(
    {
      status: db.ok ? 'ok' : 'degraded',
      database: db.ok ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    },
    { status: db.ok ? 200 : 503 },
  );
}
