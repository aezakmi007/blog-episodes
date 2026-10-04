'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BlockEditor from './block-editor/BlockEditor';
import { createDefaultBlock } from './block-editor/blockDefaults';
import { toSlug } from '@/lib/utilities/slug';
import type { ContentBlock } from '@/models/content-block.model';
import type { EpisodeDocument } from '@/models/episode.model';
import { createEpisodeAction, updateEpisodeAction } from '@/features/episodes/actions';

export interface SeriesOption {
  id: string;
  title: string;
}
export interface ModuleOption {
  id: string;
  seriesId: string;
  title: string;
}

interface FormValues {
  seriesId: string;
  moduleId: string;
  title: string;
  slug: string;
  subtitle: string;
  episodeNumber: number;
  teacherCharacter: 'shyam' | 'salim';
  excerpt: string;
  heroImage: string;
  location: string;
  sessionDate: string;
  tagsText: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
}

function toDateInputValue(date?: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
}

export default function EpisodeForm({
  mode,
  episode,
  seriesOptions,
  moduleOptions,
}: {
  mode: 'create' | 'edit';
  episode?: EpisodeDocument;
  seriesOptions: SeriesOption[];
  moduleOptions: ModuleOption[];
}) {
  const router = useRouter();
  const [contentBlocks, setContentBlocks] = React.useState<ContentBlock[]>(
    episode?.contentBlocks ?? [createDefaultBlock('scene', 0)],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [slugEdited, setSlugEdited] = React.useState(mode === 'edit');

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      seriesId: episode?.seriesId ?? seriesOptions[0]?.id ?? '',
      moduleId: episode?.moduleId ?? '',
      title: episode?.title ?? '',
      slug: episode?.slug ?? '',
      subtitle: episode?.subtitle ?? '',
      episodeNumber: episode?.episodeNumber ?? 1,
      teacherCharacter: episode?.teacherCharacter ?? 'shyam',
      excerpt: episode?.excerpt ?? '',
      heroImage: episode?.heroImage ?? '',
      location: episode?.location ?? "Salim's balcony",
      sessionDate: toDateInputValue(episode?.sessionDate) || toDateInputValue(new Date()),
      tagsText: episode?.tags?.join(', ') ?? '',
      status: episode?.status ?? 'draft',
      scheduledAt: toDateInputValue(episode?.scheduledAt),
      featured: episode?.featured ?? false,
      metaTitle: episode?.seo?.metaTitle ?? '',
      metaDescription: episode?.seo?.metaDescription ?? '',
    },
  });

  const title = watch('title');
  const seriesId = watch('seriesId');
  const status = watch('status');
  const filteredModules = moduleOptions.filter((m) => m.seriesId === seriesId);

  React.useEffect(() => {
    if (!slugEdited) setValue('slug', toSlug(title || ''));
  }, [title, slugEdited, setValue]);

  const moduleId = watch('moduleId');
  React.useEffect(() => {
    if (moduleId && !filteredModules.some((m) => m.id === moduleId)) {
      setValue('moduleId', filteredModules[0]?.id ?? '');
    }
    // Only re-run when the series (and therefore the available module
    // options) changes — not on every moduleId change, which would fight
    // the user's own selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const studentCharacter = values.teacherCharacter === 'shyam' ? 'salim' : 'shyam';
    const payload = {
      seriesId: values.seriesId,
      moduleId: values.moduleId,
      title: values.title,
      slug: values.slug,
      subtitle: values.subtitle || undefined,
      episodeNumber: Number(values.episodeNumber),
      teacherCharacter: values.teacherCharacter,
      studentCharacter,
      excerpt: values.excerpt,
      heroImage: values.heroImage || undefined,
      location: values.location,
      sessionDate: values.sessionDate,
      contentBlocks,
      tags: values.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: values.status,
      scheduledAt: values.status === 'scheduled' ? values.scheduledAt : undefined,
      featured: values.featured,
      seo: {
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        noIndex: false,
      },
    };

    const result =
      mode === 'create'
        ? await createEpisodeAction(payload)
        : await updateEpisodeAction(episode!._id, payload);

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    router.push(`/admin/episodes/${result.data._id}/edit`);
    router.refresh();
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {formError && (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        )}
        {Object.keys(fieldErrors).length > 0 && (
          <Alert severity="warning" role="alert">
            <Stack spacing={0.5}>
              {Object.entries(fieldErrors).map(([field, message]) => (
                <Typography variant="body2" key={field}>
                  <strong>{field}</strong>: {message}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontFamily: 'var(--font-display)' }}>
            Episode details
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="seriesId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} select label="Series" fullWidth required error={!!errors.seriesId}>
                    {seriesOptions.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.title}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="moduleId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField {...field} select label="Module" fullWidth required error={!!errors.moduleId}>
                    {filteredModules.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.title}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label="Title"
                fullWidth
                required
                {...register('title', { required: true })}
                error={!!errors.title}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Slug"
                fullWidth
                required
                helperText="Stable, unique URL segment — editing it changes the published URL."
                {...register('slug', { required: true, onChange: () => setSlugEdited(true) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="number"
                label="Episode #"
                fullWidth
                required
                {...register('episodeNumber', { required: true, valueAsNumber: true, min: 1 })}
              />
            </Grid>

            <Grid size={12}>
              <TextField label="Subtitle (optional)" fullWidth {...register('subtitle')} />
            </Grid>

            <Grid size={12}>
              <TextField
                label="Excerpt"
                fullWidth
                required
                multiline
                minRows={2}
                helperText="Shown on listing cards and used as the default meta description."
                {...register('excerpt', { required: true })}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Location" fullWidth required {...register('location', { required: true })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="datetime-local"
                label="Session date"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                {...register('sessionDate', { required: true })}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Who is teaching this episode?
              </Typography>
              <Controller
                name="teacherCharacter"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    exclusive
                    value={field.value}
                    onChange={(_e, next) => next && field.onChange(next)}
                    aria-label="Teacher"
                  >
                    <ToggleButton value="shyam">Shyam teaches</ToggleButton>
                    <ToggleButton value="salim">Salim teaches</ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Hero image URL (optional)" fullWidth {...register('heroImage')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Tags (comma-separated)" fullWidth {...register('tagsText')} />
            </Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontFamily: 'var(--font-display)' }}>
            Content blocks
          </Typography>
          <BlockEditor blocks={contentBlocks} onChange={setContentBlocks} />
        </Paper>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">SEO</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField label="Meta title (optional)" fullWidth {...register('metaTitle')} />
              <TextField
                label="Meta description (optional)"
                fullWidth
                multiline
                minRows={2}
                {...register('metaDescription')}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontFamily: 'var(--font-display)' }}>
            Publishing
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Status" fullWidth>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            {status === 'scheduled' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="datetime-local"
                  label="Scheduled for"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...register('scheduledAt', { required: status === 'scheduled' })}
                />
              </Grid>
            )}
            <Grid size={12}>
              <Controller
                name="featured"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Feature on homepage"
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>

        <Divider />

        <Stack direction="row" spacing={2}>
          <Button type="submit" variant="contained" size="large" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create episode' : 'Save changes'}
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.push('/admin/episodes')} type="button">
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
