"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

type Task = {
  taskKey: string; article: string; scope: string; awaiting: number; inspector: string | null;
  status: string; legacy: boolean;
};
type Group = { orderId: string; orderRef: string; poRef: string | null; supplier: string | null; tasks: Task[] };

const TONE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-800",
  "In progress": "bg-sky-50 text-sky-800",
  "On hold": "bg-orange-50 text-orange-800",
  "Partially cleared": "bg-violet-50 text-violet-800",
  Cleared: "bg-emerald-50 text-emerald-800",
  Rejected: "bg-red-50 text-red-800",
};

export function QcQueue() {
  const queue = useQuery({
    queryKey: ["quality", "work-queue"],
    queryFn: () => apiGet<{ groups: Group[] }>("/quality/work-queue"),
  });
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Quality</h1>
        <p className="text-sm text-muted-foreground">One inspection queue for full orders and production batches. Open an article to start, record checks, and confirm the release decision.</p>
      </div>
      {queue.isLoading && <p>Loading inspections…</p>}
      {queue.isError && <p role="alert" className="text-sm text-red-700">Could not load the quality queue.</p>}
      {queue.data?.groups.map((group) => (
        <section key={group.orderId} className="rounded-xl border bg-white">
          <header className="border-b px-4 py-3">
            <h2 className="font-semibold">{group.orderRef}</h2>
            <p className="text-sm text-muted-foreground">PO {group.poRef || "—"} · {group.supplier || "No supplier"}</p>
          </header>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Article</th>
                <th className="px-4 py-2 font-medium">Scope</th>
                <th className="px-4 py-2 font-medium">Awaiting QC</th>
                <th className="px-4 py-2 font-medium">Inspector</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {group.tasks.map((task) => (
                <tr key={task.taskKey} className="border-t">
                  <td className="px-4 py-3 font-medium">{task.article}</td>
                  <td className="px-4 py-3">{task.scope}</td>
                  <td className="px-4 py-3">{task.legacy ? "Legacy" : task.awaiting}</td>
                  <td className="px-4 py-3">{task.inspector || "—"}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${TONE[task.status] || ""}`}>{task.status}</span></td>
                  <td className="px-4 py-3"><Link className="font-semibold text-primary underline" href={`/quality/work?task=${encodeURIComponent(task.taskKey)}`}>Open inspection</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {queue.data && queue.data.groups.length === 0 && <p className="text-sm text-muted-foreground">No production is ready for inspection.</p>}
    </section>
  );
}
