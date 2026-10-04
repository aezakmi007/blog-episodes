import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { searchSite } from '@/services/search.service';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim() ?? '';
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, totalCount } = query ? await searchSite(query, page) : { items: [], totalCount: 0 };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 3 }}>
        Search
      </Typography>

      <Box component="form" action="/search" method="GET" sx={{ display: 'flex', gap: 1.5, mb: 4 }}>
        <TextField
          name="q"
          defaultValue={query}
          placeholder="Search episodes, series, topics…"
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained">
          Search
        </Button>
      </Box>

      {query && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {totalCount} result{totalCount === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
        </Typography>
      )}

      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={`${item.kind}-${item.href}`} variant="outlined">
            <CardActionArea component={Link} href={item.href}>
              <CardContent>
                <Chip label={item.kind} size="small" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}

        {query && items.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No results for &ldquo;{query}&rdquo;. Try a different term, or browse{' '}
            <Link href="/series">all series</Link>.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
