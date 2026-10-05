"use client";

import { useScreen } from "@/lib/use-screen";
import { getColumns, getSchema } from "@/modules/registry";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { TabDef } from "@/config/navigation";

const DashboardView = dynamic(() => import("./dashboard-view").then((module) => module.DashboardView), { loading: () => <ScreenSkeleton kind="dashboard" /> });
const BoardView = dynamic(() => import("./board-view").then((module) => module.BoardView), { loading: () => <ScreenSkeleton kind="board" /> });
const SettingsView = dynamic(() => import("./settings-view").then((module) => module.SettingsView), { loading: () => <ScreenSkeleton kind="settings" /> });
const ListScreen = dynamic(() => import("./list-screen").then((module) => module.ListScreen), { loading: () => <ScreenSkeleton kind="list" /> });

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[128px] rounded-[14px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <Skeleton className="h-[340px] rounded-[14px]" />
          <Skeleton className="h-[340px] rounded-[14px]" />
        </div>
      </div>
    );
  }
  if (kind === "board") {
    return (
      <div className="erp-scroll flex gap-4 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] w-[300px] rounded-[14px]" />
        ))}
      </div>
    );
  }
  return <Skeleton className="h-[520px] w-full rounded-[14px]" />;
}
