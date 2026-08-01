import { notFound } from "next/navigation";
import { getModule, getTab } from "@/config/navigation";
import { detailTypeFor } from "@/config/detail-types";
import { fetchScreen } from "@/modules/registry";
import { RecordDetailPage } from "@/components/screens/record-detail-page";
import { ProductionOrderDetail } from "@/components/screens/production/production-order-detail";
import { apiGet, USE_BACKEND } from "@/lib/api-client";
import type { Cell } from "@/lib/screen-types";
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
 * Ported to behave like the original Apparel ERP HTML, which navigates to a
 * dedicated page with its own sub-tabs (Overview, Variant matrix, …) instead
 * of a slide-over. Lives under the same (erp) shell, so the rail + topbar stay.
 *
 * Route: /<module>/<tab>/<recordId>  (recordId = row index in the store)
 */
export default async function RecordPage({
  params,
}: {
  params: { module: string; tab: string; recordId: string };
}) {
  const mod = getModule(params.module);
  const tab = getTab(params.module, params.tab);
  const type = detailTypeFor(params.module, params.tab);
  if (!mod || !tab || !type) notFound();

  const index = Number.parseInt(params.recordId, 10);
  if (Number.isNaN(index)) notFound();

  const screen = await fetchScreen(params.module, params.tab);
  if (screen.kind !== "list") notFound();

  const row = screen.rows[index] as Cell[] | undefined;
  if (!row) notFound();

  const recordId = screen.ids?.[index];

  // Production orders use a bespoke stage-timeline drill-down.
  if (mod.id === "production" && tab.id === "porders" && recordId) {
    return (
      <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
        <ProductionOrderDetail publicId={recordId} backHref={`/${mod.id}/${tab.id}`} />
      </div>
    );
  }

  // If this row has a real backend id and the type has a detail endpoint,
  // fetch the live detail model; otherwise fall back to the mock builder.
  let model: DetailModel | undefined;
  const detailPath = BACKEND_DETAILS[type];
  if (USE_BACKEND && recordId && detailPath) {
    try {
      model = await apiGet<DetailModel>(detailPath(recordId));
    } catch {
      model = undefined; // fall back to mock on any error
    }
  }

  return (
    <div className="erp-scroll flex-1 overflow-y-auto px-[26px] pb-7 pt-[18px]">
      <RecordDetailPage
        type={type}
        row={row}
        columns={screen.columns}
        backHref={`/${mod.id}/${tab.id}`}
        backLabel={tab.label}
        model={model}
        module={mod.id}
        recordId={recordId}
      />
    </div>
  );
}
