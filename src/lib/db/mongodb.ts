import { MongoClient, type Db, type MongoClientOptions } from 'mongodb';
import { env } from '@/lib/env';

/**
 * Singleton MongoDB connection for the whole app.
 *
 * Next.js dev mode hot-reloads server modules on every file save, which
 * would otherwise open a fresh MongoClient (and a fresh connection pool) on
 * every reload. We cache the client/connect-promise on `globalThis` in
 * development to survive module reloads. In production, each serverless
 * invocation gets a cold module scope, so the module-level variable alone
 * is sufficient — `globalThis` caching there would just mask lifecycle
 * assumptions, so we scope it to non-production explicitly.
 */

const options: MongoClientOptions = {
  maxPoolSize: 10,
  // Fail fast rather than hanging a request indefinitely if Mongo is down.
  serverSelectionTimeoutMS: 8_000,
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(env.MONGODB_URI, options);
  return client.connect();
}

let clientPromise: Promise<MongoClient>;

if (env.NODE_ENV === 'production') {
  clientPromise = createClientPromise();
} else {
  if (!global.__mongoClientPromise) {
    global.__mongoClientPromise = createClientPromise();
  }
  clientPromise = global.__mongoClientPromise;
}

/**
 * Returns the shared MongoClient, connected and ready. Safe to call from
 * any server-only module (route handlers, server actions, repositories).
 * Never import this from a Client Component.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Returns the application database. The database name is taken from the
 * path segment of MONGODB_URI, so no separate DB_NAME variable is needed.
 */
export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db();
}

/**
 * Lightweight connectivity check used by health endpoints and startup
 * diagnostics. Never throws raw driver errors to callers outside this
 * module — callers decide how much detail (if any) to surface.
 */
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch {
    return { ok: false, latencyMs: Math.round(performance.now() - start) };
  }
}
