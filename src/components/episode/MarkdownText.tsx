import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import Box from '@mui/material/Box';

/**
 * The ONLY way free-text content-block fields reach the DOM. Markdown is
 * parsed to a syntax tree and sanitized against an explicit allow-list
 * (`rehype-sanitize`'s default schema, slightly extended) before being
 * rendered — there is no `dangerouslySetInnerHTML` anywhere in this
 * codebase. A Server Component (react-markdown renders fine on the
 * server), so this adds no client JavaScript.
 */
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'del'],
};

export default function MarkdownText({ children, className }: { children: string; className?: string }) {
  return (
    <Box
      className={className}
      sx={{
        '& p': { m: 0, mb: 1.5, '&:last-child': { mb: 0 } },
        '& a': { color: 'secondary.main' },
        '& code': {
          fontFamily: 'monospace',
          bgcolor: 'action.hover',
          px: 0.5,
          borderRadius: 0.5,
          fontSize: '0.9em',
        },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {children}
      </ReactMarkdown>
    </Box>
  );
}
