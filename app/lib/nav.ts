"use client";

import { createContext, useContext } from "react";

export type View =
  | { name: "home" }
  | { name: "stop" }
  | { name: "countdown" }
  | { name: "reassurance" }
  | { name: "ground" }
  | { name: "breathe" }
  | { name: "senses" }
  | { name: "body" }
  | { name: "journal" }
  | { name: "draft" }
  | { name: "vault" }
  | { name: "message"; id: string }
  | { name: "review"; id: string }
  | { name: "reset" }
  | { name: "calm" }
  | { name: "talk" }
  | { name: "nothing" }
  | { name: "log" }
  | { name: "letter" }
  | { name: "reframe" }
  | { name: "notes" }
  | { name: "rules" }
  | { name: "patterns" }
  | { name: "settings" };

export type Nav = {
  go: (view: View) => void;
  /** Replaces the current screen instead of stacking on top of it. */
  swap: (view: View) => void;
  back: () => void;
  home: () => void;
};

export const NavContext = createContext<Nav | null>(null);

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error("useNav must be used inside the app shell");
  return nav;
}
