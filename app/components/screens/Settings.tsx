"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { useStore } from "../../lib/hooks";
import { setSettings } from "../../lib/actions";
import { clearAll, exportJson } from "../../lib/store";
import { Button, Screen, Stack, Title, TopBar } from "../ui";

const PAUSE_CHOICES = [10, 15, 20];
const LOCK_CHOICES = [30, 60, 120];

function Choice({
  label,
  note,
  choices,
  value,
  onChange,
  unit = "min",
}: {
  label: string;
  note: string;
  choices: number[];
  value: number;
  onChange: (next: number) => void;
  unit?: string;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-bold">{label}</legend>
      <p className="text-base text-muted">{note}</p>
      <div className="flex gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            aria-pressed={value === choice}
            onClick={() => onChange(choice)}
            className={`min-h-[56px] flex-1 rounded-lg border text-lg font-bold transition-colors ${
              value === choice
                ? "border-text bg-text text-bg"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-text"
            }`}
          >
            {choice} {unit}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function Settings() {
  const nav = useNav();
  const state = useStore();
  const [confirming, setConfirming] = useState(false);

  // The export is built and downloaded entirely in the browser. Nothing is
  // uploaded, and there is no server that could receive it.
  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pause-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />
      <Title size="lg">Settings</Title>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-lg font-bold">Your entries stay on this device.</h2>
        <p className="text-base leading-relaxed text-muted">
          No account, no cloud, no analytics. Nothing you write is sent anywhere —
          the app has no server to send it to. Clearing your browser data for this
          site deletes everything.
        </p>
      </section>

      <Choice
        label="Pause length"
        note="Can be made longer, never shorter than 10 minutes."
        choices={PAUSE_CHOICES}
        value={state.settings.pauseMinutes}
        onChange={(pauseMinutes) => setSettings({ pauseMinutes })}
      />

      <Choice
        label="Message lock"
        note="How long a saved message stays hidden. Minimum 30 minutes."
        choices={LOCK_CHOICES}
        value={state.settings.lockMinutes}
        onChange={(lockMinutes) => setSettings({ lockMinutes })}
      />

      <div className="flex-1" />

      <Stack>
        {state.journal.length > 0 && (
          <Button onClick={() => nav.go({ name: "notes" })}>
            THINGS YOU WROTE DOWN ({state.journal.length})
          </Button>
        )}
        <Button onClick={onExport}>EXPORT MY DATA</Button>

        {confirming ? (
          <>
            <p className="text-lg leading-snug font-bold">
              Delete everything? Notes, paused messages and patterns. This
              can&rsquo;t be undone.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                clearAll();
                setConfirming(false);
                nav.home();
              }}
            >
              YES, DELETE IT ALL
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setConfirming(true)}>DELETE ALL DATA</Button>
        )}
      </Stack>
    </Screen>
  );
}
