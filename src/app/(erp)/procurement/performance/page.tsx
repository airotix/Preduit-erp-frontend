"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SupplierPerformance } from "@/components/screens/supplier-performance";

function PageContent() {
  const params = useSearchParams();
  return <SupplierPerformance initialSupplierId={params.get("supplier") ?? ""} />;
}

export default function SupplierPerformancePage() {
  return <Suspense fallback={<p className="p-6">Loading supplier performance…</p>}><PageContent /></Suspense>;
}
