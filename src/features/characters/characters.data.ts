import { characterColorTokens } from '@/theme/tokens';

/**
 * The reusable character registry. Shyam and Salim are a fixed, two-person
 * cast — not admin-editable content — so they live here as a typed
 * constant rather than a MongoDB collection. Episodes reference a
 * character by `CharacterId` (see models/episode.model.ts) instead of
 * embedding name/avatar/color/bio on every episode, satisfying the brief's
 * "avoid repeatedly embedding character configuration inside individual
 * episodes" requirement.
 *
 * If the product later needs more than two recurring characters (a guest
 * teacher, say), this is the one file that grows — nothing else changes.
 */
export const CHARACTER_IDS = ['shyam', 'salim'] as const;
export type CharacterId = (typeof CHARACTER_IDS)[number];

export interface CharacterProfile {
  id: CharacterId;
  displayName: string;
  /** Path under /public, or a future CDN URL. Always paired with alt text
   * where rendered — see components/episode/DialogueBlock. */
  avatar: string;
  accentColor: string;
  shortBio: string;
  personality: string;
  /** Which side of the two-column desktop conversation layout this
   * character defaults to; dialogue items can still override per-item. */
  defaultDialoguePosition: 'left' | 'right';
  teacherBadgeLabel: string;
  studentBadgeLabel: string;
}

export const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  shyam: {
    id: 'shyam',
    displayName: 'Shyam',
    avatar: '/characters/shyam-avatar.svg',
    accentColor: characterColorTokens.shyam,
    shortBio:
      'Shyam grew up two houses down from Salim. He reads documentation for fun, over-explains everything, and still can’t make chai as good as Salim’s mother’s.',
    personality:
      'Methodical and a little excitable. Explains from first principles, draws diagrams in the air with his hands, and always has a real-world analogy ready — usually involving his mother’s kitchen or the neighbourhood cricket pitch.',
    defaultDialoguePosition: 'left',
    teacherBadgeLabel: 'Teaching today',
    studentBadgeLabel: 'Learning today',
  },
  salim: {
    id: 'salim',
    displayName: 'Salim',
    avatar: '/characters/salim-avatar.svg',
    accentColor: characterColorTokens.salim,
    shortBio:
      'Salim is the one who actually remembers everyone’s birthday. Sharp, impatient with jargon, and the first to say "bhai, seedha bol" when an explanation gets too academic.',
    personality:
      'Quick, funny, and allergic to unnecessary complexity. Asks the question everyone else is too embarrassed to ask, and has a running list of nicknames for every ML term that doesn’t make immediate sense.',
    defaultDialoguePosition: 'right',
    teacherBadgeLabel: 'Teaching today',
    studentBadgeLabel: 'Learning today',
  },
};

export function getCharacter(id: CharacterId): CharacterProfile {
  return CHARACTERS[id];
}

export function getOtherCharacter(id: CharacterId): CharacterProfile {
  return CHARACTERS[id === 'shyam' ? 'salim' : 'shyam'];
}
