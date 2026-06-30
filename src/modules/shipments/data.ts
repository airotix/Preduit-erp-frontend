import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the shipments module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "shipments": {
    "kind": "list",
    "search": "Search shipments…",
    "action": "New shipment",
    "filters": [
      "Carrier",
      "Status"
    ],
    "columns": [
      {
        "label": "Shipment"
      },
      {
        "label": "Order"
      },
      {
        "label": "Carrier"
      },
      {
        "label": "Destination"
      },
      {
        "label": "Status"
      },
      {
        "label": "ETA"
      }
    ],
    "rows": [
      [
        {
          "t": "SHP-9912",
          "strong": true,
          "mono": true
        },
        "#SO-12353",
        "DHL Express",
        "Paris, FR",
        {
          "badge": "amber",
          "t": "In transit"
        },
        "29 Jun"
      ],
      [
        {
          "t": "SHP-9911",
          "strong": true,
          "mono": true
        },
        "#SO-12348",
        "FedEx",
        "Lisbon, PT",
        {
          "badge": "green",
          "t": "Delivered"
        },
        "25 Jun"
      ],
      [
        {
          "t": "SHP-9910",
          "strong": true,
          "mono": true
        },
        "#SO-12350",
        "Maersk LCL",
        "Stockholm, SE",
        {
          "badge": "navy",
          "t": "Customs"
        },
        "04 Jul"
      ],
      [
        {
          "t": "SHP-9909",
          "strong": true,
          "mono": true
        },
        "#SO-12351",
        "Aramex",
        "Singapore, SG",
        {
          "badge": "neutral",
          "t": "Label created"
        },
        "01 Jul"
      ]
    ]
  },
  "carriers": {
    "kind": "list",
    "search": "Search carriers…",
    "action": "New carrier",
    "filters": [],
    "columns": [
      {
        "label": "Carrier"
      },
      {
        "label": "Service"
      },
      {
        "label": "Avg transit"
      },
      {
        "label": "On-time",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "DHL Express",
          "strong": true
        },
        "Air · Express",
        "2–3 days",
        {
          "t": "96%",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "FedEx",
          "strong": true
        },
        "Air · Priority",
        "3–4 days",
        {
          "t": "93%",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Maersk LCL",
          "strong": true
        },
        "Sea · LCL",
        "18–24 days",
        {
          "t": "88%",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Active"
        }
      ]
    ]
  }
};
