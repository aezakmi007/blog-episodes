'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { createModuleAction, updateModuleAction, deleteModuleAction } from '@/features/modules/actions';
import { toSlug } from '@/lib/utilities/slug';
import type { ModuleDocument } from '@/models/module.model';
import type { SeriesDocument } from '@/models/series.model';

interface ModuleFormValues {
  seriesId: string;
  title: string;
  slug: string;
  description: string;
  moduleNumber: number;
  displayOrder: number;
  status: ModuleDocument['status'];
}

export default function ModulesManager({
  modules,
  series,
}: {
  modules: ModuleDocument[];
  series: SeriesDocument[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ModuleDocument | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [slugEdited, setSlugEdited] = React.useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<ModuleFormValues>({
    defaultValues: {
      seriesId: series[0]?._id ?? '',
      title: '',
      slug: '',
      description: '',
      moduleNumber: 1,
      displayOrder: 0,
      status: 'draft',
    },
  });
  const title = watch('title');

  React.useEffect(() => {
    if (!slugEdited) setValue('slug', toSlug(title || ''));
  }, [title, slugEdited, setValue]);

  function seriesTitleFor(seriesId: string): string {
    return series.find((s) => s._id === seriesId)?.title ?? 'Unknown series';
  }

  function openCreate() {
    setEditing(null);
    setSlugEdited(false);
    setError(null);
    reset({
      seriesId: series[0]?._id ?? '',
      title: '',
      slug: '',
      description: '',
      moduleNumber: modules.length + 1,
      displayOrder: modules.length,
      status: 'draft',
    });
    setDialogOpen(true);
  }

  function openEdit(item: ModuleDocument) {
    setEditing(item);
    setSlugEdited(true);
    setError(null);
    reset({
      seriesId: item.seriesId,
      title: item.title,
      slug: item.slug,
      description: item.description,
      moduleNumber: item.moduleNumber,
      displayOrder: item.displayOrder,
      status: item.status,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: ModuleFormValues) {
    setSubmitting(true);
    setError(null);
    const result = editing
      ? await updateModuleAction(editing._id, values)
      : await createModuleAction(values);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function onDelete(item: ModuleDocument) {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete "${item.title}"? This only works if it has no episodes.`)) return;
    const result = await deleteModuleAction(item._id);
    if (!result.ok) {
      // eslint-disable-next-line no-alert
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Modules
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} disabled={series.length === 0}>
          New module
        </Button>
      </Stack>

      {series.length === 0 && <Alert severity="info">Create a series first before adding modules.</Alert>}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Series</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {modules.map((item) => (
            <TableRow key={item._id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Module {item.moduleNumber}: {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  /{item.slug}
                </Typography>
              </TableCell>
              <TableCell>{seriesTitleFor(item.seriesId)}</TableCell>
              <TableCell>
                <Chip label={item.status} size="small" color={item.status === 'published' ? 'success' : 'default'} />
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(item)} aria-label={`Delete ${item.title}`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {modules.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No modules yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit module' : 'New module'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField select label="Series" fullWidth required {...register('seriesId', { required: true })}>
                {series.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.title}
                  </MenuItem>
                ))}
              </TextField>
              <TextField label="Title" fullWidth required {...register('title', { required: true })} />
              <TextField
                label="Slug"
                fullWidth
                required
                {...register('slug', { required: true, onChange: () => setSlugEdited(true) })}
              />
              <TextField
                label="Description"
                fullWidth
                required
                multiline
                minRows={3}
                {...register('description', { required: true })}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  type="number"
                  label="Module number"
                  fullWidth
                  {...register('moduleNumber', { valueAsNumber: true, min: 1 })}
                />
                <TextField
                  type="number"
                  label="Display order"
                  fullWidth
                  {...register('displayOrder', { valueAsNumber: true })}
                />
              </Stack>
              <TextField select label="Status" fullWidth {...register('status')}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
