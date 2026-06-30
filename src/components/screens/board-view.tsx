"use client";

import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { avatarColor, initials } from "@/lib/tone";
import type { BoardConfig } from "@/lib/screen-types";

export function BoardView({ config }: { config: BoardConfig }) {
  return (
    <div className="flex gap-4 overflow-x-auto erp-scroll pb-2">
      {config.columns.map((col) => (
        <div
          key={col.title}
          className="flex w-[300px] flex-shrink-0 flex-col rounded-[14px] bg-muted/60 p-3"
        >
          <div className="mb-3 flex items-center gap-2 px-1">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: col.accent }}
            />
            <span className="text-[13px] font-bold text-foreground">
              {col.title}
            </span>
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-bold text-muted-foreground">
              {col.count}
            </span>
          </div>

          <div className="space-y-2.5">
            {col.cards.map((c, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-white p-3.5 shadow-erp-sm transition-shadow hover:shadow-erp-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tabular text-muted-foreground">
                    {c.ref}
                  </span>
                  {c.tag && <ToneBadge tone={c.tone} dot={false}>{c.tag}</ToneBadge>}
                </div>
                <div className="mt-1.5 font-bold text-foreground">{c.title}</div>
                <div className="text-[13px] text-muted-foreground">{c.sub}</div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#3A4150]">
                    <Icon
                      name={pascal(c.metaIcon)}
                      size={14}
                      strokeWidth={2}
                      className="text-muted-foreground"
                    />
                    {c.meta}
                  </span>
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: avatarColor(c.av) }}
                  >
                    {initials(c.av)}
                  </span>
                </div>

                {c.approvable && (
                  <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
                    <Button size="sm" className="h-8 flex-1">
                      {c.aLabel ?? "Approve"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 flex-1">
                      {c.bLabel ?? "Reject"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
