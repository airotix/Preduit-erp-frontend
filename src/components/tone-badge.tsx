import * as React from "react";
import { tone, type Tone } from "@/lib/tone";
import { cn } from "@/lib/utils";

interface ToneBadgeProps {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Soft pill badge with a leading status dot — the ERP's standard status chip. */
export function ToneBadge({
  tone: t,
  dot = true,
  className,
  children,
}: ToneBadgeProps) {
  const k = tone(t);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
        className
      )}
      style={{ background: k.bg, color: k.fg }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: k.dot }}
        />
      )}
      {children}
    </span>
  );
}
