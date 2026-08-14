"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { savePattern } from "../../lib/actions";
import { Button, Field, Intensity, Screen, Stack, Title } from "../ui";

/** Shown when the countdown reaches zero. Three options, no recommendation. */
export function Calm() {
  const nav = useNav();

  return (
    <Screen onRules={() => nav.go({ name: "rules" })}>
      <div className="flex-1" />

      <Title size="lg">You&rsquo;re calmer. Now choose.</Title>

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" onClick={() => nav.go({ name: "talk" })}>
          TALK LATER
        </Button>
        <Button onClick={() => nav.go({ name: "journal" })}>WRITE IT DOWN</Button>
        <Button onClick={() => nav.go({ name: "nothing" })}>DO NOTHING</Button>
        <Button variant="quiet" onClick={() => nav.go({ name: "log" })}>
          Record what happened
        </Button>
      </Stack>
    </Screen>
  );
}

export function TalkLater() {
  const nav = useNav();

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <div className="flex-1" />

      <Title size="lg">Later.</Title>

      <div className="space-y-3">
        <p className="text-xl leading-snug font-medium">Not tonight.</p>
        <p className="text-xl leading-snug font-medium">
          Pick a time when you are both calm.
        </p>
        <p className="text-xl leading-snug font-medium">
          Nothing else needs saying before then.
        </p>
      </div>

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" onClick={nav.home}>
          DONE
        </Button>
      </Stack>
    </Screen>
  );
}

export function DoNothing() {
  const nav = useNav();

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <div className="flex-1" />

      <Title size="lg">Doing nothing right now is a valid choice.</Title>

      <p className="text-xl leading-snug text-muted">
        Put the phone down. The situation will still be there, and so will you.
      </p>

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" onClick={nav.home}>
          DONE
        </Button>
      </Stack>
    </Screen>
  );
}

/**
 * Asked afterwards, never before — the home screen must not interrogate someone
 * who is activated. Every field is optional.
 */
export function LogPattern() {
  const nav = useNav();
  const [trigger, setTrigger] = useState("");
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [wantedToDo, setWantedToDo] = useState("");
  const [actuallyDid, setActuallyDid] = useState("");
  const [whatHelped, setWhatHelped] = useState("");

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">Record it</Title>
      <p className="text-lg text-muted">Optional. Skip anything you don&rsquo;t want.</p>

      <div className="space-y-7">
        <Field
          id="log-trigger"
          label="TRIGGER"
          hint="What set it off?"
          rows={3}
          value={trigger}
          onChange={setTrigger}
        />
        <Intensity
          label="How intense was it when you opened this?"
          value={before}
          onChange={setBefore}
        />
        <Intensity label="How intense is it now?" value={after} onChange={setAfter} />
        <Field
          id="log-wanted"
          label="URGE"
          hint="What did you want to do?"
          rows={3}
          value={wantedToDo}
          onChange={setWantedToDo}
        />
        <Field
          id="log-did"
          label="ACTION"
          hint="What did you actually do?"
          rows={3}
          value={actuallyDid}
          onChange={setActuallyDid}
        />
        <Field
          id="log-helped"
          label="HELPED"
          hint="What helped?"
          rows={3}
          value={whatHelped}
          onChange={setWhatHelped}
        />
      </div>

      <Stack>
        <Button
          variant="primary"
          onClick={() => {
            savePattern({
              trigger,
              intensityBefore: before,
              intensityAfter: after,
              wantedToDo,
              actuallyDid,
              whatHelped,
            });
            nav.home();
          }}
        >
          SAVE
        </Button>
        <Button variant="quiet" onClick={nav.home}>
          Skip
        </Button>
      </Stack>
    </Screen>
  );
}
