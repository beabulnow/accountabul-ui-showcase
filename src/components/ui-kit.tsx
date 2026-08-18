import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-5 py-14 sm:py-20", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="grid gap-4 sm:flex sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <Heading className="mt-2 text-3xl sm:text-4xl">{title}</Heading>
        {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Card tones — the only four surfaces used across the app.
 * default: white card · notice: tinted callout · highlight: accent border only
 * inset: muted sub-panel inside another card
 */
export type CardTone = "default" | "notice" | "highlight" | "inset";

const cardToneClass: Record<CardTone, string> = {
  default: "border-border bg-card shadow-soft",
  notice: "border-notice-border bg-notice",
  highlight: "border-primary/35 bg-card shadow-soft",
  inset: "border-border bg-inset",
};

export function Card({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: CardTone;
}) {
  return (
    <div className={cn("rounded-2xl border p-5", cardToneClass[tone], className)}>{children}</div>
  );
}

/** Title inside a card — always the display serif, always this size. */
export function CardTitle({
  children,
  className,
  as: Heading = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "h2" | "h3";
}) {
  return <Heading className={cn("font-display text-xl", className)}>{children}</Heading>;
}

/** Small uppercase label above a value. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

/** Standard body paragraph. */
export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm", className)}>{children}</p>;
}

/** Supporting text under a title or field. */
export function Muted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}


export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 rounded-2xl border border-dashed border-border bg-inset px-6 py-14 text-center",
        className,
      )}
    >
      <p className="font-display text-xl">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** Single source of truth for form control styling across every route. */
export const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Label/value row for the definition lists on receipt and staff views. */
export function DetailRow({
  label,
  value,
  compact,
}: {
  label: string;
  value: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-0.5",
        compact
          ? "sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3"
          : "border-b border-border/60 py-3 last:border-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-4",
      )}
    >
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{value ?? "—"}</dd>
    </div>
  );
}
