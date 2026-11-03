"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { Tone } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingBlock, Notice } from "@/components/ui/notice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToneBadge } from "@/components/tone-badge";

type NextAction = "Inspect" | "Continue" | "Resolve hold" | "Done";
type Task = {
  taskKey: string; article: string; scope: string; awaiting: number; held: number; inspector: string | null;
  status: string; legacy: boolean; nextAction: NextAction;
};
type Group = { orderId: string; orderRef: string; poRef: string | null; supplier: string | null; tasks: Task[] };

const TONE: Record<string, Tone> = {
  Pending: "amber",
  "In progress": "accent",
  "On hold": "amber",
  "Partially cleared": "navy",
  Cleared: "green",
  Rejected: "red",
};

const ACTION_LABEL: Record<NextAction, string> = {
  Inspect: "Inspect",
  Continue: "Continue inspection",
  "Resolve hold": "Resolve hold",
  Done: "View",
};

export function QcQueue() {
  const [showDone, setShowDone] = useState(false);
  const queue = useQuery({
    queryKey: ["quality", "work-queue"],
    queryFn: () => apiGet<{ groups: Group[] }>("/quality/work-queue"),
  });
  const groups = queue.data?.groups ?? [];
  const doneCount = groups.reduce((sum, group) => sum + group.tasks.filter((task) => task.nextAction === "Done").length, 0);
  const visible = groups
    .map((group) => ({ ...group, tasks: showDone ? group.tasks : group.tasks.filter((task) => task.nextAction !== "Done") }))
    .filter((group) => group.tasks.length > 0);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Articles that need a quality action. Open one to inspect, record checks and decide what happens to every colour and size.</p>
        {doneCount > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowDone((value) => !value)}>
            {showDone ? "Hide completed" : `Show completed (${doneCount})`}
          </Button>
        )}
      </div>
      {queue.isLoading && <LoadingBlock rows={3} />}
      {queue.isError && <Notice tone="red">Could not load the quality queue.</Notice>}
      {visible.map((group) => (
        <Card key={group.orderId} className="overflow-hidden">
          <header className="border-b border-border/60 px-5 py-3">
            <h2 className="font-bold">{group.orderRef}</h2>
            <p className="text-sm text-muted-foreground">PO {group.poRef || "—"} · {group.supplier || "No supplier"}</p>
          </header>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>To inspect</TableHead>
                <TableHead>On hold</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next step</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.tasks.map((task) => (
                <TableRow key={task.taskKey}>
                  <TableCell className="font-semibold">{task.article}</TableCell>
                  <TableCell>{task.scope}</TableCell>
                  <TableCell className="tabular-nums">{task.legacy ? "Legacy" : task.awaiting}</TableCell>
                  <TableCell className="tabular-nums">{task.held}</TableCell>
                  <TableCell>{task.inspector || "—"}</TableCell>
                  <TableCell><ToneBadge tone={TONE[task.status] ?? "neutral"}>{task.status}</ToneBadge></TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant={task.nextAction === "Done" ? "outline" : "default"}>
                      <Link href={`/quality/work?task=${encodeURIComponent(task.taskKey)}`}>{ACTION_LABEL[task.nextAction] ?? "Open"}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
      {queue.data && visible.length === 0 && (
        <p className="text-sm text-muted-foreground">{groups.length === 0 ? "No production is ready for inspection." : "Nothing needs a quality action right now."}</p>
      )}
    </section>
  );
}
