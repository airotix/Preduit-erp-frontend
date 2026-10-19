"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QcWorkspace } from "@/components/screens/quality/qc-workspace";

function Workspace() {
  const task = useSearchParams().get("task") ?? "";
  return <QcWorkspace taskKey={task} />;
}

export default function Page() {
  return (
    <div className="erp-scroll min-h-0 flex-1 overflow-y-auto">
      <Suspense fallback={<p className="p-6 text-sm">Loading inspection…</p>}>
        <Workspace />
      </Suspense>
    </div>
  );
}
