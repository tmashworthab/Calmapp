"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { saveJournal } from "../../lib/actions";
import { Button, Field, Screen, Stack, Title } from "../ui";

/**
 * Deliberately not a chatbot. Nothing here is analysed, scored, or answered.
 * The only work the screen does is hold the three things apart: what happened,
 * what it feels like, and what you want to do about it.
 */
export function Journal() {
  const nav = useNav();
  const [fact, setFact] = useState("");
  const [feeling, setFeeling] = useState("");
  const [urge, setUrge] = useState("");
  const [saved, setSaved] = useState(false);

  const empty = !fact.trim() && !feeling.trim() && !urge.trim();

  if (saved) {
    return (
      <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">Written down.</Title>
        <p className="text-xl leading-snug text-muted">
          It stays on this device. Nothing was sent.
        </p>
        <p className="text-2xl leading-snug font-bold">An urge is not an instruction.</p>
        <div className="flex-1" />
        <Stack>
          <Button variant="primary" onClick={nav.home}>
            DONE
          </Button>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <div>
        <Title size="lg">Write it here instead of sending it.</Title>
      </div>

      <div className="space-y-7">
        <Field
          id="journal-fact"
          label="FACT"
          hint="What actually happened?"
          value={fact}
          onChange={setFact}
        />
        <Field
          id="journal-feeling"
          label="FEELING"
          hint="What am I feeling right now?"
          value={feeling}
          onChange={setFeeling}
        />
        <Field
          id="journal-urge"
          label="URGE"
          hint="What do I want to do or say?"
          value={urge}
          onChange={setUrge}
        />
      </div>

      <p className="border-l-2 border-line-strong pl-4 text-2xl leading-snug font-bold">
        An urge is not an instruction.
      </p>

      <Stack>
        <Button
          variant="primary"
          disabled={empty}
          onClick={() => {
            saveJournal({ fact, feeling, urge });
            setSaved(true);
          }}
        >
          KEEP IT HERE
        </Button>
        <Button variant="quiet" onClick={nav.back}>
          Discard without saving
        </Button>
      </Stack>
    </Screen>
  );
}
