"use client";

import { useNav } from "../../lib/nav";
import { formatClock, useNow, useStore } from "../../lib/hooks";
import { isLocked, remainingMs } from "../../lib/actions";
import { Button, Screen, Stack } from "../ui";

export function Home() {
  const nav = useNav();
  const state = useStore();
  const now = useNow(1000);
  const paused = state.drafts.length;
  const unlocked = state.drafts.filter((draft) => !isLocked(draft, now)).length;
  const timer = state.timer;

  return (
    <Screen>
      <header className="pt-2">
        <h1 className="text-6xl leading-none font-black tracking-tighter sm:text-7xl">
          PAUSE.
        </h1>
        <p className="mt-3 text-xl leading-snug text-muted">
          You don&rsquo;t have to solve this right now.
        </p>
      </header>

      {/* A pause already under way outranks everything else on this screen. */}
      {timer && (
        <button
          type="button"
          onClick={() => nav.go({ name: "countdown" })}
          className="flex items-center justify-between gap-4 rounded-xl border border-line-strong bg-raised p-4 text-left hover:border-muted"
        >
          <span className="text-lg font-bold">
            {timer.running ? "Pause running" : "Pause held"}
          </span>
          <span className="text-3xl font-black tabular-nums">
            {formatClock(remainingMs(state, now))}
          </span>
        </button>
      )}

      <Stack>
        <Button onClick={() => nav.go({ name: "draft" })}>
          I&rsquo;M ABOUT TO SEND SOMETHING
        </Button>
        <Button onClick={() => nav.go({ name: "stop" })}>
          I&rsquo;M ANGRY / HURT
        </Button>
        <Button onClick={() => nav.go({ name: "reassurance" })}>
          I FEEL LIKE I NEED REASSURANCE
        </Button>
      </Stack>

      <div>
        <Button variant="danger" onClick={() => nav.go({ name: "stop" })}>
          BREAK GLASS
        </Button>
      </div>

      {paused > 0 && (
        <button
          type="button"
          onClick={() => nav.go({ name: "vault" })}
          className="rounded-xl border border-line bg-surface p-4 text-left hover:border-line-strong"
        >
          <span className="block text-lg font-semibold text-text">
            {paused} message{paused === 1 ? "" : "s"} paused
          </span>
          <span className="mt-1 block text-base text-muted">
            {unlocked > 0
              ? `${unlocked} ready to review when you're calm`
              : "Locked. Nothing to do yet."}
          </span>
        </button>
      )}

      <div className="flex-1" />

      <nav className="grid grid-cols-2 gap-x-2 border-t border-line pt-4">
        <Button variant="quiet" onClick={() => nav.go({ name: "letter" })}>
          Read the letter
        </Button>
        <Button variant="quiet" onClick={() => nav.go({ name: "rules" })}>
          Emergency rules
        </Button>
        <Button variant="quiet" onClick={() => nav.go({ name: "reset" })}>
          I need a reset
        </Button>
        <Button variant="quiet" onClick={() => nav.go({ name: "patterns" })}>
          Patterns
        </Button>
        <Button variant="quiet" onClick={() => nav.go({ name: "settings" })}>
          Settings
        </Button>
      </nav>

      <p className="text-sm text-faint">Your entries stay on this device.</p>
    </Screen>
  );
}
