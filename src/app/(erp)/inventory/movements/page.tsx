"use client";
import Link from "next/link";
import { StockMovementHistory } from "@/components/screens/stock-movement-history";

export default function InventoryMovementsPage() {
  return <div className="erp-scroll flex-1 space-y-4 overflow-y-auto p-6">
    <Link className="text-sm text-primary underline" href="/inventory/stock">Back to Inventory</Link>
    <StockMovementHistory />
  </div>;
}
