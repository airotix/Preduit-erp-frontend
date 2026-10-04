"use client";
import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PurchaseOrderForm } from "@/components/screens/po-form";
import { apiGet, apiPost } from "@/lib/api-client";
import { useModuleAccess } from "@/lib/module-access";
import type { DetailModel } from "@/modules/detail/detail-data";

export function CatalogPOButton({ productId }: { productId: string }) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const access = useModuleAccess("procurement");
  const client = useQueryClient();
  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ["catalog", "po-product", productId],
    queryFn: () => apiGet<DetailModel>(`/catalog/products/${productId}/detail`), enabled: open,
  });
  return <span onClick={(e) => e.stopPropagation()}>
    <Button variant="outline" size="sm" disabled={!access.canWrite} title={access.reason ?? undefined}
      onClick={(e) => { e.stopPropagation(); setError(""); setOpen(true); }}>Create PO</Button>
    <Sheet open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <SheetContent onClick={(e) => e.stopPropagation()}>
        <SheetHeader><SheetTitle>Create purchase order</SheetTitle>
          <SheetDescription>Choose the supplier and quantities for this article.</SheetDescription></SheetHeader>
        {(error || loadError) && <p role="alert" className="px-6 text-sm text-destructive">{error || String(loadError)}</p>}
        {isLoading && <p className="px-6 text-sm">Loading article…</p>}
        {data?.product && <PurchaseOrderForm key={productId} pending={busy}
          initialProduct={{ name: data.title, price: data.product.form?.supplierPrice ?? 0,
            colors: data.product.matrix.map((row) => ({ name: row.name, hex: row.hex })) }}
          onSubmit={async (payload) => {
            setBusy(true); setError("");
            try {
              await apiPost("/procurement/pos", payload);
              for (const key of [["screen", "procurement"], ["screen", "production"], ["production"], ["finance"], ["procurement", "invoices"]]) {
                client.invalidateQueries({ queryKey: key });
              }
              setOpen(false);
            } catch (e) { setError(e instanceof Error ? e.message : "Could not create PO"); }
            finally { setBusy(false); }
          }} />}
      </SheetContent>
    </Sheet>
  </span>;
}
