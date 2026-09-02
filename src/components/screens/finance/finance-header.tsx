"use client";

import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared page header for the finance screens: orange eyebrow + big title +
 *  subtitle, with Export and one primary action on the right. */
export function FinanceHeader({
  title,
  subtitle,
  action,
  onAction,
  onExport,
  actionDisabled,
  actionDisabledReason,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  onExport?: () => void;
  /** Show the action button greyed out (view-only role) instead of omitting
   *  it — `actionDisabledReason` becomes its hover tooltip. */
  actionDisabled?: boolean;
  actionDisabledReason?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
          Finance
        </div>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2.5">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={15} strokeWidth={2} /> Export
          </Button>
        )}
        {action && (
          <Button
            variant="navy"
            size="sm"
            onClick={onAction}
            disabled={actionDisabled}
            title={actionDisabled ? actionDisabledReason : undefined}
          >
            <Plus size={15} strokeWidth={2} /> {action}
          </Button>
        )}
      </div>
    </div>
  );
}
