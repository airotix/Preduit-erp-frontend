import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the dashboard module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "overview": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Net revenue",
        "value": "€4.82M",
        "delta": "12.4%",
        "up": true,
        "sub": "vs last quarter",
        "icon": "banknote",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Open orders",
        "value": "1,284",
        "delta": "6.1%",
        "up": true,
        "sub": "342 to fulfill",
        "icon": "shopping-bag",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Units shipped",
        "value": "86.4K",
        "delta": "9.3%",
        "up": true,
        "sub": "this season",
        "icon": "package-check",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Stock health",
        "value": "92%",
        "delta": "1.2%",
        "up": false,
        "sub": "14 SKUs low",
        "icon": "gauge",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      }
    ],
    "chartTitle": "Revenue trend",
    "chartSub": "Monthly net revenue vs target · 2026",
    "bars": [
      34,
      42,
      55,
      38,
      60,
      72,
      48,
      80,
      58,
      66,
      74,
      90
    ],
    "donutTitle": "Orders by channel",
    "donutTotal": "1,284",
    "donut": [
      {
        "label": "Wholesale",
        "value": "42%",
        "pct": 42,
        "color": "#262B3F"
      },
      {
        "label": "Online (DTC)",
        "value": "28%",
        "pct": 28,
        "color": "#5B6478"
      },
      {
        "label": "Marketplace",
        "value": "21%",
        "pct": 21,
        "color": "#A9AEBC"
      },
      {
        "label": "Retail stores",
        "value": "9%",
        "pct": 9,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Top-selling styles",
    "tableCols": [
      {
        "l": "Style",
        "a": "left"
      },
      {
        "l": "Season",
        "a": "left"
      },
      {
        "l": "Units",
        "a": "right"
      },
      {
        "l": "Revenue",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Oxford Shirt",
        "Core",
        "4,210",
        "€290K",
        "#262B3F"
      ],
      [
        "Tailored Chino Pant",
        "Core",
        "3,860",
        "€343K",
        "#5B6478"
      ],
      [
        "Merino Crew Knit",
        "Fall '26",
        "2,140",
        "€276K",
        "#8A6D3B"
      ],
      [
        "Stretch Denim Jean",
        "Core",
        "1,980",
        "€196K",
        "#4A6B5D"
      ],
      [
        "Quilted Field Jacket",
        "Fall '26",
        "1,240",
        "€296K",
        "#6E5B7B"
      ]
    ],
    "activity": [
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "PO-5582 approved by Ayesha Khan",
        "time": "8 min ago"
      },
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "Wool Overcoat · Charcoal · M out of stock",
        "time": "32 min ago"
      },
      {
        "icon": "truck",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "Shipment SHP-9912 picked up by DHL",
        "time": "1 hr ago"
      },
      {
        "icon": "shopping-bag",
        "bg": "#FCEADF",
        "color": "#C2511A",
        "text": "New wholesale order #SO-12352 · €18,240",
        "time": "2 hrs ago"
      },
      {
        "icon": "refresh-cw",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Shopify inventory synced · 1,204 listings",
        "time": "3 hrs ago"
      }
    ]
  },
  "invdash": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Net revenue",
        "value": "€4.82M",
        "delta": "12.4%",
        "up": true,
        "sub": "vs last quarter",
        "icon": "banknote",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Open orders",
        "value": "1,284",
        "delta": "6.1%",
        "up": true,
        "sub": "342 to fulfill",
        "icon": "shopping-bag",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Units shipped",
        "value": "86.4K",
        "delta": "9.3%",
        "up": true,
        "sub": "this season",
        "icon": "package-check",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Stock health",
        "value": "92%",
        "delta": "1.2%",
        "up": false,
        "sub": "14 SKUs low",
        "icon": "gauge",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      }
    ],
    "chartTitle": "Inventory value trend",
    "chartSub": "Stock-on-hand value · 2026",
    "bars": [
      34,
      42,
      55,
      38,
      60,
      72,
      48,
      80,
      58,
      66,
      74,
      90
    ],
    "donutTitle": "Orders by channel",
    "donutTotal": "1,284",
    "donut": [
      {
        "label": "Wholesale",
        "value": "42%",
        "pct": 42,
        "color": "#262B3F"
      },
      {
        "label": "Online (DTC)",
        "value": "28%",
        "pct": 28,
        "color": "#5B6478"
      },
      {
        "label": "Marketplace",
        "value": "21%",
        "pct": 21,
        "color": "#A9AEBC"
      },
      {
        "label": "Retail stores",
        "value": "9%",
        "pct": 9,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Top-selling styles",
    "tableCols": [
      {
        "l": "Style",
        "a": "left"
      },
      {
        "l": "Season",
        "a": "left"
      },
      {
        "l": "Units",
        "a": "right"
      },
      {
        "l": "Revenue",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Oxford Shirt",
        "Core",
        "4,210",
        "€290K",
        "#262B3F"
      ],
      [
        "Tailored Chino Pant",
        "Core",
        "3,860",
        "€343K",
        "#5B6478"
      ],
      [
        "Merino Crew Knit",
        "Fall '26",
        "2,140",
        "€276K",
        "#8A6D3B"
      ],
      [
        "Stretch Denim Jean",
        "Core",
        "1,980",
        "€196K",
        "#4A6B5D"
      ],
      [
        "Quilted Field Jacket",
        "Fall '26",
        "1,240",
        "€296K",
        "#6E5B7B"
      ]
    ],
    "activity": [
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "PO-5582 approved by Ayesha Khan",
        "time": "8 min ago"
      },
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "Wool Overcoat · Charcoal · M out of stock",
        "time": "32 min ago"
      },
      {
        "icon": "truck",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "Shipment SHP-9912 picked up by DHL",
        "time": "1 hr ago"
      },
      {
        "icon": "shopping-bag",
        "bg": "#FCEADF",
        "color": "#C2511A",
        "text": "New wholesale order #SO-12352 · €18,240",
        "time": "2 hrs ago"
      },
      {
        "icon": "refresh-cw",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Shopify inventory synced · 1,204 listings",
        "time": "3 hrs ago"
      }
    ]
  },
  "salesdash": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Net revenue",
        "value": "€4.82M",
        "delta": "12.4%",
        "up": true,
        "sub": "vs last quarter",
        "icon": "banknote",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Open orders",
        "value": "1,284",
        "delta": "6.1%",
        "up": true,
        "sub": "342 to fulfill",
        "icon": "shopping-bag",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Units shipped",
        "value": "86.4K",
        "delta": "9.3%",
        "up": true,
        "sub": "this season",
        "icon": "package-check",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Stock health",
        "value": "92%",
        "delta": "1.2%",
        "up": false,
        "sub": "14 SKUs low",
        "icon": "gauge",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      }
    ],
    "chartTitle": "Sales trend",
    "chartSub": "Net sales vs target · 2026",
    "bars": [
      34,
      42,
      55,
      38,
      60,
      72,
      48,
      80,
      58,
      66,
      74,
      90
    ],
    "donutTitle": "Orders by channel",
    "donutTotal": "1,284",
    "donut": [
      {
        "label": "Wholesale",
        "value": "42%",
        "pct": 42,
        "color": "#262B3F"
      },
      {
        "label": "Online (DTC)",
        "value": "28%",
        "pct": 28,
        "color": "#5B6478"
      },
      {
        "label": "Marketplace",
        "value": "21%",
        "pct": 21,
        "color": "#A9AEBC"
      },
      {
        "label": "Retail stores",
        "value": "9%",
        "pct": 9,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Top-selling styles",
    "tableCols": [
      {
        "l": "Style",
        "a": "left"
      },
      {
        "l": "Season",
        "a": "left"
      },
      {
        "l": "Units",
        "a": "right"
      },
      {
        "l": "Revenue",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Oxford Shirt",
        "Core",
        "4,210",
        "€290K",
        "#262B3F"
      ],
      [
        "Tailored Chino Pant",
        "Core",
        "3,860",
        "€343K",
        "#5B6478"
      ],
      [
        "Merino Crew Knit",
        "Fall '26",
        "2,140",
        "€276K",
        "#8A6D3B"
      ],
      [
        "Stretch Denim Jean",
        "Core",
        "1,980",
        "€196K",
        "#4A6B5D"
      ],
      [
        "Quilted Field Jacket",
        "Fall '26",
        "1,240",
        "€296K",
        "#6E5B7B"
      ]
    ],
    "activity": [
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "PO-5582 approved by Ayesha Khan",
        "time": "8 min ago"
      },
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "Wool Overcoat · Charcoal · M out of stock",
        "time": "32 min ago"
      },
      {
        "icon": "truck",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "Shipment SHP-9912 picked up by DHL",
        "time": "1 hr ago"
      },
      {
        "icon": "shopping-bag",
        "bg": "#FCEADF",
        "color": "#C2511A",
        "text": "New wholesale order #SO-12352 · €18,240",
        "time": "2 hrs ago"
      },
      {
        "icon": "refresh-cw",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Shopify inventory synced · 1,204 listings",
        "time": "3 hrs ago"
      }
    ]
  },
  "proddash": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Net revenue",
        "value": "€4.82M",
        "delta": "12.4%",
        "up": true,
        "sub": "vs last quarter",
        "icon": "banknote",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Open orders",
        "value": "1,284",
        "delta": "6.1%",
        "up": true,
        "sub": "342 to fulfill",
        "icon": "shopping-bag",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Units shipped",
        "value": "86.4K",
        "delta": "9.3%",
        "up": true,
        "sub": "this season",
        "icon": "package-check",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Stock health",
        "value": "92%",
        "delta": "1.2%",
        "up": false,
        "sub": "14 SKUs low",
        "icon": "gauge",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      }
    ],
    "chartTitle": "Production output",
    "chartSub": "Units produced vs plan · 2026",
    "bars": [
      34,
      42,
      55,
      38,
      60,
      72,
      48,
      80,
      58,
      66,
      74,
      90
    ],
    "donutTitle": "Orders by channel",
    "donutTotal": "1,284",
    "donut": [
      {
        "label": "Wholesale",
        "value": "42%",
        "pct": 42,
        "color": "#262B3F"
      },
      {
        "label": "Online (DTC)",
        "value": "28%",
        "pct": 28,
        "color": "#5B6478"
      },
      {
        "label": "Marketplace",
        "value": "21%",
        "pct": 21,
        "color": "#A9AEBC"
      },
      {
        "label": "Retail stores",
        "value": "9%",
        "pct": 9,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Top-selling styles",
    "tableCols": [
      {
        "l": "Style",
        "a": "left"
      },
      {
        "l": "Season",
        "a": "left"
      },
      {
        "l": "Units",
        "a": "right"
      },
      {
        "l": "Revenue",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Oxford Shirt",
        "Core",
        "4,210",
        "€290K",
        "#262B3F"
      ],
      [
        "Tailored Chino Pant",
        "Core",
        "3,860",
        "€343K",
        "#5B6478"
      ],
      [
        "Merino Crew Knit",
        "Fall '26",
        "2,140",
        "€276K",
        "#8A6D3B"
      ],
      [
        "Stretch Denim Jean",
        "Core",
        "1,980",
        "€196K",
        "#4A6B5D"
      ],
      [
        "Quilted Field Jacket",
        "Fall '26",
        "1,240",
        "€296K",
        "#6E5B7B"
      ]
    ],
    "activity": [
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "PO-5582 approved by Ayesha Khan",
        "time": "8 min ago"
      },
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "Wool Overcoat · Charcoal · M out of stock",
        "time": "32 min ago"
      },
      {
        "icon": "truck",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "Shipment SHP-9912 picked up by DHL",
        "time": "1 hr ago"
      },
      {
        "icon": "shopping-bag",
        "bg": "#FCEADF",
        "color": "#C2511A",
        "text": "New wholesale order #SO-12352 · €18,240",
        "time": "2 hrs ago"
      },
      {
        "icon": "refresh-cw",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Shopify inventory synced · 1,204 listings",
        "time": "3 hrs ago"
      }
    ]
  },
  "findash": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Cash position",
        "value": "€1.84M",
        "delta": "4.2%",
        "up": true,
        "sub": "3 bank accounts",
        "icon": "wallet",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Accounts receivable",
        "value": "€642K",
        "delta": "2.1%",
        "up": false,
        "sub": "€11.9K overdue",
        "icon": "arrow-down-left",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Accounts payable",
        "value": "€488K",
        "delta": "5.8%",
        "up": true,
        "sub": "€61.2K aging 90+",
        "icon": "arrow-up-right",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      },
      {
        "label": "Revenue vs target",
        "value": "104%",
        "delta": "4.0%",
        "up": true,
        "sub": "Q2 2026",
        "icon": "target",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      }
    ],
    "chartTitle": "Revenue vs target",
    "chartSub": "Net revenue against plan · 2026",
    "bars": [
      38,
      46,
      58,
      42,
      62,
      75,
      52,
      82,
      60,
      70,
      78,
      94
    ],
    "donutTitle": "Cash by account",
    "donutTotal": "€1.84M",
    "donut": [
      {
        "label": "Operating",
        "value": "58%",
        "pct": 58,
        "color": "#262B3F"
      },
      {
        "label": "Reserve",
        "value": "27%",
        "pct": 27,
        "color": "#5B6478"
      },
      {
        "label": "FX · AED",
        "value": "15%",
        "pct": 15,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Largest open balances",
    "tableCols": [
      {
        "l": "Party",
        "a": "left"
      },
      {
        "l": "Type",
        "a": "left"
      },
      {
        "l": "Age",
        "a": "right"
      },
      {
        "l": "Balance",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Nordic Retail Group",
        "Receivable",
        "Current",
        "€18,240",
        "#262B3F"
      ],
      [
        "Studio Norte",
        "Receivable",
        "31–60",
        "€11,900",
        "#D9534F"
      ],
      [
        "Anhui Knit Mills",
        "Payable",
        "Current",
        "€42,800",
        "#5B6478"
      ],
      [
        "Bursa Denim A.S.",
        "Payable",
        "61–90",
        "€61,200",
        "#8A6D3B"
      ]
    ],
    "activity": [
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Payment cleared · Boutique Atlas €9,460",
        "time": "1 hr ago"
      },
      {
        "icon": "landmark",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "JE-4470 posted · inventory & AP",
        "time": "3 hrs ago"
      },
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "Studio Norte invoice now 31 days overdue",
        "time": "Yesterday"
      }
    ]
  }
};
