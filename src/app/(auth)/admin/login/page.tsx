import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoginForm from '@/components/admin/LoginForm';
import { getAdminSessionOrNull } from '@/lib/auth/guards';
import { getSafeRedirectPath } from '@/lib/security/safe-redirect';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Already-authenticated visitors shouldn't see the login form again —
  // this is a UX nicety; the real admin-page protection is each page's
  // own requireAdminSession() call, not this redirect.
  const existingSession = await getAdminSessionOrNull();
  const { next } = await searchParams;
  const safeNext = getSafeRedirectPath(next, '/admin');

  if (existingSession) {
    redirect(safeNext);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, sm: 5 },
        width: '100%',
        maxWidth: 440,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={3} alignItems="flex-start">
        <Stack spacing={0.5}>
          <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700 }}>
            Shyam &amp; Salim Learn ML
          </Typography>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Admin sign in
          </Typography>
        </Stack>

        <LoginForm next={safeNext !== '/admin' ? safeNext : undefined} />
      </Stack>
    </Paper>
  );
}
