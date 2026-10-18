import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getDb } from '@/lib/db/mongodb';
import { COLLECTIONS } from '@/lib/db/collections';
import { uploadEpisodeAudio } from '@/repositories/audio.repository';

const CONTENT_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

/**
 * Uploads a locally-generated audio file into MongoDB (GridFS) and points
 * an episode's `audio.url` at it. This app has no TTS capability of its
 * own — generate the file yourself first (e.g. scripts/tts/generate_episode_audio.py
 * with Indic Parler-TTS, run on a machine with internet/GPU access), then
 * run this script to store the result and wire it into the episode:
 *
 *   npm run audio:attach -- machine-learning-mein-data-ki-aukaat ./episode1.mp3
 *
 * Safe to re-run: re-running with the same episode slug uploads a new
 * GridFS file and overwrites `audio.url`; it does not delete the previous
 * file automatically (pass --replace to also delete the old one).
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => a !== '--replace');
  const shouldReplace = process.argv.includes('--replace');
  const [episodeSlug, filePath] = args;

  if (!episodeSlug || !filePath) {
    console.error('Usage: npm run audio:attach -- <episode-slug> <path-to-audio-file> [--replace]');
    process.exit(1);
  }

  const buffer = await readFile(filePath);
  const filename = path.basename(filePath);
  const extension = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    console.error(`Unsupported audio extension "${extension}". Supported: ${Object.keys(CONTENT_TYPES).join(', ')}`);
    process.exit(1);
  }

  const db = await getDb();
  const existing = await db.collection(COLLECTIONS.EPISODES).findOne({ slug: episodeSlug });
  if (!existing) {
    console.error(`No episode found with slug "${episodeSlug}".`);
    process.exit(1);
  }

  const previousUrl: string | undefined = existing.audio?.url;

  const fileId = await uploadEpisodeAudio(buffer, filename, contentType, { episodeSlug });
  const url = `/api/audio/${fileId}`;

  await db
    .collection(COLLECTIONS.EPISODES)
    .updateOne({ slug: episodeSlug }, { $set: { 'audio.url': url }, $currentDate: { updatedAt: true } });

  if (shouldReplace && previousUrl?.startsWith('/api/audio/')) {
    const { deleteEpisodeAudio } = await import('@/repositories/audio.repository');
    const previousId = previousUrl.replace('/api/audio/', '');
    await deleteEpisodeAudio(previousId);
    console.warn(`Deleted previous audio file ${previousId}.`);
  }

  console.warn(`Uploaded "${filename}" (${(buffer.length / 1024 / 1024).toFixed(2)} MB) to MongoDB.`);
  console.warn(`Episode "${existing.title}" audio.url set to: ${url}`);
  console.warn('(Remember this URL is relative — it resolves against whatever host serves the app.)');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to attach episode audio:', error);
    process.exit(1);
  });
