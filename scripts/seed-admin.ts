import 'dotenv/config';
import { createAdminInputSchema } from '@/models/admin.model';
import { hashPassword } from '@/lib/auth/password';
import { findAdminByEmailWithPasswordHash, createAdmin } from '@/repositories/admins.repository';
import { ensureAdminIndexes } from '@/repositories/admins.repository';

/**
 * One-time bootstrap for the very first admin account. Reads
 * ADMIN_EMAIL / ADMIN_PASSWORD from the environment — never from CLI
 * arguments, which would leak the password into shell history and
 * process listings.
 *
 * Safe to run more than once: if an admin with ADMIN_EMAIL already
 * exists, this exits without making any change (it never overwrites an
 * existing password or re-creates the account). The password is never
 * logged, printed, or included in any error message.
 */
async function bootstrapAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set (in your environment or .env.local) to run this script.',
    );
    process.exit(1);
  }

  const parsed = createAdminInputSchema.safeParse({ email, password, role: 'owner' });
  if (!parsed.success) {
    console.error('Bootstrap admin input is invalid:');
    for (const issue of parsed.error.issues) {
      // Only the field name and message — never the value, which for
      // `password` would mean printing the secret.
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  await ensureAdminIndexes();

  const existing = await findAdminByEmailWithPasswordHash(parsed.data.email);
  if (existing) {
    console.warn(`An admin with email ${parsed.data.email} already exists. No changes made.`);
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  await createAdmin({
    email: parsed.data.email,
    passwordHash,
    role: parsed.data.role,
    isActive: true,
    sessionVersion: 1,
    failedLoginAttempts: 0,
    passwordChangedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  console.warn(`Admin account created for ${parsed.data.email}. You can now sign in at /admin/login.`);
}

bootstrapAdmin()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to bootstrap admin account:', error);
    process.exit(1);
  });
