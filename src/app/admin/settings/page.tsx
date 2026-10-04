import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { requireAdminSession } from '@/lib/auth/guards';
import { getSiteSettings } from '@/repositories/site-settings.repository';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  await requireAdminSession('/admin/settings');
  const settings = await getSiteSettings();

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
        Settings
      </Typography>
      <SettingsForm settings={settings} />
    </Stack>
  );
}
