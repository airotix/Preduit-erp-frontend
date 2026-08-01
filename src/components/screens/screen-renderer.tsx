"use client";

import { useScreen } from "@/lib/use-screen";
import { getColumns, getSchema } from "@/modules/registry";
import { DashboardView } from "@/components/screens/dashboard-view";
import { BoardView } from "@/components/screens/board-view";
import { SettingsView } from "@/components/screens/settings-view";
import { ListScreen } from "@/components/screens/list-screen";
import { Skeleton } from "@/components/ui/skeleton";
import type { TabDef } from "@/config/navigation";

export function ScreenRenderer({
  module,
  tab,
}: {
  module: string;
  tab: TabDef;
}) {
  const { data, isLoading, isError } = useScreen(module, tab.id);

  if (isLoading) return <ScreenSkeleton kind={tab.kind} />;
  if (isError || !data)
    return (
      <div className="py-20 text-center text-muted-foreground">
        Could not load this screen.
      </div>
    );

  switch (data.kind) {
    case "dashboard":
      return <DashboardView config={data} />;
    case "board":
      return <BoardView config={data} module={module} tab={tab.id} />;
    case "settings":
      return <SettingsView config={data} module={module} tab={tab.id} />;
    case "list":
      return (
        <ListScreen
          module={module}
          tab={tab.id}
          config={data}
          columns={getColumns(module, tab.id)}
          schema={getSchema(module, tab.id)}
          actionLabel={data.action ?? tab.label}
        />
      );
    default:
      return null;
  }
}

function ScreenSkeleton({ kind }: { kind: string }) {
  if (kind === "dashboard") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[128px] rounded-[14px]" />
          ))}
        </div>
        <div className="grid grid-cols-[1.7fr_1fr] gap-4">
          <Skeleton className="h-[340px] rounded-[14px]" />
          <Skeleton className="h-[340px] rounded-[14px]" />
        </div>
      </div>
    );
  }
  if (kind === "board") {
    return (
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] w-[300px] rounded-[14px]" />
        ))}
      </div>
    );
  }
  return <Skeleton className="h-[520px] w-full rounded-[14px]" />;
}
