import * as React from "react";
import { tone, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

/** Inline message banner in the standard tone colours (errors, warnings, hints). */
export function Notice({ tone: t = "red", role, className, children }: {
  tone?: Tone; role?: string; className?: string; children: React.ReactNode;
}) {
  const k = tone(t);
  return (
    <div role={role ?? (t === "red" ? "alert" : undefined)}
      className={cn("rounded-lg px-3 py-2 text-sm font-semibold", className)}
      style={{ background: k.bg, color: k.fg }}>
      {children}
    </div>
  );
}

/** Skeleton placeholder shown while a section loads (replaces bare "Loading…" text). */
export function LoadingBlock({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />)}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
