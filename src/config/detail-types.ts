/**
 * Which list screens open a slide-over detail when a row is clicked,
 * and the detail "type" each maps to — ported from the original mock's
 * `onRow: openDetail(type, row)` wiring.
 */
export const DETAIL_TYPES: Record<string, string> = {
  "catalog/products": "product",
  "sales/orders": "order",
  "sales/invoices": "invoice",
  "sales/customers": "customer",
  "procurement/suppliers": "supplier",
  "procurement/scorecard": "supplier",
  "procurement/receipts": "goodsreceipt",
  "finance/journals": "journal",
  "quality/inspections": "inspection",
  "shipments/shipments": "shipment",
  "ai/aireports": "aireport",
};

export function detailTypeFor(
  module: string,
  tab: string
): string | undefined {
  return DETAIL_TYPES[`${module}/${tab}`];
}
