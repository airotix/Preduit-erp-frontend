"use client";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { BatchWorkspace } from "@/components/screens/production/batch-workspace";

export default function BatchWorkPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data, error } = useQuery({ queryKey: ["batches", "workspace", batchId], queryFn: () => apiGet<{ orderId: string }>(`/batches/${batchId}/workspace`) });
  return <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
    {error ? <p role="alert">{String(error)}</p> : data ? <BatchWorkspace orderId={data.orderId} mode="overview" batchId={batchId} /> : <p>Loading batch workspace…</p>}
  </div>;
}
