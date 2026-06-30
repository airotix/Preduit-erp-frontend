import type { Tone } from "@/lib/tone";

export interface QuickCreateItem {
  label: string;
  icon: string;
  bg: string;
  color: string;
  href: string;
}

/** Quick-create menu — ported from the mock's `quickItems`. */
export const QUICK_CREATE: QuickCreateItem[] = [
  { label: "Sales order", icon: "ShoppingBag", bg: "#FCEADF", color: "#C2511A", href: "/sales/orders" },
  { label: "Product", icon: "Shirt", bg: "#E7E9F0", color: "#3A4256", href: "/catalog/products" },
  { label: "Purchase order", icon: "Truck", bg: "#EAF5EF", color: "#1F7A53", href: "/procurement/pos" },
  { label: "Stock transfer", icon: "ArrowLeftRight", bg: "#FBF3E6", color: "#9C6B0E", href: "/inventory/transfers" },
  { label: "Customer", icon: "UserPlus", bg: "#E7E9F0", color: "#3A4256", href: "/sales/customers" },
  { label: "Inspection", icon: "BadgeCheck", bg: "#FCEADF", color: "#C2511A", href: "/quality/inspections" },
];

export interface Notification {
  icon: string;
  tone: Tone;
  text: string;
  time: string;
  unread: boolean;
}

/** Notifications feed — ported from the mock's `notifs`. */
export const NOTIFICATIONS: Notification[] = [
  { icon: "AlertTriangle", tone: "red", text: "Wool Overcoat · Charcoal · M is out of stock", time: "32 min ago", unread: true },
  { icon: "CheckCircle2", tone: "green", text: "PO-5581 confirmed by Lahore Textile Co.", time: "1 hr ago", unread: true },
  { icon: "Truck", tone: "navy", text: "Shipment SHP-9910 cleared customs in Stockholm", time: "2 hrs ago", unread: true },
  { icon: "BadgeCheck", tone: "red", text: "Inspection QC-7739 failed AQL 2.5 · 11 defects", time: "3 hrs ago", unread: true },
  { icon: "RefreshCw", tone: "amber", text: "Zalando price sync returned 3 errors", time: "4 hrs ago", unread: true },
  { icon: "ShoppingBag", tone: "accent", text: "New wholesale order from Nordic Retail Group", time: "Yesterday", unread: false },
];
