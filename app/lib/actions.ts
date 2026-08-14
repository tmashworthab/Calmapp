import { newId, update } from "./store";
import type { Draft, PatternEntry, State } from "./types";

/* Every mutation the app can make. Nothing here touches the network. */

/* ---------- the countdown ---------- */

export function startPause(minutes: number) {
  const durationMs = minutes * 60_000;
  update((state) => ({
    ...state,
    timer: {
      durationMs,
      endsAt: Date.now() + durationMs,
      remainingMs: durationMs,
      running: true,
    },
  }));
}

export function holdPause() {
  update((state) => {
    if (!state.timer?.running || state.timer.endsAt === null) return state;
    return {
      ...state,
      timer: {
        ...state.timer,
        running: false,
        endsAt: null,
        remainingMs: Math.max(0, state.timer.endsAt - Date.now()),
      },
    };
  });
}

export function resumePause() {
  update((state) => {
    if (!state.timer || state.timer.running) return state;
    return {
      ...state,
      timer: {
        ...state.timer,
        running: true,
        endsAt: Date.now() + state.timer.remainingMs,
      },
    };
  });
}

export function clearPause() {
  update((state) => ({ ...state, timer: null }));
}

/** Called once when the countdown reaches zero. */
export function completePause() {
  update((state) => ({
    ...state,
    timer: null,
    pausesCompleted: state.pausesCompleted + 1,
  }));
}

/** Remaining milliseconds, derived from the wall clock. */
export function remainingMs(state: State, now: number): number {
  if (!state.timer) return 0;
  if (!state.timer.running || state.timer.endsAt === null) {
    return state.timer.remainingMs;
  }
  return Math.max(0, state.timer.endsAt - now);
}

/* ---------- the message you were about to send ---------- */

export function saveDraft(text: string, lockMinutes: number): string {
  const id = newId();
  update((state) => ({
    ...state,
    drafts: [
      {
        id,
        text,
        createdAt: Date.now(),
        lockUntil: Date.now() + lockMinutes * 60_000,
        checks: [],
      },
      ...state.drafts,
    ],
  }));
  return id;
}

/** Re-locks a message for another full lock period. */
export function keepPaused(id: string, lockMinutes: number) {
  update((state) => ({
    ...state,
    drafts: state.drafts.map((draft) =>
      draft.id === id
        ? { ...draft, lockUntil: Date.now() + lockMinutes * 60_000 }
        : draft,
    ),
  }));
}

/**
 * Deleting a message is the outcome this app exists to produce, so it is also
 * the thing worth counting.
 */
export function deleteDraft(id: string) {
  update((state) => ({
    ...state,
    drafts: state.drafts.filter((draft) => draft.id !== id),
    messagesNotSent: state.messagesNotSent + 1,
  }));
}

/** Counts a message that was never saved in the first place. */
export function countDiscarded() {
  update((state) => ({ ...state, messagesNotSent: state.messagesNotSent + 1 }));
}

export function toggleCheck(id: string, index: number) {
  update((state) => ({
    ...state,
    drafts: state.drafts.map((draft) =>
      draft.id === id
        ? {
            ...draft,
            checks: draft.checks.includes(index)
              ? draft.checks.filter((value) => value !== index)
              : [...draft.checks, index],
          }
        : draft,
    ),
  }));
}

export function updateDraftText(id: string, text: string) {
  update((state) => ({
    ...state,
    drafts: state.drafts.map((draft) =>
      draft.id === id ? { ...draft, text } : draft,
    ),
  }));
}

export function isLocked(draft: Draft, now: number): boolean {
  return now < draft.lockUntil;
}

/* ---------- journal and patterns ---------- */

export function saveJournal(entry: { fact: string; feeling: string; urge: string }) {
  update((state) => ({
    ...state,
    journal: [{ id: newId(), createdAt: Date.now(), ...entry }, ...state.journal],
  }));
}

export function savePattern(entry: Omit<PatternEntry, "id" | "createdAt">) {
  update((state) => ({
    ...state,
    patterns: [{ id: newId(), createdAt: Date.now(), ...entry }, ...state.patterns],
  }));
}

export function deletePattern(id: string) {
  update((state) => ({
    ...state,
    patterns: state.patterns.filter((entry) => entry.id !== id),
  }));
}

export function deleteJournal(id: string) {
  update((state) => ({
    ...state,
    journal: state.journal.filter((entry) => entry.id !== id),
  }));
}

export function setSettings(next: Partial<State["settings"]>) {
  update((state) => ({
    ...state,
    settings: {
      // Floors are enforced here as well as in the UI: the pause and the lock
      // can be made longer, never shorter.
      pauseMinutes: Math.max(10, next.pauseMinutes ?? state.settings.pauseMinutes),
      lockMinutes: Math.max(30, next.lockMinutes ?? state.settings.lockMinutes),
    },
  }));
}
