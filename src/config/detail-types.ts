/**
 * Which list screens open a slide-over detail when a row is clicked,
 * and the detail "type" each maps to — ported from the original mock's
 * `onRow: openDetail(type, row)` wiring.
 */
export const DETAIL_TYPES: Record<string, string> = {
  "catalog/products": "product",
  "inventory/stock": "stockarticle",
  "sales/orders": "order",
  "sales/invoices": "invoice",
  "sales/customers": "customer",
  "procurement/pos": "purchaseorder",
  "procurement/suppliers": "supplier",
  "procurement/scorecard": "supplier",
  "procurement/receipts": "goodsreceipt",
  "finance/journals": "journal",
  "quality/inspections": "inspection",
  "shipments/shipments": "shipment",
  "ai/aireports": "aireport",
  "production/porders": "productionorder",
  "production/bom": "bomline",
  "orderhistory/shipped": "orderhistory",
};

export function detailTypeFor(
  module: string,
  tab: string
): string | undefined {
  return DETAIL_TYPES[`${module}/${tab}`];
}
