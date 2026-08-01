"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCENARIOS, type Scenario } from "@/lib/ai-types";
import { useAi } from "@/lib/ai-context";
import { AiSyncControl } from "@/components/screens/ai/ai-sync-control";
import { cn } from "@/lib/utils";

const SCENARIO_LABEL: Record<Scenario, string> = {
  conservative: "Conservative",
  base: "Base",
  optimistic: "Optimistic",
};

/** Shared header for AI Insights screens: orange eyebrow + title + subtitle,
 *  with an optional scenario switcher and refresh / export actions. */
export function AiHeader({
  title,
  subtitle,
  showScenario = false,
  onRefresh,
  onExport,
}: {
  title: string;
  subtitle: string;
  showScenario?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
}) {
  const { scenario, setScenario } = useAi();

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Demand Planning
        </div>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <AiSyncControl />
        {showScenario && (
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                onClick={() => setScenario(s)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  scenario === s
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {SCENARIO_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw size={15} strokeWidth={2} /> Refresh
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={15} strokeWidth={2} /> Export
          </Button>
        )}
      </div>
    </div>
  );
}
