'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Paper from '@mui/material/Paper';
import { updateSiteSettingsAction } from '@/features/settings/actions';
import type { SiteSettingsDocument } from '@/models/site-settings.model';

export default function SettingsForm({ settings }: { settings: SiteSettingsDocument }) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      siteName: settings.siteName,
      tagline: settings.tagline,
      maintenanceMode: settings.maintenanceMode,
      newsletterEnabled: settings.newsletterEnabled,
    },
  });

  async function onSubmit(values: {
    siteName: string;
    tagline: string;
    maintenanceMode: boolean;
    newsletterEnabled: boolean;
  }) {
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    const result = await updateSiteSettingsAction(values);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <Paper
      variant="outlined"
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ p: 3, maxWidth: 560 }}
    >
      <Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">Settings saved.</Alert>}

        <TextField label="Site name" fullWidth {...register('siteName', { required: true })} />
        <TextField label="Tagline" fullWidth {...register('tagline', { required: true })} />

        <Controller
          name="maintenanceMode"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
              label="Maintenance mode"
            />
          )}
        />
        <Controller
          name="newsletterEnabled"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
              label="Show newsletter signup placeholder"
            />
          )}
        />

        <Button type="submit" variant="contained" disabled={submitting} sx={{ alignSelf: 'flex-start' }}>
          {submitting ? 'Saving…' : 'Save settings'}
        </Button>
      </Stack>
    </Paper>
  );
}
