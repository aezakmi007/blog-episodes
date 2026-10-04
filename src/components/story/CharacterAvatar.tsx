import Avatar from '@mui/material/Avatar';
import type { CharacterProfile } from '@/features/characters/characters.data';

/**
 * Renders an initials avatar in the character's accent color. There is no
 * licensed/original illustration asset yet (see CHARACTERS.avatar in
 * characters.data.ts for where a real illustration path would go) — using
 * initials rather than a placeholder stock photo keeps the product's
 * "no copyrighted character artwork" constraint trivially satisfied, and
 * swapping in real illustrations later only means changing this one
 * component, not every place a character is displayed.
 */
export default function CharacterAvatar({
  character,
  size = 40,
}: {
  character: CharacterProfile;
  size?: number;
}) {
  return (
    <Avatar
      alt={character.displayName}
      sx={{
        width: size,
        height: size,
        bgcolor: character.accentColor,
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
      }}
    >
      {character.displayName.charAt(0)}
    </Avatar>
  );
}
