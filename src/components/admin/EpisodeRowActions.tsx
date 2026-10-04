'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/UnpublishedOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  publishEpisodeAction,
  unpublishEpisodeAction,
  duplicateEpisodeAction,
  deleteEpisodeAction,
} from '@/features/episodes/actions';
import type { EpisodeDocument } from '@/models/episode.model';

export default function EpisodeRowActions({ episode }: { episode: Pick<EpisodeDocument, '_id' | 'status' | 'title'> }) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function run(action: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setPending(action);
    const result = await fn();
    setPending(null);
    if (!result.ok) {
      // eslint-disable-next-line no-alert
      alert(result.error ?? 'Something went wrong.');
      return;
    }
    router.refresh();
  }

  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Edit">
        <IconButton size="small" component={Link} href={`/admin/episodes/${episode._id}/edit`}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {episode.status !== 'published' ? (
        <Tooltip title="Publish">
          <IconButton
            size="small"
            disabled={pending !== null}
            onClick={() => run('publish', () => publishEpisodeAction(episode._id))}
          >
            {pending === 'publish' ? <CircularProgress size={16} /> : <PublishIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Unpublish">
          <IconButton
            size="small"
            disabled={pending !== null}
            onClick={() => run('unpublish', () => unpublishEpisodeAction(episode._id))}
          >
            {pending === 'unpublish' ? <CircularProgress size={16} /> : <UnpublishedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Duplicate">
        <IconButton
          size="small"
          disabled={pending !== null}
          onClick={() => run('duplicate', () => duplicateEpisodeAction(episode._id))}
        >
          {pending === 'duplicate' ? <CircularProgress size={16} /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton
          size="small"
          disabled={pending !== null}
          onClick={() => {
            // eslint-disable-next-line no-alert
            if (!confirm(`Delete "${episode.title}"? This cannot be undone.`)) return;
            run('delete', () => deleteEpisodeAction(episode._id));
          }}
        >
          {pending === 'delete' ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
