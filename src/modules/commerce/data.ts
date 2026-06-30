import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the commerce module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "channels": {
    "kind": "list",
    "search": "Search channels…",
    "action": "Connect channel",
    "filters": [],
    "columns": [
      {
        "label": "Channel"
      },
      {
        "label": "Type"
      },
      {
        "label": "Listings",
        "align": "right"
      },
      {
        "label": "Last sync"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Shopify · DTC Store",
          "avatar": true,
          "sub": "shop.systemsapparel.com"
        },
        {
          "badge": "accent",
          "t": "Storefront"
        },
        {
          "t": "1,204",
          "align": "right",
          "mono": true
        },
        "3 min ago",
        {
          "badge": "green",
          "t": "Synced"
        }
      ],
      [
        {
          "t": "Amazon EU",
          "avatar": true,
          "sub": "Marketplace"
        },
        {
          "badge": "neutral",
          "t": "Marketplace"
        },
        {
          "t": "842",
          "align": "right",
          "mono": true
        },
        "12 min ago",
        {
          "badge": "green",
          "t": "Synced"
        }
      ],
      [
        {
          "t": "Zalando",
          "avatar": true,
          "sub": "Marketplace"
        },
        {
          "badge": "neutral",
          "t": "Marketplace"
        },
        {
          "t": "410",
          "align": "right",
          "mono": true
        },
        "1 hr ago",
        {
          "badge": "amber",
          "t": "Sync warning"
        }
      ],
      [
        {
          "t": "Faire Wholesale",
          "avatar": true,
          "sub": "B2B"
        },
        {
          "badge": "navy",
          "t": "B2B"
        },
        {
          "t": "286",
          "align": "right",
          "mono": true
        },
        "2 hrs ago",
        {
          "badge": "green",
          "t": "Synced"
        }
      ]
    ]
  },
  "synclogs": {
    "kind": "list",
    "search": "Search sync logs…",
    "action": "Retry failed",
    "filters": [
      "Channel",
      "Result"
    ],
    "columns": [
      {
        "label": "Time"
      },
      {
        "label": "Channel"
      },
      {
        "label": "Operation"
      },
      {
        "label": "Records",
        "align": "right"
      },
      {
        "label": "Result"
      }
    ],
    "rows": [
      [
        {
          "t": "14:32",
          "mono": true
        },
        "Shopify",
        "Inventory push",
        {
          "t": "1,204",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Success"
        }
      ],
      [
        {
          "t": "14:20",
          "mono": true
        },
        "Zalando",
        "Price update",
        {
          "t": "410",
          "align": "right",
          "mono": true
        },
        {
          "badge": "red",
          "t": "3 errors"
        }
      ],
      [
        {
          "t": "13:58",
          "mono": true
        },
        "Amazon EU",
        "Order import",
        {
          "t": "46",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Success"
        }
      ]
    ]
  }
};
