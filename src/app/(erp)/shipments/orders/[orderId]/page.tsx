"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useModuleAccess } from "@/lib/module-access";
import { BatchWorkspace } from "@/components/screens/production/batch-workspace";
export default function Page() {
  const { orderId } = useParams<{ orderId: string }>();
  const params = useSearchParams(), access = useModuleAccess("shipments");
  return <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{access.canRead ? <BatchWorkspace orderId={orderId} kind={params.get("kind") === "sales" ? "sales" : "production"} mode="shipments" /> : <p role="alert">Your role cannot access Shipments.</p>}</div>;
}
