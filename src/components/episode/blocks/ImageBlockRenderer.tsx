import Image from 'next/image';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ContentBlock } from '@/models/content-block.model';

type ImageBlockData = Extract<ContentBlock, { type: 'image' }>;

export default function ImageBlockRenderer({ block }: { block: ImageBlockData }) {
  if (!block.image.src) return null;

  return (
    <Box component="figure" sx={{ my: 3, mx: 0 }}>
      <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <Image
          src={block.image.src}
          alt={block.decorative ? '' : block.image.alt}
          aria-hidden={block.decorative || undefined}
          width={block.image.width ?? 1200}
          height={block.image.height ?? 675}
          sizes="(max-width: 768px) 100vw, 768px"
          style={{ width: '100%', height: 'auto' }}
        />
      </Box>
      {block.caption && (
        <Typography component="figcaption" variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {block.caption}
          {block.credit && ` — ${block.credit}`}
        </Typography>
      )}
    </Box>
  );
}
