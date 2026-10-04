import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import type { ContentBlock, DialogueLine } from '@/models/content-block.model';
import { CHARACTERS } from '@/features/characters/characters.data';
import CharacterAvatar from '@/components/story/CharacterAvatar';

type DialogueBlockData = Extract<ContentBlock, { type: 'dialogue' }>;

interface Turn {
  speaker: DialogueLine['speaker'];
  lines: DialogueLine[];
}

/** Groups consecutive lines from the same speaker into one visual "turn" —
 * this is what the brief means by not fragmenting every sentence into its
 * own bubble. A turn shows the avatar/name once, then stacks its lines. */
function groupIntoTurns(lines: DialogueLine[]): Turn[] {
  const turns: Turn[] = [];
  for (const line of lines) {
    const lastTurn = turns[turns.length - 1];
    if (lastTurn && lastTurn.speaker === line.speaker) {
      lastTurn.lines.push(line);
    } else {
      turns.push({ speaker: line.speaker, lines: [line] });
    }
  }
  return turns;
}

function TurnBubble({ turn }: { turn: Turn }) {
  const character = CHARACTERS[turn.speaker];
  const isRight = character.defaultDialoguePosition === 'right';

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        flexDirection: { xs: 'row', md: isRight ? 'row-reverse' : 'row' },
        justifyContent: 'flex-start',
      }}
    >
      <CharacterAvatar character={character} size={36} />
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          maxWidth: { xs: '100%', md: '72%' },
          borderColor: character.accentColor,
          borderWidth: 1.5,
          bgcolor: 'background.paper',
        }}
      >
        {/* Name is always shown as text — color is never the only speaker
            identifier (WCAG non-color-reliance requirement). */}
        <Typography
          variant="subtitle2"
          sx={{ color: character.accentColor, fontWeight: 700, mb: 0.75 }}
        >
          {character.displayName}
        </Typography>

        <Stack spacing={1}>
          {turn.lines.map((line) => (
            <Box key={line.id}>
              {line.stageDirection && (
                <Typography
                  variant="caption"
                  component="p"
                  sx={{ fontStyle: 'italic', color: 'text.secondary', mb: 0.25 }}
                >
                  ({line.stageDirection})
                </Typography>
              )}
              <Typography
                variant="body1"
                component="p"
                sx={{
                  fontWeight: line.emphasis === 'bold' ? 700 : 400,
                  bgcolor: line.emphasis === 'highlight' ? 'warning.light' : 'transparent',
                  px: line.emphasis === 'highlight' ? 0.75 : 0,
                  borderRadius: line.emphasis === 'highlight' ? 0.5 : 0,
                  display: 'inline',
                }}
              >
                {line.text}
              </Typography>
              {line.reaction && (
                <Typography
                  variant="caption"
                  component="span"
                  sx={{ ml: 1, color: 'text.secondary' }}
                  aria-label={`Reaction: ${line.reaction}`}
                >
                  [{line.reaction}]
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function DialogueBlock({ block }: { block: DialogueBlockData }) {
  const turns = groupIntoTurns([...block.lines].sort((a, b) => a.displayOrder - b.displayOrder));

  return (
    <Stack
      spacing={2}
      sx={{ my: 3 }}
      role="group"
      aria-label={`Conversation between ${CHARACTERS.shyam.displayName} and ${CHARACTERS.salim.displayName}`}
    >
      {turns.map((turn, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <TurnBubble key={`${turn.speaker}-${index}`} turn={turn} />
      ))}
    </Stack>
  );
}
