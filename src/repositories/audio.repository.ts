import { GridFSBucket, ObjectId, type GridFSFile } from 'mongodb';
import { getDb } from '@/lib/db/mongodb';
import { AUDIO_BUCKET_NAME } from '@/lib/db/collections';

/**
 * Episode audio is stored directly in MongoDB via GridFS rather than on
 * local disk or an external object store. This keeps the deployment
 * story identical to the rest of the data (one MONGODB_URI, no second
 * storage credential to configure) and avoids the serverless-filesystem
 * problem that `media.service.ts` already documents for image uploads.
 * GridFS splits a file into chunks under two real collections —
 * `episodeAudio.files` and `episodeAudio.chunks` — so there is no 16MB
 * BSON document ceiling on a single upload the way there would be storing
 * the whole file as one Binary field.
 */
async function getBucket(): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: AUDIO_BUCKET_NAME });
}

export async function ensureAudioIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection(`${AUDIO_BUCKET_NAME}.files`).createIndex({ filename: 1, uploadDate: 1 });
  await db.collection(`${AUDIO_BUCKET_NAME}.chunks`).createIndex({ files_id: 1, n: 1 }, { unique: true });
}

/** Uploads a full audio file buffer and returns its GridFS file id (hex
 * string) — callers turn this into a playable URL via `/api/audio/[id]`. */
export async function uploadEpisodeAudio(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata: Record<string, unknown> = {},
): Promise<string> {
  const bucket = await getBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType, ...metadata },
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id.toHexString()));
    uploadStream.end(buffer);
  });
}

export async function findAudioFile(id: string): Promise<GridFSFile | null> {
  if (!ObjectId.isValid(id)) return null;
  const bucket = await getBucket();
  const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
  return files[0] ?? null;
}

/** Opens a (optionally byte-ranged) read stream for an audio file — used
 * by the streaming route handler to support `<audio>` seeking via HTTP
 * Range requests. */
export async function openEpisodeAudioStream(id: string, range?: { start: number; end: number }) {
  const bucket = await getBucket();
  const objectId = new ObjectId(id);
  return range ? bucket.openDownloadStream(objectId, range) : bucket.openDownloadStream(objectId);
}

export async function deleteEpisodeAudio(id: string): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  const bucket = await getBucket();
  await bucket.delete(new ObjectId(id));
}
