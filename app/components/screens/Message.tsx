"use client";

import { useState } from "react";
import { useNav } from "../../lib/nav";
import { formatRemaining, useNow, useStore } from "../../lib/hooks";
import {
  countDiscarded,
  deleteDraft,
  isLocked,
  keepPaused,
  saveDraft,
  toggleCheck,
  updateDraftText,
} from "../../lib/actions";
import { REVIEW_CHECKLIST } from "../../lib/content";
import { Button, Card, Screen, Stack, Title } from "../ui";

/**
 * The message you were about to send.
 *
 * Nothing here rewrites it, improves it, or offers a better version. The app's
 * only job is to put time between writing it and sending it.
 */
export function Compose() {
  const nav = useNav();
  const { settings } = useStore();
  const [text, setText] = useState("");
  const [step, setStep] = useState<"write" | "decide" | "saved" | "deleted">("write");

  if (step === "saved") {
    return (
      <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">This message is paused.</Title>
        <p className="text-xl leading-snug text-muted">You can review it later.</p>
        <p className="text-lg text-faint">
          It unlocks in {settings.lockMinutes} minutes. Until then it stays hidden
          and can&rsquo;t be copied.
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

  if (step === "deleted") {
    return (
      <Screen onBack={nav.home} backLabel="Home" onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">Gone.</Title>
        <p className="text-xl leading-snug text-muted">Nothing was sent.</p>
        <div className="flex-1" />
        <Stack>
          <Button variant="primary" onClick={nav.home}>
            DONE
          </Button>
        </Stack>
      </Screen>
    );
  }

  if (step === "decide") {
    return (
      <Screen onBack={() => setStep("write")} onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />

        <Title size="lg">Do not send this yet.</Title>

        <p className="text-2xl leading-snug font-bold">
          Would you still want to send this after {settings.lockMinutes} minutes
          of being calm?
        </p>

        <div className="flex-1" />

        <Stack>
          <Button
            variant="primary"
            onClick={() => {
              saveDraft(text, settings.lockMinutes);
              setStep("saved");
            }}
          >
            SAVE FOR LATER
          </Button>
          <Button
            onClick={() => {
              countDiscarded();
              setStep("deleted");
            }}
          >
            DELETE IT
          </Button>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">Put it here first.</Title>
      <p className="text-lg text-muted">
        Paste or type the message you&rsquo;re tempted to send.
      </p>

      <label htmlFor="compose" className="sr-only">
        The message you are tempted to send
      </label>
      <textarea
        id="compose"
        rows={9}
        value={text}
        onChange={(event) => setText(event.target.value)}
        className="w-full resize-y rounded-xl border border-line bg-surface p-4 text-lg leading-relaxed text-text focus:border-line-strong"
      />

      <div className="flex-1" />

      <Stack>
        <Button variant="primary" disabled={!text.trim()} onClick={() => setStep("decide")}>
          DONE TYPING
        </Button>
      </Stack>
    </Screen>
  );
}

export function Vault() {
  const nav = useNav();
  const { drafts } = useStore();
  const now = useNow(1000);

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">Paused messages</Title>

      {drafts.length === 0 ? (
        <p className="text-lg text-muted">Nothing paused.</p>
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => {
            const locked = isLocked(draft, now);
            return (
              <li key={draft.id}>
                <button
                  type="button"
                  onClick={() => nav.go({ name: "message", id: draft.id })}
                  className="w-full rounded-xl border border-line bg-surface p-4 text-left hover:border-line-strong"
                >
                  <span className="block text-lg font-semibold">
                    {locked ? "Locked" : "Ready to review"}
                  </span>
                  <span className="mt-1 block text-base text-muted">
                    {locked
                      ? `Unlocks in ${formatRemaining(draft.lockUntil - now)}`
                      : `Saved ${new Date(draft.createdAt).toLocaleString()}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex-1" />
      <Stack>
        <Button onClick={nav.home}>HOME</Button>
      </Stack>
    </Screen>
  );
}

export function Message({ id }: { id: string }) {
  const nav = useNav();
  const state = useStore();
  const now = useNow(1000);
  const draft = state.drafts.find((entry) => entry.id === id);

  if (!draft) {
    return (
      <Screen onBack={nav.home} backLabel="Home">
        <div className="flex-1" />
        <Title size="lg">Gone.</Title>
        <p className="text-xl text-muted">Nothing was sent.</p>
        <div className="flex-1" />
        <Stack>
          <Button variant="primary" onClick={nav.home}>
            DONE
          </Button>
        </Stack>
      </Screen>
    );
  }

  const locked = isLocked(draft, now);

  if (locked) {
    return (
      <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
        <div className="flex-1" />
        <Title size="lg">This message is paused.</Title>
        <p className="text-xl leading-snug text-muted">You can review it later.</p>
        <p className="text-lg text-faint">
          Unlocks in {formatRemaining(draft.lockUntil - now)}.
        </p>
        <div className="flex-1" />
        <Stack>
          <Button variant="primary" onClick={nav.home}>
            LEAVE IT
          </Button>
          <Button
            onClick={() => {
              deleteDraft(draft.id);
              nav.home();
            }}
          >
            DELETE IT
          </Button>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen onBack={nav.back} onRules={() => nav.go({ name: "rules" })}>
      <Title size="lg">You&rsquo;re calmer now.</Title>
      <p className="text-xl leading-snug text-muted">
        Read it once. You still don&rsquo;t have to send it.
      </p>

      <MessageText text={draft.text} />

      <div className="flex-1" />

      <Stack>
        <Button
          variant="primary"
          onClick={() => keepPaused(draft.id, state.settings.lockMinutes)}
        >
          KEEP PAUSED
        </Button>
        <Button
          onClick={() => {
            deleteDraft(draft.id);
            nav.home();
          }}
        >
          DELETE
        </Button>
        <Button onClick={() => nav.go({ name: "review", id: draft.id })}>REVIEW</Button>
      </Stack>
    </Screen>
  );
}

function MessageText({ text }: { text: string }) {
  return (
    <Card>
      <p className="text-lg leading-relaxed whitespace-pre-wrap">{text}</p>
    </Card>
  );
}

export function Review({ id }: { id: string }) {
  const nav = useNav();
  const state = useStore();
  const draft = state.drafts.find((entry) => entry.id === id);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(draft?.text ?? "");

  if (!draft) {
    return (
      <Screen onBack={nav.home} backLabel="Home">
        <div className="flex-1" />
        <Title size="lg">Gone.</Title>
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
      <Title size="lg">Review</Title>

      {editing ? (
        <>
          <label htmlFor="rewrite" className="sr-only">
            Rewrite the message yourself
          </label>
          <textarea
            id="rewrite"
            rows={8}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full resize-y rounded-xl border border-line bg-surface p-4 text-lg leading-relaxed text-text focus:border-line-strong"
          />
          <Stack>
            <Button
              variant="primary"
              onClick={() => {
                updateDraftText(draft.id, text);
                setEditing(false);
              }}
            >
              SAVE MY VERSION
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setText(draft.text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </Stack>
        </>
      ) : (
        <MessageText text={draft.text} />
      )}

      <fieldset className="space-y-3">
        <legend className="text-xl font-bold">Does this:</legend>
        {REVIEW_CHECKLIST.map((item, index) => (
          <label
            key={item}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3"
          >
            <input
              type="checkbox"
              checked={draft.checks.includes(index)}
              onChange={() => toggleCheck(draft.id, index)}
              className="mt-1 h-6 w-6 shrink-0 accent-white"
            />
            <span className="text-lg leading-snug">{item}</span>
          </label>
        ))}
      </fieldset>

      <p className="text-base text-faint">
        Unticked boxes aren&rsquo;t a verdict. They&rsquo;re just what you&rsquo;d
        change if you decide to say it.
      </p>

      <Stack>
        {!editing && (
          <Button onClick={() => setEditing(true)}>REWRITE IT MYSELF</Button>
        )}
        <Button
          onClick={() => {
            keepPaused(draft.id, state.settings.lockMinutes);
            nav.home();
          }}
        >
          KEEP PAUSED
        </Button>
        <Button
          onClick={() => {
            deleteDraft(draft.id);
            nav.home();
          }}
        >
          DELETE
        </Button>
      </Stack>
    </Screen>
  );
}
