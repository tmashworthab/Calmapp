"use client";

import { useNav } from "../../lib/nav";
import { useStore } from "../../lib/hooks";
import { deletePattern } from "../../lib/actions";
import { Button, Screen, Stack, Title } from "../ui";

function average(values: number[]): string | null {
  if (values.length === 0) return null;
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  return mean.toFixed(1);
}

/**
 * A record, not a diagnosis and not a game. No streaks, no badges, no praise —
 * just the count of times the urge didn't win.
 */
export function Patterns() {
  const nav = useNav();
  const state = useStore();

  const before = average(
    state.patterns
      .map((entry) => entry.intensityBefore)
      .filter((value): value is number => value !== null),
  );
  const after = average(
    state.patterns
      .map((entry) => entry.intensityAfter)
      .filter((value): value is number => value !== null),
  );

  const stats: [string, string][] = [
    ["Times you paused instead of reacting", String(state.pausesCompleted)],
    ["Times you avoided sending an impulsive message", String(state.messagesNotSent)],
  ];
  if (before) stats.push(["Average intensity before pausing", before]);
  if (after) stats.push(["Average intensity after the pause", after]);

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">Patterns</Title>

      <dl className="space-y-3">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4"
          >
            <dt className="text-lg leading-snug text-muted">{label}</dt>
            <dd className="text-3xl font-black tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <Stack>
        <Button onClick={() => nav.go({ name: "log" })}>ADD AN ENTRY</Button>
      </Stack>

      {state.patterns.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-[0.22em] text-faint">ENTRIES</h2>
          <ul className="space-y-3">
            {state.patterns.map((entry) => (
              <li
                key={entry.id}
                className="space-y-2 rounded-lg border border-line bg-surface p-4"
              >
                <p className="text-sm text-faint">
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.intensityBefore !== null && entry.intensityAfter !== null
                    ? ` · ${entry.intensityBefore} → ${entry.intensityAfter}`
                    : ""}
                </p>
                {entry.trigger && <p className="text-lg leading-snug">{entry.trigger}</p>}
                {entry.actuallyDid && (
                  <p className="text-base text-muted">Did: {entry.actuallyDid}</p>
                )}
                {entry.whatHelped && (
                  <p className="text-base text-muted">Helped: {entry.whatHelped}</p>
                )}
                <button
                  type="button"
                  onClick={() => deletePattern(entry.id)}
                  className="min-h-[44px] text-base text-faint underline underline-offset-4 hover:text-text"
                >
                  Delete this entry
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" onClick={nav.home}>
          HOME
        </Button>
      </Stack>
    </Screen>
  );
}
