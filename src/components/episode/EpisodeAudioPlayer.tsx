import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MicNoneIcon from '@mui/icons-material/MicNone';
import type { EpisodeAudio } from '@/models/episode.model';
import { CHARACTERS } from '@/features/characters/characters.data';

const SPEAKER_LINE = /^([A-Z][A-Z\s.]{1,20}):\s*(.*)$/;

/** Maps an ALL-CAPS script speaker label to a known character's accent
 * color, falling back to a neutral tone for the narrator or anyone else. */
function speakerColor(label: string): string | undefined {
  const normalized = label.trim().toLowerCase();
  if (normalized === 'shyam') return CHARACTERS.shyam.accentColor;
  if (normalized === 'salim') return CHARACTERS.salim.accentColor;
  return undefined;
}

/**
 * Renders a multi-voice audio script as a readable transcript: speaker
 * labels in bold (colored to match the character where recognized),
 * delivery cues in italics, and bracketed stage/SFX directions set apart
 * as centered asides. Pure text parsing — the script is admin-authored
 * plain text, never HTML, so nothing here uses dangerouslySetInnerHTML.
 */
function ScriptTranscript({ script }: { script: string }) {
  const lines = script.split('\n').map((line) => line.trim()).filter(Boolean);

  return (
    <Stack spacing={1.25} sx={{ fontSize: '0.9rem' }}>
      {lines.map((line, index) => {
        if (line.startsWith('[') && line.endsWith(']')) {
          return (
            <Typography
              key={index}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', fontStyle: 'italic', display: 'block' }}
            >
              {line.slice(1, -1)}
            </Typography>
          );
        }

        const match = line.match(SPEAKER_LINE);
        if (match) {
          const speaker = match[1] ?? '';
          const rest = match[2] ?? '';
          const color = speakerColor(speaker);
          return (
            <Typography key={index} variant="body2" component="p">
              <Box component="span" sx={{ fontWeight: 700, color: color ?? 'text.primary' }}>
                {speaker.trim()}:
              </Box>{' '}
              {rest}
            </Typography>
          );
        }

        return (
          <Typography key={index} variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {line}
          </Typography>
        );
      })}
    </Stack>
  );
}

export default function EpisodeAudioPlayer({ audio }: { audio: EpisodeAudio }) {
  return (
    <Paper variant="outlined" sx={{ my: 4, p: { xs: 2.5, md: 3 }, borderRadius: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: audio.url ? 2 : 1.5 }}>
        <HeadphonesIcon color="secondary" />
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Listen to this episode
        </Typography>
        {audio.durationLabel && <Chip label={audio.durationLabel} size="small" sx={{ ml: 'auto' }} />}
      </Stack>

      {audio.url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- the transcript below serves as the caption/text alternative
        <audio controls style={{ width: '100%' }} src={audio.url}>
          Your browser does not support the audio element. Read the transcript below instead.
        </audio>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          The audio version is being recorded — in the meantime, here&apos;s the full script to read or perform
          yourself.
        </Typography>
      )}

      {audio.voiceCast.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2, mb: 0.5 }}>
          {audio.voiceCast.map((entry) => (
            <Chip
              key={entry.character}
              icon={<MicNoneIcon fontSize="small" />}
              size="small"
              variant="outlined"
              label={`${entry.character.charAt(0).toUpperCase()}${entry.character.slice(1)}`}
            />
          ))}
        </Stack>
      )}

      <Box component="details" sx={{ mt: 2 }}>
        <Box
          component="summary"
          sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: 'secondary.main', py: 0.5 }}
        >
          Read the full audio script
        </Box>
        {audio.voiceCast.length > 0 && (
          <Stack spacing={0.75} sx={{ mb: 2, mt: 1.5 }}>
            {audio.voiceCast.map((entry) => (
              <Typography key={entry.character} variant="caption" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 700, color: speakerColor(entry.character) }}>
                  {entry.character.charAt(0).toUpperCase() + entry.character.slice(1)}:
                </Box>{' '}
                {entry.voiceDirection}
              </Typography>
            ))}
          </Stack>
        )}
        <Box sx={{ mt: 1.5 }}>
          <ScriptTranscript script={audio.script} />
        </Box>
      </Box>
    </Paper>
  );
}
