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
import { createSeriesAction, updateSeriesAction, deleteSeriesAction } from '@/features/series/actions';
import { toSlug } from '@/lib/utilities/slug';
import type { SeriesDocument } from '@/models/series.model';

interface SeriesFormValues {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: SeriesDocument['status'];
  displayOrder: number;
}

export default function SeriesManager({ series }: { series: SeriesDocument[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SeriesDocument | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<SeriesFormValues>({
    defaultValues: { title: '', slug: '', shortDescription: '', description: '', status: 'draft', displayOrder: 0 },
  });
  const title = watch('title');
  const [slugEdited, setSlugEdited] = React.useState(false);

  React.useEffect(() => {
    if (!slugEdited) setValue('slug', toSlug(title || ''));
  }, [title, slugEdited, setValue]);

  function openCreate() {
    setEditing(null);
    setSlugEdited(false);
    setError(null);
    reset({ title: '', slug: '', shortDescription: '', description: '', status: 'draft', displayOrder: series.length });
    setDialogOpen(true);
  }

  function openEdit(item: SeriesDocument) {
    setEditing(item);
    setSlugEdited(true);
    setError(null);
    reset({
      title: item.title,
      slug: item.slug,
      shortDescription: item.shortDescription,
      description: item.description,
      status: item.status,
      displayOrder: item.displayOrder,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: SeriesFormValues) {
    setSubmitting(true);
    setError(null);
    const result = editing
      ? await updateSeriesAction(editing._id, values)
      : await createSeriesAction(values);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDialogOpen(false);
    router.refresh();
  }

  async function onDelete(item: SeriesDocument) {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete "${item.title}"? This only works if it has no modules.`)) return;
    const result = await deleteSeriesAction(item._id);
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
          Series
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New series
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Modules</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {series.map((item) => (
            <TableRow key={item._id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  /{item.slug}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={item.status} size="small" color={item.status === 'published' ? 'success' : 'default'} />
              </TableCell>
              <TableCell>{item.totalModules}</TableCell>
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
          {series.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No series yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit series' : 'New series'}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Title" fullWidth required {...register('title', { required: true })} />
              <TextField
                label="Slug"
                fullWidth
                required
                {...register('slug', { required: true, onChange: () => setSlugEdited(true) })}
              />
              <TextField
                label="Short description"
                fullWidth
                required
                helperText="Shown on series cards (max ~280 characters)"
                {...register('shortDescription', { required: true })}
              />
              <TextField
                label="Full description"
                fullWidth
                required
                multiline
                minRows={3}
                {...register('description', { required: true })}
              />
              <TextField select label="Status" fullWidth {...register('status')}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
              <TextField
                type="number"
                label="Display order"
                fullWidth
                {...register('displayOrder', { valueAsNumber: true })}
              />
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
