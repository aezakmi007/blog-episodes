import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import { NextResponse, type NextRequest } from 'next/server';
import { findAudioFile, openEpisodeAudioStream } from '@/repositories/audio.repository';

// GridFS streaming needs Node's fs/stream APIs — not available on the Edge
// runtime, and the response is a live download stream rather than
// prerenderable output, so this route is always dynamic.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Streams an episode's audio file straight out of MongoDB (GridFS) rather
 * than serving it from disk or an object store — see
 * repositories/audio.repository.ts for why. Supports HTTP Range requests
 * so `<audio>` seeking/scrubbing works instead of only playing from byte 0.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await findAudioFile(id);
  if (!file) return new NextResponse('Not found', { status: 404 });

  const contentType = (file.metadata?.contentType as string | undefined) ?? 'audio/mpeg';
  const totalLength = file.length;
  const rangeHeader = request.headers.get('range');

  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : totalLength - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= totalLength) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${totalLength}` },
      });
    }

    const nodeStream = await openEpisodeAudioStream(id, { start, end: end + 1 });
    const webStream = Readable.toWeb(nodeStream) as NodeWebReadableStream<Uint8Array>;

    return new NextResponse(webStream as unknown as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${totalLength}`,
        'Content-Length': String(end - start + 1),
      },
    });
  }

  const nodeStream = await openEpisodeAudioStream(id);
  const webStream = Readable.toWeb(nodeStream) as NodeWebReadableStream<Uint8Array>;

  return new NextResponse(webStream as unknown as ReadableStream, {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(totalLength) },
  });
}
