"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Shared primitives. Everything is sized for a thumb on a phone held by
   someone whose hands are not steady: nothing interactive is under 60px tall,
   and nothing important is smaller than 18px. */

export function Screen({
  children,
  center = false,
}: {
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <main
      className={`mx-auto flex min-h-[100svh] w-full max-w-md flex-col gap-6 px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${
        center ? "justify-center" : ""
      }`}
    >
      {children}
    </main>
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
    variant === "quiet"
      ? "min-h-[44px] px-1 text-base font-medium"
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

/** Top bar: back on the left, the rules always one tap away on the right. */
export function TopBar({
  onBack,
  onRules,
  label = "Back",
}: {
  onBack?: () => void;
  onRules?: () => void;
  label?: string;
}) {
  return (
    <div className="flex min-h-[44px] items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 min-h-[44px] px-2 text-base font-semibold text-muted hover:text-text"
        >
          ← {label}
        </button>
      ) : (
        <span />
      )}
      {onRules ? (
        <button
          type="button"
          onClick={onRules}
          className="-mr-2 min-h-[44px] px-2 text-base font-semibold text-muted hover:text-text"
        >
          Rules
        </button>
      ) : (
        <span />
      )}
    </div>
  );
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
