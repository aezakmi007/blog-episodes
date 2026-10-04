import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

/**
 * Global 404. Deliberately warm rather than clinical — consistent with the
 * product's tone — but still says plainly what happened and offers a real
 * way forward. No internal paths, slugs or stack details are ever leaked
 * here (this file receives no error object by design).
 */
export default function NotFound() {
  return (
    <Box sx={{ minHeight: '70dvh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="overline" color="secondary.main" sx={{ fontWeight: 700 }}>
            404
          </Typography>
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            Yeh episode abhi tak nahi hua.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Shyam aur Salim is Sunday is page tak nahi pahunche. Shayad link galat hai, ya yeh content
            abhi publish nahi hua.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button component={Link} href="/" variant="contained">
              Back to home
            </Button>
            <Button component={Link} href="/series" variant="outlined">
              Browse series
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
