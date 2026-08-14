"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Shared primitives. Everything is sized for a thumb on a phone held by
   someone whose hands are not steady: nothing interactive is under 60px tall,
   and nothing important is smaller than 18px. */

/**
 * Back and Rules live at the bottom of every screen, not in the top corners.
 * The top corners of a phone are the hardest place to reach one-handed, and
 * this app is used one-handed by definition.
 */
export function Screen({
  children,
  onBack,
  onRules,
  backLabel = "Back",
}: {
  children: ReactNode;
  onBack?: () => void;
  onRules?: () => void;
  backLabel?: string;
}) {
  const hasNav = Boolean(onBack || onRules);
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-md flex-col gap-6 px-5 pt-5">
      {children}
      {hasNav ? (
        <BottomBar onBack={onBack} onRules={onRules} backLabel={backLabel} />
      ) : (
        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
      )}
    </main>
  );
}

/**
 * Sticky, so it stays reachable on the screens long enough to scroll — the
 * rules card and the review checklist especially. Each half keeps its side even
 * when the other is empty, so the same tap always does the same thing.
 */
function BottomBar({
  onBack,
  onRules,
  backLabel,
}: {
  onBack?: () => void;
  onRules?: () => void;
  backLabel: string;
}) {
  const style =
    "flex min-h-[60px] w-full items-center justify-center rounded-xl border border-line bg-surface px-3 text-lg font-semibold text-muted transition-colors hover:border-line-strong hover:text-text active:translate-y-px";

  return (
    <nav className="sticky bottom-0 z-10 -mx-5 mt-auto border-t border-line bg-bg px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md gap-2">
        <div className="flex-1">
          {onBack && (
            <button type="button" onClick={onBack} className={style}>
              ← {backLabel}
            </button>
          )}
        </div>
        <div className="flex-1">
          {onRules && (
            <button type="button" onClick={onRules} className={style}>
              Rules
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * The heading of each screen takes focus when the screen appears, so a screen
 * reader announces where it has landed instead of staying put silently.
 */
export function Title({
  children,
  size = "xl",
}: {
  children: ReactNode;
  size?: "xl" | "lg";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className={
        size === "xl"
          ? "text-5xl leading-none font-black tracking-tight sm:text-6xl"
          : "text-4xl leading-none font-black tracking-tight"
      }
    >
      {children}
    </h1>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-xl leading-snug text-muted">{children}</p>;
}

/** Short statements, one per line, never a paragraph. */
export function Lines({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((line) => (
        <p key={line} className="text-xl leading-snug font-medium text-text">
          {line}
        </p>
      ))}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "danger" | "outline" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
};

const VARIANTS: Record<string, string> = {
  primary:
    "bg-text text-bg hover:bg-white active:translate-y-px disabled:bg-line-strong disabled:text-faint",
  danger:
    "bg-danger text-white hover:bg-danger-hot active:translate-y-px shadow-[0_0_0_1px_rgba(217,61,40,0.55)]",
  outline:
    "bg-surface text-text border border-line-strong hover:border-muted hover:bg-raised active:translate-y-px",
  quiet: "bg-transparent text-muted hover:text-text underline underline-offset-4",
};

export function Button({
  children,
  onClick,
  variant = "outline",
  type = "button",
  disabled = false,
  ariaLabel,
}: ButtonProps) {
  const base =
    // Even the quiet links get a full-width, 52px target. They were previously
    // only as wide as their own text, which made them fiddly to hit.
    variant === "quiet"
      ? "flex min-h-[52px] w-full items-center justify-center px-2 text-base font-medium"
      : "flex min-h-[64px] w-full items-center justify-center rounded-xl px-5 text-center text-lg leading-tight font-bold tracking-wide transition-colors";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${VARIANTS[variant]} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>;
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-5">{children}</div>
  );
}

export function Field({
  label,
  hint,
  value,
  onChange,
  rows = 4,
  id,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  id: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block">
        <span className="block text-sm font-bold tracking-[0.18em] text-faint">
          {label}
        </span>
        <span className="mt-1 block text-lg font-medium text-text">{hint}</span>
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-xl border border-line bg-surface p-4 text-lg leading-relaxed text-text placeholder:text-faint focus:border-line-strong"
      />
    </div>
  );
}

/** 1–10 chooser. Buttons rather than a slider — easier with shaking hands. */
export function Intensity({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (next: number) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-lg font-medium text-text">{label}</legend>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={`min-h-[52px] rounded-lg border text-lg font-bold transition-colors ${
              value === n
                ? "border-text bg-text text-bg"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-text"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
