import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Why Shyam & Salim Learn ML exists, and how alternate-Sunday teaching works.',
};

export default function AboutPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 3 }}>
        About
      </Typography>

      <Stack spacing={3}>
        <Typography variant="body1">
          This isn&apos;t a conventional blog or a documentation site. Shyam and Salim are
          childhood best friends — their families have known each other for years, and they&apos;re
          always in and out of each other&apos;s homes. Every Sunday, they sit down with chai and
          teach each other something technical, and the conversation always ends up carrying
          childhood memories, family references and a fair amount of banter along with it.
        </Typography>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
            How alternate-Sunday teaching works
          </Typography>
          <Typography variant="body2" color="text.secondary">
            On one Sunday, Shyam teaches Salim. The next Sunday, Salim teaches Shyam. Whoever is
            teaching has usually spent the week reading up on the topic — which means the student
            gets explanations aimed at someone who was, a week ago, just as confused as they are
            now. The series you&apos;re reading follows this rhythm module by module, starting
            with Machine Learning.
          </Typography>
        </Paper>

        <Typography variant="body1">
          The goal is to make technical learning feel like sitting in on that Sunday conversation
          — real analogies, real doubts, real jokes — rather than reading a reference manual. The
          first series covers Machine Learning; Generative AI, MLOps, System Design and Frontend
          Engineering are planned to follow the same format.
        </Typography>
      </Stack>
    </Container>
  );
}
