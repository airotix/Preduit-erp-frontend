"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { getModule, getTab } from "@/config/navigation";
import { detailTypeFor } from "@/config/detail-types";
import { fetchScreen } from "@/modules/registry";
import { RecordDetailPage } from "@/components/screens/record-detail-page";
import { ProductionOrderDetail } from "@/components/screens/production/production-order-detail";
import { OrderHistoryDetail } from "@/components/screens/order-history/order-history-detail";
import { ApiError, apiGet, USE_BACKEND } from "@/lib/api-client";
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
export default function RecordPage() {
  const params = useParams<{ module: string; tab: string; recordId: string }>();
  const mod = getModule(params.module);
  const tab = getTab(params.module, params.tab);
  const type = detailTypeFor(params.module, params.tab);
  const index = Number.parseInt(params.recordId, 10);
  const isPublicId = USE_BACKEND && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.recordId);
  const valid = !!mod && !!tab && !!type && (isPublicId || !Number.isNaN(index));

  const detail = useQuery({
    queryKey: ["detail", params.module, params.tab, params.recordId],
    enabled: valid,
    queryFn: async (): Promise<{ screen: ScreenConfig; model?: DetailModel; recordId?: string } | null> => {
      // Stable cross-module links must work even outside the first list page.
      if (isPublicId && type && BACKEND_DETAILS[type]) {
        const model = await apiGet<DetailModel>(BACKEND_DETAILS[type](params.recordId));
        return { model, recordId: params.recordId, screen: { kind: "list", rows: [[]], columns: [] } };
      }
      const screen = await fetchScreen(params.module, params.tab);
      if (screen.kind !== "list" || !screen.rows[index]) return null;
      const recordId = screen.ids?.[index];
      const detailPath = type ? BACKEND_DETAILS[type] : undefined;
      let model: DetailModel | undefined;
      if (USE_BACKEND && recordId && detailPath) {
        try {
          model = await apiGet<DetailModel>(detailPath(recordId));
        } catch {
          /* fall back to the mock builder */
        }
      }
      return { screen, model, recordId };
    },
  });
  const { refetch } = detail;
  const reload = React.useCallback(() => { void refetch(); }, [refetch]);

  if (!valid || detail.data === null || (detail.error instanceof ApiError && detail.error.status === 404)) notFound();

  if (detail.isError && !detail.data) {
    return <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm">
      <p role="alert">Could not load this record.</p>
      <button type="button" onClick={reload} className="rounded-md border px-4 py-2">Retry</button>
    </div>;
  }

  if (!detail.data) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] font-semibold text-muted-foreground">
        Loading…
      </div>
    );
  }
  const { screen, model, recordId } = detail.data;

  const row = (screen.kind === "list" ? screen.rows[isPublicId ? 0 : index] : undefined) as Cell[] | undefined;
  if (!row) notFound();

  // Production orders use a bespoke stage-timeline drill-down.
  if (mod!.id === "production" && tab!.id === "porders" && recordId) {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <ProductionOrderDetail publicId={recordId} backHref={`/${mod!.id}/${tab!.id}`} />
      </div>
    );
  }

  // Order History rows open a cross-module drill-down (Order/Production/
  // Quality/Shipment/Finance tabs) instead of the generic record detail.
  if (mod!.id === "orderhistory" && tab!.id === "shipped" && recordId) {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <OrderHistoryDetail publicId={recordId} backHref={`/${mod!.id}/${tab!.id}`} />
      </div>
    );
  }

  return (
    <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
      <RecordDetailPage
        key={`${params.module}/${params.tab}/${params.recordId}`}
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
