"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/icon";
import { ToneBadge } from "@/components/tone-badge";
import { Button } from "@/components/ui/button";
import { avatarColor, initials } from "@/lib/tone";
import { apiPost, USE_BACKEND } from "@/lib/api-client";
import type { BoardConfig } from "@/lib/screen-types";
import Link from "next/link";
import { TechPackPanel } from "@/components/screens/tech-pack-panel";

/** module/tab → per-card status endpoint (approve/reject on the board). */
const CARD_STATUS_ENDPOINTS: Record<string, (id: string) => string> = {
  "procurement/approvals": (id) => `/procurement/pos/${id}/status`,
};

export function BoardView({
  config,
  module,
  tab,
}: {
  config: BoardConfig;
  module?: string;
  tab?: string;
}) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [selectedStage, setSelectedStage] = React.useState("");
  const mobileStage = config.columns.some((column) => column.title === selectedStage) ? selectedStage : config.columns[0]?.title;
  const key = `${module}/${tab}`;
  const statusBuilder = CARD_STATUS_ENDPOINTS[key];

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (USE_BACKEND && statusBuilder) return apiPost(statusBuilder(id), { status });
      return null;
    },
    onSettled: () => {
      setBusyId(null);
      queryClient.invalidateQueries({ queryKey: ["screen", module, tab] });
    },
  });

  const act = (id: string | undefined, status: string) => {
    if (!id) return;
    setBusyId(id);
    setStatus.mutate({ id, status });
  };

  return (
    <div className="min-w-0">
      <label className="mb-4 flex items-center gap-3 text-sm font-semibold sm:hidden">
        Stage
        <select aria-label="Board stage" className="min-h-11 min-w-0 flex-1 rounded-lg border bg-white px-3" value={mobileStage || ""} onChange={(event) => setSelectedStage(event.target.value)}>
          {config.columns.map((column) => <option key={column.title} value={column.title}>{column.title} ({column.count})</option>)}
        </select>
      </label>
    <div className="flex gap-4 overflow-x-auto erp-scroll pb-2">
      {config.columns.map((col) => (
        <div
          key={col.title}
          className={`${col.title === mobileStage ? "flex" : "hidden"} w-full min-w-0 flex-shrink-0 flex-col rounded-[14px] bg-muted/60 p-3 sm:flex sm:w-[300px]`}
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
                <div className="mt-1.5 font-bold text-foreground">{c.href ? <Link className="hover:underline" href={c.href}>{c.title}</Link> : c.title}</div>
                <div className="text-[13px] text-muted-foreground">{c.sub}</div>
                {c.techPacks?.map((pack) => <div key={pack.lineId} className="mt-3 border-t pt-3">
                  <div className="mb-2 text-xs font-semibold">{pack.name}</div>
                  <TechPackPanel lineId={pack.lineId} initialData={pack} />
                </div>)}

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
                    <Button
                      size="sm"
                      className="h-8 flex-1"
                      disabled={!statusBuilder || busyId === c.public_id}
                      onClick={() => act(c.public_id, "Approved")}
                    >
                      {c.aLabel ?? "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1"
                      disabled={!statusBuilder || busyId === c.public_id}
                      onClick={() => act(c.public_id, "Rejected")}
                    >
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
    </div>
  );
}

function pascal(s: string) {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}
