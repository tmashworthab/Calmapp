"use client";

import { useEffect, useRef } from "react";
import { useNav } from "../../lib/nav";
import { formatClock, useNow, usePrefersReducedMotion, useStore } from "../../lib/hooks";
import {
  completePause,
  holdPause,
  remainingMs,
  resumePause,
  startPause,
} from "../../lib/actions";
import { PAUSE_STATEMENTS } from "../../lib/content";
import { Button, Lines, Screen, Stack, Title } from "../ui";

/** Emergency mode, screen one. No questions, no inputs, one way forward. */
export function Stop() {
  const nav = useNav();
  const { settings } = useStore();

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title>STOP.</Title>

      <Lines
        items={[
          "Don't send the message.",
          "Don't make the call.",
          "Don't threaten the relationship.",
          "Don't try to get reassurance right now.",
        ]}
      />

      <p className="border-l-2 border-danger pl-4 text-xl leading-snug text-muted">
        Your only job for the next {settings.pauseMinutes} minutes is to avoid
        making the situation worse.
      </p>

      <div className="flex-1" />

      <Stack>
        <Button
          variant="primary"
          onClick={() => {
            startPause(settings.pauseMinutes);
            nav.swap({ name: "countdown" });
          }}
        >
          START {settings.pauseMinutes}-MINUTE PAUSE
        </Button>
        <Button onClick={() => nav.go({ name: "letter" })}>READ THE LETTER</Button>
        <Button onClick={() => nav.go({ name: "reset" })}>I NEED A RESET</Button>
      </Stack>
    </Screen>
  );
}

/** The reassurance route — the same pause, reached by the urge that fits. */
export function Reassurance() {
  const nav = useNav();
  const { settings } = useStore();

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title>NOT NOW.</Title>

      <Lines
        items={[
          "Reassurance asked for like this rarely lands.",
          "You don't need to decide whether your fear is true right now.",
          "The need will still be there later, and smaller.",
        ]}
      />

      <div className="flex-1" />

      <Stack>
        <Button
          variant="primary"
          onClick={() => {
            startPause(settings.pauseMinutes);
            nav.swap({ name: "countdown" });
          }}
        >
          START {settings.pauseMinutes}-MINUTE PAUSE
        </Button>
        <Button onClick={() => nav.go({ name: "journal" })}>
          WRITE IT DOWN INSTEAD
        </Button>
      </Stack>
    </Screen>
  );
}

const STATEMENT_MS = 12_000;

export function Countdown() {
  const nav = useNav();
  const state = useStore();
  const now = useNow(250);
  const reducedMotion = usePrefersReducedMotion();
  const completed = useRef(false);

  const timer = state.timer;
  const left = timer ? remainingMs(state, now) : 0;
  const elapsed = timer ? timer.durationMs - left : 0;

  // Statements are keyed off elapsed time rather than an interval, so they hold
  // still while the timer is held and survive a reload mid-pause.
  const statement =
    PAUSE_STATEMENTS[Math.floor(elapsed / STATEMENT_MS) % PAUSE_STATEMENTS.length];

  const minutesLeft = Math.ceil(left / 60_000);

  useEffect(() => {
    if (!timer || completed.current) return;
    if (left > 0) return;
    completed.current = true;
    completePause();
    nav.swap({ name: "calm" });
  }, [left, timer, nav]);

  // Reopening this screen with no timer at all (deep link, cleared state):
  // send the user back rather than showing an empty clock.
  useEffect(() => {
    if (!timer && !completed.current) nav.swap({ name: "stop" });
  }, [timer, nav]);

  if (!timer) return null;

  const progress = Math.min(1, Math.max(0, elapsed / timer.durationMs));

  return (
    <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
      <div className="flex flex-col items-center gap-4 pt-2">
        <p className="text-sm font-bold tracking-[0.22em] text-faint">
          {timer.running ? "PAUSING" : "HELD"}
        </p>

        <p
          role="timer"
          aria-live="off"
          className="text-7xl leading-none font-black tabular-nums tracking-tighter"
        >
          {formatClock(left)}
        </p>

        {/* Announced once a minute rather than once a second. */}
        <p className="sr-only" aria-live="polite">
          {minutesLeft} minute{minutesLeft === 1 ? "" : "s"} left
        </p>

        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label="Pause progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className="h-full rounded-full bg-muted"
            style={{
              width: `${progress * 100}%`,
              transition: reducedMotion ? "none" : "width 300ms linear",
            }}
          />
        </div>
      </div>

      <p
        aria-live="polite"
        className="flex min-h-[5rem] items-center text-3xl leading-tight font-bold tracking-tight"
      >
        {statement}
      </p>

      <div className="flex-1" />

      <Stack>
        {/* Above grounding deliberately: your own words outrank anything the
            app can say to you. */}
        <Button variant="primary" onClick={() => nav.go({ name: "letter" })}>
          READ THE LETTER
        </Button>
        <Button onClick={() => nav.go({ name: "ground" })}>GROUNDING</Button>
        <Button onClick={() => nav.go({ name: "journal" })}>
          I WANT TO EXPLAIN WHAT HAPPENED
        </Button>
        <Button onClick={() => nav.go({ name: "reset" })}>I NEED A RESET</Button>
        <Button
          variant="quiet"
          onClick={() => (timer.running ? holdPause() : resumePause())}
        >
          {timer.running ? "Hold the timer" : "Resume the timer"}
        </Button>
      </Stack>
    </Screen>
  );
}
