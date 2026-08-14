"use client";

import { useNav } from "../../lib/nav";
import { useStore } from "../../lib/hooks";
import { deleteJournal } from "../../lib/actions";
import { Button, Screen, Stack, Title, TopBar } from "../ui";

/** Read-back for the journal. Still no analysis — it just shows what you wrote. */
export function Notes() {
  const nav = useNav();
  const { journal } = useStore();

  return (
    <Screen>
      <TopBar onBack={nav.back} onRules={() => nav.go({ name: "rules" })} />
      <Title size="lg">Things you wrote down</Title>

      {journal.length === 0 ? (
        <p className="text-lg text-muted">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {journal.map((entry) => (
            <li
              key={entry.id}
              className="space-y-3 rounded-xl border border-line bg-surface p-4"
            >
              <p className="text-sm text-faint">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              {(
                [
                  ["FACT", entry.fact],
                  ["FEELING", entry.feeling],
                  ["URGE", entry.urge],
                ] as const
              ).map(
                ([label, value]) =>
                  value.trim() && (
                    <div key={label}>
                      <p className="text-xs font-bold tracking-[0.18em] text-faint">
                        {label}
                      </p>
                      <p className="mt-1 text-lg leading-snug whitespace-pre-wrap">
                        {value}
                      </p>
                    </div>
                  ),
              )}
              <button
                type="button"
                onClick={() => deleteJournal(entry.id)}
                className="min-h-[44px] text-base text-faint underline underline-offset-4 hover:text-text"
              >
                Delete this note
              </button>
            </li>
          ))}
        </ul>
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
