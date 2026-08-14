"use client";

import { useNav } from "../../lib/nav";
import { EMERGENCY_RULES } from "../../lib/content";
import { Screen, Title } from "../ui";

/**
 * Reachable from every screen in the app. The visa/immigration line sits with
 * the rest deliberately — it is a rule, not a topic for discussion.
 */
export function Rules() {
  const nav = useNav();

  return (
    <Screen onBack={nav.back}>
      <div>
        <p className="text-sm font-bold tracking-[0.22em] text-faint">
          WHEN ACTIVATED
        </p>
        <Title size="lg">Emergency rules</Title>
      </div>

      <ol className="space-y-3">
        {EMERGENCY_RULES.map((rule, index) => (
          <li
            key={rule}
            className="flex items-start gap-4 rounded-lg border border-line bg-surface p-4"
          >
            <span className="text-lg font-black tabular-nums text-faint">
              {index + 1}
            </span>
            <span className="text-lg leading-snug font-semibold">{rule}</span>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
