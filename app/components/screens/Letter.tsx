"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { useStore } from "../../lib/hooks";
import { letterText, saveReframe } from "../../lib/actions";
import type { ReframeItem } from "../../lib/types";
import { Button, Field, Screen, Stack, Title } from "../ui";

/**
 * The letter, in your own handwriting so to speak. Set at a calm reading size
 * rather than the shouting type the rest of emergency mode uses — this screen
 * is meant to slow you down, not to stop you.
 */
export function Letter() {
  const nav = useNav();
  const state = useStore();
  const paragraphs = letterText(state).split("\n\n").filter(Boolean);

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <p className="text-sm font-bold tracking-[0.22em] text-faint">
        FROM YOU, WHEN YOU WERE CALM
      </p>

      <article className="space-y-5">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="text-xl leading-relaxed text-text">
            {paragraph}
          </p>
        ))}
      </article>

      <div className="flex-1" />

      <Stack>
        {/* The letter ends by asking for this. Wiring it to a button means it
            doesn't have to be set up by hand while hurting. */}
        <Button variant="primary" onClick={() => nav.go({ name: "reframe" })}>
          DO WHAT THE LETTER SAYS
        </Button>
      </Stack>
    </Screen>
  );
}

const BLANK: ReframeItem = { hurt: "", interpretation: "", counter: "" };

/**
 * "Write down what hurt you, your painful interpretation and at least one
 * counter-interpretation for each thing you're hurt about."
 *
 * Every word of all three fields is written by hand. The app supplies the
 * shape and nothing else — it does not suggest counter-interpretations, and it
 * does not judge the ones written here.
 */
export function Reframe() {
  const nav = useNav();
  const [items, setItems] = useState<ReframeItem[]>([BLANK]);
  const [saved, setSaved] = useState(false);

  const setField = (index: number, key: keyof ReframeItem, value: string) =>
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );

  const filled = items.filter(
    (item) => item.hurt.trim() || item.interpretation.trim() || item.counter.trim(),
  );

  if (saved) {
    return (
      <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">Written down.</Title>
        <p className="text-xl leading-snug text-muted">
          It stays on this device. You can read it back later.
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

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">One at a time.</Title>
      <p className="text-lg text-muted">
        What hurt, how you&rsquo;re reading it, and at least one other way it
        could be read. Nobody sees this but you.
      </p>

      <div className="space-y-10">
        {items.map((item, index) => (
          <section key={index} className="space-y-6">
            {items.length > 1 && (
              <p className="text-sm font-bold tracking-[0.22em] text-faint">
                {index + 1} OF {items.length}
              </p>
            )}
            <Field
              id={`reframe-hurt-${index}`}
              label="WHAT HURT"
              hint="What actually happened?"
              rows={3}
              value={item.hurt}
              onChange={(value) => setField(index, "hurt", value)}
            />
            <Field
              id={`reframe-interp-${index}`}
              label="THE PAINFUL READING"
              hint="What am I taking it to mean?"
              rows={3}
              value={item.interpretation}
              onChange={(value) => setField(index, "interpretation", value)}
            />
            <Field
              id={`reframe-counter-${index}`}
              label="AT LEAST ONE OTHER READING"
              hint="What else could it mean? It doesn't have to be the one you believe."
              rows={3}
              value={item.counter}
              onChange={(value) => setField(index, "counter", value)}
            />
          </section>
        ))}
      </div>

      <Stack>
        <Button onClick={() => setItems((current) => [...current, BLANK])}>
          ANOTHER THING
        </Button>
        <Button
          variant="primary"
          disabled={filled.length === 0}
          onClick={() => {
            saveReframe(filled);
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
