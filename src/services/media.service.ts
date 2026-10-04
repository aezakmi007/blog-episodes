import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { createMedia, deleteMedia as deleteMediaRepo } from '@/repositories/media.repository';
import { logAdminAction } from './audit.service';
import { ok, fail, type ServiceResult } from '@/lib/utilities/result';
import type { MediaDocument } from '@/models/media.model';
import type { SafeAdmin } from '@/models/admin.model';

// SVG is deliberately excluded: an uploaded SVG can embed <script> and is
// served as a static file with no sanitization pass, so a browser that
// navigates to it directly (rather than rendering it as an <img>) would
// execute any embedded script in the site's origin. Raster formats only.
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Local-disk storage backend for the MVP: files are written under
 * `public/uploads/`, which Next.js serves statically. This is adequate
 * for local development and a single-instance VM deployment, but most
 * serverless hosts (including Vercel) have a read-only filesystem outside
 * `/tmp` — production deployment there requires swapping this function's
 * body for an object-store upload (S3, Cloudinary, etc.) and nothing
 * outside this file needs to change, because callers only ever see the
 * resulting `MediaDocument.url`. See docs/architecture.md and the
 * deployment guide (Phase 7).
 */
export async function uploadMedia(file: File, actor: SafeAdmin): Promise<ServiceResult<MediaDocument>> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return fail('Only PNG, JPEG, WEBP and GIF images are supported.');
  }
  if (file.size > MAX_SIZE_BYTES) {
    return fail('File is too large (max 5 MB).');
  }
  if (file.size === 0) {
    return fail('File is empty.');
  }

  const extension = path.extname(file.name) || inferExtension(file.type);
  const safeFilename = `${Date.now()}-${nanoid(8)}${extension}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, safeFilename), buffer);

  const media = await createMedia(
    {
      filename: file.name,
      url: `/uploads/${safeFilename}`,
      mimeType: file.type,
      sizeBytes: file.size,
    },
    actor._id,
  );

  await logAdminAction({
    action: 'media.upload',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'media',
    targetId: media._id,
    metadata: { filename: file.name, sizeBytes: file.size },
  });

  return ok(media);
}

export async function deleteMedia(id: string, actor: SafeAdmin): Promise<ServiceResult<true>> {
  const deleted = await deleteMediaRepo(id);
  if (!deleted) return fail('Media not found.');

  await logAdminAction({
    action: 'media.delete',
    actorId: actor._id,
    actorEmail: actor.email,
    targetType: 'media',
    targetId: id,
  });

  return ok(true);
}

function inferExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimeType] ?? '';
}
