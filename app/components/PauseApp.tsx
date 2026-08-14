"use client";

import { useEffect, useMemo, useState } from "react";
import { NavContext, type View } from "../lib/nav";
import { useStore } from "../lib/hooks";
import { Home } from "./screens/Home";
import { Stop, Countdown, Reassurance } from "./screens/Emergency";
import { Ground, Breathe, Senses, Body } from "./screens/Grounding";
import { Journal } from "./screens/Journal";
import { Compose, Vault, Message, Review } from "./screens/Message";
import { Reset } from "./screens/Reset";
import { Calm, TalkLater, DoNothing, LogPattern } from "./screens/Calm";
import { Letter, Reframe } from "./screens/Letter";
import { Notes } from "./screens/Notes";
import { Rules } from "./screens/Rules";
import { Patterns } from "./screens/Patterns";
import { Settings } from "./screens/Settings";

export function PauseApp() {
  const state = useStore();
  const [stack, setStack] = useState<View[]>([{ name: "home" }]);
  // Set only when the user asks for the home screen by hand, which is what
  // stops the restore below from dragging them back to the countdown.
  const [wantsHome, setWantsHome] = useState(false);

  const nav = useMemo(
    () => ({
      // `wantsHome` deliberately survives navigation: having chosen the home
      // screen once, backing out of Rules should return there, not to the
      // countdown.
      go: (next: View) => setStack((current) => [...current, next]),
      swap: (next: View) =>
        setStack((current) => [...current.slice(0, -1), next]),
      back: () =>
        setStack((current) => (current.length > 1 ? current.slice(0, -1) : current)),
      home: () => {
        setWantsHome(true);
        setStack([{ name: "home" }]);
      },
    }),
    [],
  );

  const top = stack[stack.length - 1];

  // Opened while a pause is already running — the phone locked, the tab was
  // closed, the app was reopened out of habit. Go straight back to the
  // countdown rather than offering the home screen's buttons again. Derived
  // rather than restored in an effect, so there is no flash of the wrong screen.
  const view: View =
    top.name === "home" && state.timer && !wantsHome ? { name: "countdown" } : top;

  // Escape goes back one screen — the only keyboard shortcut, because it is the
  // one that matters when you have opened something by mistake.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      if (target && /^(TEXTAREA|INPUT)$/.test(target.tagName)) return;
      nav.back();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nav]);

  function render() {
    switch (view.name) {
      case "home":
        return <Home />;
      case "stop":
        return <Stop />;
      case "countdown":
        return <Countdown />;
      case "reassurance":
        return <Reassurance />;
      case "ground":
        return <Ground />;
      case "breathe":
        return <Breathe />;
      case "senses":
        return <Senses />;
      case "body":
        return <Body />;
      case "journal":
        return <Journal />;
      case "draft":
        return <Compose />;
      case "vault":
        return <Vault />;
      case "message":
        return <Message id={view.id} />;
      case "review":
        return <Review id={view.id} />;
      case "reset":
        return <Reset />;
      case "calm":
        return <Calm />;
      case "talk":
        return <TalkLater />;
      case "nothing":
        return <DoNothing />;
      case "log":
        return <LogPattern />;
      case "letter":
        return <Letter />;
      case "reframe":
        return <Reframe />;
      case "notes":
        return <Notes />;
      case "rules":
        return <Rules />;
      case "patterns":
        return <Patterns />;
      case "settings":
        return <Settings />;
    }
  }

  return (
    <NavContext.Provider value={nav}>
      {/* Keying on the screen name restarts each screen's own state cleanly. */}
      <div key={stack.length + view.name} className="animate-fade">
        {render()}
      </div>
    </NavContext.Provider>
  );
}
