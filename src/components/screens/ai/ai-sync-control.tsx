"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAiSyncState, runAiSync } from "@/lib/ai-api";
import type { AiSyncState } from "@/lib/ai-types";

function timeAgo(iso: string | null): string {
  if (!iso) return "never synced";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

const DOT: Record<AiSyncState["status"], string> = {
  ok: "#2E9E6B", idle: "#A9AEBC", offline: "#9C6B0E", error: "#C0392B",
};

/** "Sync now" + last-synced indicator. Triggers the ERP to refresh its AI
 *  snapshot store from the engine, then refetches every AI query. */
export function AiSyncControl() {
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState(false);
  const { data } = useQuery<AiSyncState>({
    queryKey: ["ai", "sync-state"],
    queryFn: () => fetchAiSyncState(),
  });

  const sync = async () => {
    setBusy(true);
    try {
      await runAiSync();
      await qc.invalidateQueries({ queryKey: ["ai"] }); // refetch all AI screens + sync-state
    } catch {
      qc.invalidateQueries({ queryKey: ["ai", "sync-state"] });
    } finally {
      setBusy(false);
    }
  };

  const status = data?.status ?? "idle";
  const label =
    status === "offline" ? "Engine offline"
    : status === "error" ? "Sync failed"
    : `Synced ${timeAgo(data?.lastSyncedAt ?? null)}`;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground"
        title={data?.message ?? undefined}
      >
        <CircleDot size={12} style={{ color: DOT[status] }} />
        {label}
      </span>
      <Button variant="outline" size="sm" onClick={sync} disabled={busy}>
        <RefreshCw size={15} className={cn(busy && "animate-spin")} />
        {busy ? "Syncing…" : "Sync now"}
      </Button>
    </div>
  );
}
