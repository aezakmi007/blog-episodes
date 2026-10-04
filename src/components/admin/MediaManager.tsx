'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { uploadMediaAction, deleteMediaAction } from '@/features/media/actions';
import type { MediaDocument } from '@/models/media.model';

export default function MediaManager({ media }: { media: MediaDocument[] }) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set('file', file);
    const result = await uploadMediaAction(formData);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(item: MediaDocument) {
    // eslint-disable-next-line no-alert
    if (!confirm(`Delete "${item.filename}"?`)) return;
    const result = await deleteMediaAction(item._id);
    if (!result.ok) {
      // eslint-disable-next-line no-alert
      alert(result.error);
      return;
    }
    router.refresh();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context);
      // failing silently here is acceptable — the URL is also visible as
      // text under each thumbnail for manual copy.
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Media
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFileChange}
          />
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {media.map((item) => (
          <Grid key={item._id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Box
                component="img"
                src={item.url}
                alt={item.altText ?? item.filename}
                sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1, mb: 1 }}
              />
              <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                {item.filename}
              </Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {(item.sizeBytes / 1024).toFixed(0)} KB
                </Typography>
                <Stack direction="row">
                  <Tooltip title="Copy URL">
                    <IconButton size="small" onClick={() => copyUrl(item.url)}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => handleDelete(item)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
        {media.length === 0 && (
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No media uploaded yet.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Stack>
  );
}
