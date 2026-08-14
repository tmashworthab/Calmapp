"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { useStore } from "../../lib/hooks";
import { startPause } from "../../lib/actions";
import { RESET_CLOSING, RESET_STEPS } from "../../lib/content";
import { Button, Screen, Stack, Title } from "../ui";

/** Self-paced: one instruction per screen, no timer, no pressure. */
export function Reset() {
  const nav = useNav();
  const { settings } = useStore();
  const [step, setStep] = useState(0);
  const finished = step >= RESET_STEPS.length;

  if (finished) {
    return (
      <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">{RESET_CLOSING}</Title>
        <div className="flex-1" />
        <Stack>
          <Button variant="primary" onClick={nav.home}>
            DONE
          </Button>
          <Button
            onClick={() => {
              startPause(settings.pauseMinutes);
              nav.swap({ name: "countdown" });
            }}
          >
            START {settings.pauseMinutes}-MINUTE PAUSE
          </Button>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <div className="flex flex-1 flex-col justify-center" aria-live="polite">
        <p className="text-6xl leading-none font-black tracking-tight">
          {RESET_STEPS[step]}
        </p>
        <p className="mt-6 text-base text-faint">
          {step + 1} of {RESET_STEPS.length}
        </p>
      </div>

      <Stack>
        <Button variant="primary" onClick={() => setStep((n) => n + 1)}>
          NEXT
        </Button>
      </Stack>
    </Screen>
  );
}
