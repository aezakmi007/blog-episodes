import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import { CHARACTERS } from '@/features/characters/characters.data';
import CharacterAvatar from '@/components/story/CharacterAvatar';

export const metadata: Metadata = {
  title: 'Characters',
  description: 'Meet Shyam and Salim — childhood best friends who teach each other, one Sunday at a time.',
};

export default function CharactersPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1.5 }}>
        Meet Shyam &amp; Salim
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Childhood best friends whose families have known each other for years. On alternate
        Sundays, one teaches and the other learns — and somewhere along the way, they always end
        up talking about something else entirely.
      </Typography>

      <Grid container spacing={3}>
        {Object.values(CHARACTERS).map((character) => (
          <Grid key={character.id} size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <CharacterAvatar character={character} size={56} />
                <Stack>
                  <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                    {character.displayName}
                  </Typography>
                  <Chip label={character.teacherBadgeLabel} size="small" sx={{ alignSelf: 'flex-start', mt: 0.5 }} />
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {character.shortBio}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {character.personality}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
