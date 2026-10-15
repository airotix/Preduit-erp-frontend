"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StockMovementHistory } from "@/components/screens/stock-movement-history";

export default function InventoryMovementPage() {
  const { requestId } = useParams<{ requestId: string }>();
  return <div className="erp-scroll flex-1 space-y-4 overflow-y-auto p-6">
    <Link className="text-sm text-primary underline" href="/inventory/movements">Back to stock movement history</Link>
    <StockMovementHistory requestId={requestId} />
  </div>;
}
