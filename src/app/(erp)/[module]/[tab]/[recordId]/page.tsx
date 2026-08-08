"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { getModule, getTab } from "@/config/navigation";
import { detailTypeFor } from "@/config/detail-types";
import { fetchScreen } from "@/modules/registry";
import { RecordDetailPage } from "@/components/screens/record-detail-page";
import { ProductionOrderDetail } from "@/components/screens/production/production-order-detail";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import type { Cell, ScreenConfig } from "@/lib/screen-types";
import type { DetailModel } from "@/modules/detail/detail-data";

/** Detail types that have a real backend endpoint: type → path builder. */
const BACKEND_DETAILS: Record<string, (id: string) => string> = {
  product: (id) => `/catalog/products/${id}/detail`,
  stockarticle: (id) => `/inventory/stock/${id}/detail`,
  customer: (id) => `/sales/customers/${id}/detail`,
  order: (id) => `/sales/orders/${id}/detail`,
  invoice: (id) => `/sales/invoices/${id}/detail`,
  supplier: (id) => `/procurement/suppliers/${id}/detail`,
  purchaseorder: (id) => `/procurement/pos/${id}/detail`,
  goodsreceipt: (id) => `/procurement/receipts/${id}/detail`,
  journal: (id) => `/finance/journals/${id}/detail`,
  productionorder: (id) => `/production/porders/${id}/detail`,
  bomline: (id) => `/production/bom/${id}/detail`,
  inspection: (id) => `/quality/inspections/${id}/detail`,
  shipment: (id) => `/shipments/shipments/${id}/detail`,
};

/**
 * Full-page record detail — the drill-down a clicked list row opens.
 * Fetches client-side so the app JWT (in the browser) authenticates the calls;
 * a server component can't see the token. Lives under the (erp) shell.
 *
 * Route: /<module>/<tab>/<recordId>  (recordId = row index in the store)
 */
export default function RecordPage({
  params,
}: {
  params: { module: string; tab: string; recordId: string };
}) {
  const mod = getModule(params.module);
  const tab = getTab(params.module, params.tab);
  const type = detailTypeFor(params.module, params.tab);
  const index = Number.parseInt(params.recordId, 10);
  const valid = !!mod && !!tab && !!type && !Number.isNaN(index);

  const [loading, setLoading] = React.useState(true);
  const [missing, setMissing] = React.useState(false);
  const [screen, setScreen] = React.useState<ScreenConfig | null>(null);
  const [model, setModel] = React.useState<DetailModel | undefined>(undefined);
  const [recordId, setRecordId] = React.useState<string | undefined>(undefined);
  // Bumped after an in-place save to re-fetch the record client-side.
  const [nonce, setNonce] = React.useState(0);
  const reload = React.useCallback(() => setNonce((n) => n + 1), []);

  React.useEffect(() => {
    if (!valid) { setLoading(false); setMissing(true); return; }
    let cancelled = false;
    (async () => {
      try {
        const scr = await fetchScreen(params.module, params.tab);
        if (cancelled) return;
        if (scr.kind !== "list" || !scr.rows[index]) { setMissing(true); return; }
        setScreen(scr);
        const rid = scr.ids?.[index];
        setRecordId(rid);
        const detailPath = type ? BACKEND_DETAILS[type] : undefined;
        if (USE_BACKEND && rid && detailPath) {
          try {
            const m = await apiGet<DetailModel>(detailPath(rid));
            if (!cancelled) setModel(m);
          } catch {
            /* fall back to the mock builder */
          }
        }
      } catch {
        if (!cancelled) setMissing(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.module, params.tab, params.recordId, nonce]);

  if (!valid || missing) notFound();

  if (loading || !screen) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] font-semibold text-muted-foreground">
        Loading…
      </div>
    );
  }

  const row = (screen.kind === "list" ? screen.rows[index] : undefined) as Cell[] | undefined;
  if (!row) notFound();

  // Production orders use a bespoke stage-timeline drill-down.
  if (mod!.id === "production" && tab!.id === "porders" && recordId) {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <ProductionOrderDetail publicId={recordId} backHref={`/${mod!.id}/${tab!.id}`} />
      </div>
    );
  }

  return (
    <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
      <RecordDetailPage
        type={type!}
        row={row}
        columns={screen.kind === "list" ? screen.columns : []}
        backHref={`/${mod!.id}/${tab!.id}`}
        backLabel={tab!.label}
        model={model}
        module={mod!.id}
        recordId={recordId}
        reload={reload}
      />
    </div>
  );
}
