export type ScreenKind = "dashboard" | "list" | "board" | "settings";

export interface TabDef {
  id: string;
  label: string;
  kind: ScreenKind;
}

export interface ModuleDef {
  id: string;
  /** lucide-react icon name (PascalCase resolved in the rail) */
  icon: string;
  label: string;
  tabs: TabDef[];
}

/**
 * The full module / tab map for Apparel ERP — ported from the original mock.
 * The left rail renders one entry per module; the topbar renders that
 * module's tabs. Routing is /<module>/<tab>.
 */
export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    icon: "LayoutGrid",
    label: "Dashboards",
    tabs: [
      { id: "overview", label: "Operations", kind: "dashboard" },
      { id: "invdash", label: "Inventory", kind: "dashboard" },
      { id: "salesdash", label: "Sales", kind: "dashboard" },
      { id: "proddash", label: "Production", kind: "dashboard" },
      { id: "findash", label: "Finance", kind: "dashboard" },
    ],
  },
  {
    id: "catalog",
    icon: "Shirt",
    label: "Catalog",
    tabs: [
      { id: "products", label: "Products", kind: "list" },
      { id: "categories", label: "Categories", kind: "list" },
    ],
  },
  {
    id: "inventory",
    icon: "Layers",
    label: "Inventory",
    tabs: [
      { id: "stock", label: "Stock Levels", kind: "list" },
      { id: "locations", label: "Locations", kind: "list" },
      { id: "transfers", label: "Transfers", kind: "list" },
      { id: "alerts", label: "Reorder Alerts", kind: "list" },
    ],
  },
  {
    id: "sales",
    icon: "ShoppingCart",
    label: "Sales & Orders",
    tabs: [
      { id: "orders", label: "Orders", kind: "list" },
      { id: "board", label: "Fulfillment Board", kind: "board" },
      { id: "invoices", label: "Invoices", kind: "list" },
      { id: "customers", label: "Customers", kind: "list" },
      { id: "returns", label: "Returns", kind: "list" },
    ],
  },
  {
    id: "procurement",
    icon: "Truck",
    label: "Procurement",
    tabs: [
      { id: "pos", label: "Purchase Orders", kind: "list" },
      { id: "approvals", label: "Approval Queue", kind: "board" },
      { id: "receipts", label: "Invoices", kind: "list" },
      { id: "suppliers", label: "Suppliers", kind: "list" },
    ],
  },
  {
    id: "finance",
    icon: "Landmark",
    label: "Finance",
    tabs: [
      { id: "overview", label: "Overview", kind: "dashboard" },
      { id: "customerledger", label: "Customer ledger", kind: "list" },
      { id: "supplierledger", label: "Supplier ledger", kind: "list" },
      { id: "profitability", label: "Profitability", kind: "dashboard" },
      { id: "reports", label: "Reports", kind: "dashboard" },
      { id: "banking", label: "Banking", kind: "dashboard" },
    ],
  },
  {
    id: "production",
    icon: "Factory",
    label: "Production",
    tabs: [
      { id: "porders", label: "Orders", kind: "list" },
      { id: "pboard", label: "Stage Board", kind: "board" },
      { id: "bom", label: "Bill of Materials", kind: "list" },
    ],
  },
  {
    id: "quality",
    icon: "BadgeCheck",
    label: "Quality",
    tabs: [
      { id: "inspections", label: "Inspections", kind: "list" },
      { id: "defects", label: "Defect Types", kind: "list" },
      { id: "qscores", label: "Quality Scores", kind: "dashboard" },
    ],
  },
  {
    id: "shipments",
    icon: "Package",
    label: "Shipments",
    tabs: [
      { id: "shipments", label: "Shipments", kind: "list" },
      { id: "carriers", label: "Carriers", kind: "list" },
    ],
  },
  {
    id: "commerce",
    icon: "Globe",
    label: "Channels",
    tabs: [
      { id: "channels", label: "Connections", kind: "list" },
      { id: "synclogs", label: "Sync Logs", kind: "list" },
    ],
  },
  {
    id: "ai",
    icon: "BrainCircuit",
    label: "Demand Planning",
    tabs: [
      { id: "setup", label: "Setup", kind: "settings" },
      { id: "productkpis", label: "Product KPIs", kind: "dashboard" },
      { id: "recommendations", label: "SKU Recommendations", kind: "list" },
      { id: "projection", label: "Demand Projection", kind: "list" },
      { id: "customers", label: "Customer Coverage", kind: "list" },
      { id: "validation", label: "Order Validation", kind: "list" },
    ],
  },
  {
    id: "admin",
    icon: "Settings",
    label: "Admin",
    tabs: [
      { id: "users", label: "Users", kind: "list" },
      { id: "roles", label: "Roles", kind: "list" },
      { id: "approvalrules", label: "Approval Rules", kind: "list" },
      { id: "notifsettings", label: "Notifications", kind: "settings" },
      { id: "doclibrary", label: "Documents", kind: "list" },
      { id: "syssettings", label: "System Settings", kind: "settings" },
      { id: "audit", label: "Audit Log", kind: "list" },
    ],
  },
];

export function getModule(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getTab(moduleId: string, tabId: string): TabDef | undefined {
  return getModule(moduleId)?.tabs.find((t) => t.id === tabId);
}

export function firstTab(moduleId: string): string | undefined {
  return getModule(moduleId)?.tabs[0]?.id;
}
