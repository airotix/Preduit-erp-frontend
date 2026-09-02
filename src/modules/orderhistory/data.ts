import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the Order History module (no-backend/demo mode). */
export const screens: Record<string, ScreenConfig> = {
  "shipped": {
    kind: "list",
    search: "Search order history…",
    filters: ["Channel", "Status"],
    columns: [
      { label: "Order" },
      { label: "Customer" },
      { label: "Channel" },
      { label: "Placed" },
      { label: "Total", align: "right" },
      { label: "Status" },
    ],
    rows: [
      [
        { t: "#SO-12348", strong: true, mono: true },
        { t: "Nordic Outfitters", avatar: true, sub: "Wholesale" },
        { t: "Wholesale", badge: "neutral" },
        "25 Jun 2026",
        { t: "€18,420", align: "right", mono: true, strong: true },
        { t: "Shipped", badge: "green" },
      ],
      [
        { t: "#SO-12350", strong: true, mono: true },
        { t: "Atelier Lisboa", avatar: true, sub: "Retail" },
        { t: "Retail", badge: "neutral" },
        "01 Jul 2026",
        { t: "€3,110", align: "right", mono: true, strong: true },
        { t: "Packed", badge: "navy" },
      ],
    ],
  },
};
