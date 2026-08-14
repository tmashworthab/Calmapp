import { EMPTY_STATE, type State } from "./types";

/**
 * The whole store. One localStorage key, one snapshot, no network of any kind.
 *
 * `EMPTY_STATE` is the server snapshot and is referentially stable, so the
 * static HTML and the first client render always agree; real data arrives in an
 * effect immediately afterwards.
 */

const KEY = "pause:v1";

let state: State = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function coerce(raw: unknown): State {
  if (typeof raw !== "object" || raw === null) return EMPTY_STATE;
  const value = raw as Partial<State>;
  return {
    version: 1,
    drafts: Array.isArray(value.drafts) ? value.drafts : [],
    journal: Array.isArray(value.journal) ? value.journal : [],
    patterns: Array.isArray(value.patterns) ? value.patterns : [],
    reframes: Array.isArray(value.reframes) ? value.reframes : [],
    letter: typeof value.letter === "string" ? value.letter : null,
    pausesCompleted: Number(value.pausesCompleted) || 0,
    messagesNotSent: Number(value.messagesNotSent) || 0,
    timer: value.timer ?? null,
    settings: {
      pauseMinutes: Math.max(10, Number(value.settings?.pauseMinutes) || 10),
      lockMinutes: Math.max(30, Number(value.settings?.lockMinutes) || 30),
    },
  };
}

function persist(next: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing or a full disk. The app still works for this session;
    // silently degrading beats an error dialog in front of someone activated.
  }
}

/** Loads from localStorage. Safe to call more than once. */
export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = coerce(JSON.parse(raw));
      emit();
    }
  } catch {
    state = EMPTY_STATE;
  }
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getSnapshot(): State {
  return state;
}

export function getServerSnapshot(): State {
  return EMPTY_STATE;
}

export function update(fn: (current: State) => State) {
  state = fn(state);
  persist(state);
  emit();
}

export function clearAll() {
  state = EMPTY_STATE;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do — the in-memory state is already empty
  }
  emit();
}

export function exportJson(): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
