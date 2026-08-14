export type Draft = {
  id: string;
  text: string;
  createdAt: number;
  /** Epoch ms until which the text is hidden and cannot be copied. */
  lockUntil: number;
  /** Which items of the review checklist have been ticked. */
  checks: number[];
};

export type JournalEntry = {
  id: string;
  createdAt: number;
  fact: string;
  feeling: string;
  urge: string;
};

export type PatternEntry = {
  id: string;
  createdAt: number;
  trigger: string;
  /** 1–10, or null if not recorded. */
  intensityBefore: number | null;
  intensityAfter: number | null;
  wantedToDo: string;
  actuallyDid: string;
  whatHelped: string;
};

/**
 * The countdown survives reloads and backgrounding. While running we store the
 * wall-clock end time; while held we store what was left, so a paused timer
 * doesn't quietly drain in the background.
 */
export type Timer = {
  durationMs: number;
  endsAt: number | null;
  remainingMs: number;
  running: boolean;
};

export type Settings = {
  /** Minimum 10. Settings can make the pause longer, never shorter. */
  pauseMinutes: number;
  /** Minimum 30. Same rule — the lock can only be strengthened. */
  lockMinutes: number;
};

export type State = {
  version: 1;
  drafts: Draft[];
  journal: JournalEntry[];
  patterns: PatternEntry[];
  pausesCompleted: number;
  messagesNotSent: number;
  timer: Timer | null;
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = { pauseMinutes: 10, lockMinutes: 30 };

export const EMPTY_STATE: State = {
  version: 1,
  drafts: [],
  journal: [],
  patterns: [],
  pausesCompleted: 0,
  messagesNotSent: 0,
  timer: null,
  settings: DEFAULT_SETTINGS,
};
