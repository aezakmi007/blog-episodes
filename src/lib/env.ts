import { z } from 'zod';

/**
 * Centralized, fail-fast environment validation.
 *
 * This module is imported by server-only code paths (db connection, auth,
 * seed scripts). Importing it anywhere throws immediately and loudly if a
 * required variable is missing or malformed, rather than allowing the app
 * to boot into an insecure or broken state.
 *
 * IMPORTANT: Never import this from a Client Component. Secrets must not
 * reach the browser bundle. Nothing here is prefixed with NEXT_PUBLIC_ on
 * purpose — this app has no client-exposed secrets.
 */

const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    ),
  APP_URL: z
    .string()
    .min(1, 'APP_URL is required')
    .url('APP_URL must be a valid absolute URL')
    .refine((value) => !value.endsWith('/'), 'APP_URL must not end with a trailing slash'),
  AUTH_SECRET: z
    .string()
    .min(32, 'AUTH_SECRET must be at least 32 characters long — generate with `openssl rand -base64 48`'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email address').optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');

    // Intentionally thrown (not logged-and-continued) so misconfiguration
    // can never silently degrade into an insecure default.
    throw new Error(
      `Invalid environment configuration. Fix the following and restart:\n${issues}\n\n` +
        'See .env.example for the full list of required variables.',
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env = loadEnv();
