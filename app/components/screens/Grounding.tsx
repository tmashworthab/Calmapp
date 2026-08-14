"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { useNow, usePrefersReducedMotion } from "../../lib/hooks";
import { BODY_STEPS, SENSES_STEPS } from "../../lib/content";
import { Button, Lead, Screen, Stack, Title, TopBar } from "../ui";

export function Ground() {
  const nav = useNav();
  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />
      <Title size="lg">Bring it down.</Title>
      <Lead>Pick one. Any one.</Lead>

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" onClick={() => nav.go({ name: "breathe" })}>
          FEET ON THE FLOOR &amp; BREATHE
        </Button>
        <Button onClick={() => nav.go({ name: "senses" })}>
          LOOK AROUND YOU
        </Button>
        <Button onClick={() => nav.go({ name: "body" })}>
          UNCLENCH
        </Button>
      </Stack>
    </Screen>
  );
}

const INHALE_MS = 4_000;
const EXHALE_MS = 6_000;
const CYCLE_MS = INHALE_MS + EXHALE_MS;
const CYCLES = 3; // 30 seconds

export function Breathe() {
  const nav = useNav();
  const reducedMotion = usePrefersReducedMotion();
  const now = useNow(100);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const elapsed = Math.max(0, now - startedAt);
  const done = elapsed >= CYCLE_MS * CYCLES;
  const withinCycle = elapsed % CYCLE_MS;
  const inhaling = withinCycle < INHALE_MS;
  const phaseLeft = inhaling
    ? INHALE_MS - withinCycle
    : CYCLE_MS - withinCycle;
  const cycle = Math.min(CYCLES, Math.floor(elapsed / CYCLE_MS) + 1);

  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />

      <p className="text-2xl leading-snug font-bold">Put both feet on the floor.</p>

      <div className="flex flex-1 flex-col items-center justify-center gap-10">
        {reducedMotion ? (
          // No animation at all: the instruction and the count carry the pacing.
          <div className="flex h-56 w-56 flex-col items-center justify-center rounded-full border-2 border-breath">
            <span className="text-5xl font-black tracking-tight">
              {done ? "DONE" : inhaling ? "IN" : "OUT"}
            </span>
            {!done && (
              <span className="mt-2 text-3xl font-bold tabular-nums text-muted">
                {Math.ceil(phaseLeft / 1000)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex h-56 w-56 items-center justify-center">
            <div
              className="rounded-full bg-breath/20 ring-2 ring-breath"
              style={{
                width: "14rem",
                height: "14rem",
                transform: `scale(${done ? 0.55 : inhaling ? 1 : 0.55})`,
                transition: `transform ${
                  done ? 600 : inhaling ? INHALE_MS : EXHALE_MS
                }ms ${inhaling ? "ease-out" : "ease-in-out"}`,
              }}
            />
          </div>
        )}

        <p aria-live="polite" className="text-3xl font-bold tracking-tight">
          {done ? "That's enough." : inhaling ? "Breathe in." : "Breathe out, slower."}
        </p>

        {!done && (
          <p className="text-base text-faint">
            {cycle} of {CYCLES}
          </p>
        )}
      </div>

      <Stack>
        {done ? (
          <>
            <Button variant="primary" onClick={() => setStartedAt(Date.now())}>
              AGAIN
            </Button>
            <Button onClick={nav.back}>DONE</Button>
          </>
        ) : (
          <Button onClick={nav.back}>STOP</Button>
        )}
      </Stack>
    </Screen>
  );
}

export function Senses() {
  const nav = useNav();
  const [step, setStep] = useState(0);
  const current = SENSES_STEPS[step];
  const last = step === SENSES_STEPS.length - 1;

  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />

      <p className="text-2xl leading-snug font-bold">Look around you.</p>

      <div className="flex flex-1 flex-col justify-center" aria-live="polite">
        <p className="text-8xl leading-none font-black tabular-nums">
          {current.count}
        </p>
        <p className="mt-4 text-3xl leading-tight font-bold tracking-tight">
          {current.label}
        </p>
      </div>

      <Stack>
        {last ? (
          <Button variant="primary" onClick={nav.back}>
            DONE
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setStep((n) => n + 1)}>
            NEXT
          </Button>
        )}
      </Stack>
    </Screen>
  );
}

export function Body() {
  const nav = useNav();
  const [step, setStep] = useState(0);
  const last = step === BODY_STEPS.length - 1;

  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />

      <div className="flex flex-1 flex-col justify-center" aria-live="polite">
        <p className="text-5xl leading-tight font-black tracking-tight">
          {BODY_STEPS[step]}
        </p>
        <p className="mt-6 text-base text-faint">
          {step + 1} of {BODY_STEPS.length}
        </p>
      </div>

      <Stack>
        {last ? (
          <Button variant="primary" onClick={nav.back}>
            DONE
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setStep((n) => n + 1)}>
            NEXT
          </Button>
        )}
      </Stack>
    </Screen>
  );
}
