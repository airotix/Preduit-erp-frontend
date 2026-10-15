"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import { BatchWorkspace, type BatchMode } from "./batch-workspace";
import { BatchProductionDetail } from "./batch-production-detail";

export function BatchModulePage({ mode }: { mode: Exclude<BatchMode, "overview"> }) {
  const { batchId } = useParams<{ batchId: string }>();
  const access = useModuleAccess(mode);
  const { data, error } = useQuery({ queryKey: ["batches", "workspace", batchId], queryFn: () => apiGet<{ orderId: string }>(`/batches/${batchId}/workspace`), enabled: access.canRead });
  return <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
    <Link className="text-sm text-primary underline" href={`/${mode}/${mode === "production" ? "porders" : mode === "quality" ? "inspections" : mode === "inventory" ? "stock" : "shipments"}`}>Back to {mode}</Link>
    {!access.canRead ? <p role="alert">Your role cannot access this module.</p> : error ? <p role="alert">{String(error)}</p> : data ? mode === "production" ? <BatchProductionDetail batchId={batchId} orderId={data.orderId} /> : <BatchWorkspace orderId={data.orderId} mode={mode} batchId={batchId} /> : <p>Loading batch…</p>}
  </div>;
}
